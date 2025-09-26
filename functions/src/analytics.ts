import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface AnalyticsEvent {
  event: string;
  params?: Record<string, any>;
  timestamp: admin.firestore.Timestamp;
  platform: string;
  appVersion: string;
  userId?: string;
  familyId?: string;
  sessionId?: string;
  deviceId?: string;
}

interface EventAggregate {
  event: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: admin.firestore.Timestamp;
  endTime: admin.firestore.Timestamp;
  count: number;
  uniqueUsers: number;
  platforms: Record<string, number>;
  appVersions: Record<string, number>;
  metadata?: Record<string, any>;
}

interface UserActivitySummary {
  userId: string;
  period: 'day' | 'week' | 'month';
  startTime: admin.firestore.Timestamp;
  endTime: admin.firestore.Timestamp;
  events: Record<string, number>;
  sessionsCount: number;
  totalDuration: number;
  lastActiveAt: admin.firestore.Timestamp;
}

/**
 * HTTP endpoint to receive analytics events from the app
 */
export const trackAnalyticsEvent = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    const eventData = req.body as AnalyticsEvent;
    
    // Validate required fields
    if (!eventData.event || !eventData.platform) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Add server timestamp
    eventData.timestamp = admin.firestore.Timestamp.now();
    
    // Save to Firestore
    const docRef = await db.collection('analyticsEvents').add(eventData);
    
    // Track key business metrics
    await trackBusinessMetrics(eventData);
    
    res.status(200).json({
      success: true,
      eventId: docRef.id,
    });
    
  } catch (error) {
    console.error('[trackAnalyticsEvent] Failed to save event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Batch endpoint for analytics events
 */
export const trackAnalyticsEventsBatch = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    const { events } = req.body as { events: AnalyticsEvent[] };
    
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    
    // Process in batches of 500 (Firestore limit)
    const batch = db.batch();
    const eventIds: string[] = [];
    
    for (let i = 0; i < Math.min(events.length, 500); i++) {
      const event = events[i];
      event.timestamp = admin.firestore.Timestamp.now();
      
      const docRef = db.collection('analyticsEvents').doc();
      batch.set(docRef, event);
      eventIds.push(docRef.id);
    }
    
    await batch.commit();
    
    res.status(200).json({
      success: true,
      processed: eventIds.length,
      eventIds,
    });
    
  } catch (error) {
    console.error('[trackAnalyticsEventsBatch] Failed to save events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Aggregate analytics events every 10 minutes
 */
export const aggregateAnalyticsEvents = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    try {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      // Get events from the last 10 minutes
      const eventsSnapshot = await db.collection('analyticsEvents')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(tenMinutesAgo))
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(now))
        .get();
      
      if (eventsSnapshot.empty) {
        console.log('[aggregateAnalyticsEvents] No events to aggregate');
        return;
      }
      
      // Group events by name
      const eventGroups = new Map<string, AnalyticsEvent[]>();
      const uniqueUsersPerEvent = new Map<string, Set<string>>();
      
      eventsSnapshot.forEach(doc => {
        const event = doc.data() as AnalyticsEvent;
        const group = eventGroups.get(event.event) || [];
        group.push(event);
        eventGroups.set(event.event, group);
        
        // Track unique users
        if (event.userId) {
          const users = uniqueUsersPerEvent.get(event.event) || new Set<string>();
          users.add(event.userId);
          uniqueUsersPerEvent.set(event.event, users);
        }
      });
      
      // Create aggregates
      const batch = db.batch();
      
      for (const [eventName, events] of eventGroups.entries()) {
        const platforms: Record<string, number> = {};
        const appVersions: Record<string, number> = {};
        
        events.forEach(e => {
          platforms[e.platform] = (platforms[e.platform] || 0) + 1;
          appVersions[e.appVersion] = (appVersions[e.appVersion] || 0) + 1;
        });
        
        const aggregate: EventAggregate = {
          event: eventName,
          period: 'hour',
          startTime: admin.firestore.Timestamp.fromDate(tenMinutesAgo),
          endTime: admin.firestore.Timestamp.fromDate(now),
          count: events.length,
          uniqueUsers: uniqueUsersPerEvent.get(eventName)?.size || 0,
          platforms,
          appVersions,
        };
        
        const docRef = db.collection('analyticsAggregates').doc();
        batch.set(docRef, {
          ...aggregate,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      await batch.commit();
      
      console.log(`[aggregateAnalyticsEvents] Aggregated ${eventGroups.size} event types`);
      
      // Clean up old raw events (keep last 7 days)
      await cleanupOldEvents();
      
    } catch (error) {
      console.error('[aggregateAnalyticsEvents] Failed to aggregate:', error);
    }
  });

/**
 * Generate daily analytics reports
 */
export const generateDailyAnalyticsReport = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('America/Phoenix')
  .onRun(async (context) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get aggregated events for yesterday
      const aggregatesSnapshot = await db.collection('analyticsAggregates')
        .where('startTime', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('startTime', '<', admin.firestore.Timestamp.fromDate(today))
        .get();
      
      if (aggregatesSnapshot.empty) {
        console.log('[generateDailyAnalyticsReport] No data to report');
        return;
      }
      
      // Aggregate data by event
      const eventSummaries = new Map<string, any>();
      
      aggregatesSnapshot.forEach(doc => {
        const aggregate = doc.data() as EventAggregate;
        const existing = eventSummaries.get(aggregate.event) || {
          event: aggregate.event,
          totalCount: 0,
          uniqueUsers: new Set<string>(),
          platforms: {},
          appVersions: {},
        };
        
        existing.totalCount += aggregate.count;
        
        // Merge platforms
        Object.entries(aggregate.platforms).forEach(([platform, count]) => {
          existing.platforms[platform] = (existing.platforms[platform] || 0) + count;
        });
        
        // Merge app versions
        Object.entries(aggregate.appVersions).forEach(([version, count]) => {
          existing.appVersions[version] = (existing.appVersions[version] || 0) + count;
        });
        
        eventSummaries.set(aggregate.event, existing);
      });
      
      // Calculate key metrics
      const report = {
        date: yesterday.toISOString().split('T')[0],
        period: 'day',
        metrics: {
          totalEvents: 0,
          uniqueEvents: eventSummaries.size,
          activeUsers: 0,
          topEvents: [] as any[],
          userEngagement: {} as any,
          platformBreakdown: {} as Record<string, number>,
          conversionMetrics: {} as any,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Process event summaries
      const eventArray = Array.from(eventSummaries.values());
      eventArray.sort((a, b) => b.totalCount - a.totalCount);
      
      report.metrics.topEvents = eventArray.slice(0, 10).map(e => ({
        event: e.event,
        count: e.totalCount,
        platforms: e.platforms,
      }));
      
      report.metrics.totalEvents = eventArray.reduce((sum, e) => sum + e.totalCount, 0);
      
      // Calculate platform breakdown
      eventArray.forEach(e => {
        Object.entries(e.platforms).forEach(([platform, count]) => {
          report.metrics.platformBreakdown[platform] = 
            (report.metrics.platformBreakdown[platform] || 0) + (count as number);
        });
      });
      
      // Calculate conversion metrics
      await calculateConversionMetrics(report, yesterday, today);
      
      // Calculate user engagement metrics
      await calculateUserEngagement(report, yesterday, today);
      
      // Save report
      await db.collection('analyticsReports').add(report);
      
      console.log(`[generateDailyAnalyticsReport] Generated report for ${report.date}`);
      
      // Send report to stakeholders if configured
      await sendAnalyticsReport(report);
      
    } catch (error) {
      console.error('[generateDailyAnalyticsReport] Failed to generate report:', error);
    }
  });

/**
 * Track user sessions
 */
export const trackUserSession = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    const { userId, sessionId, action, duration } = req.body;
    
    if (!userId || !sessionId || !action) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const sessionRef = db.collection('userSessions').doc(sessionId);
    
    if (action === 'start') {
      await sessionRef.set({
        userId,
        sessionId,
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
        platform: req.body.platform || 'unknown',
        appVersion: req.body.appVersion || 'unknown',
        events: 0,
      });
    } else if (action === 'update') {
      await sessionRef.update({
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
        events: admin.firestore.FieldValue.increment(1),
      });
    } else if (action === 'end') {
      await sessionRef.update({
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        duration: duration || 0,
      });
    }
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('[trackUserSession] Failed to track session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions

async function trackBusinessMetrics(event: AnalyticsEvent) {
  // Track key business events in separate collections for easier querying
  const businessEvents = [
    'sign_up',
    'family_created',
    'task_completed',
    'purchase_completed',
    'subscription_started',
    'subscription_cancelled',
  ];
  
  if (businessEvents.includes(event.event)) {
    await db.collection('businessMetrics').add({
      ...event,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function calculateConversionMetrics(report: any, startDate: Date, endDate: Date) {
  // Calculate sign-up to family creation conversion
  const signUps = await db.collection('businessMetrics')
    .where('event', '==', 'sign_up')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(endDate))
    .get();
  
  const familyCreations = await db.collection('businessMetrics')
    .where('event', '==', 'family_created')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(endDate))
    .get();
  
  report.metrics.conversionMetrics = {
    signUps: signUps.size,
    familyCreations: familyCreations.size,
    signUpToFamilyConversion: signUps.size > 0 
      ? ((familyCreations.size / signUps.size) * 100).toFixed(2) + '%'
      : '0%',
  };
  
  // Calculate free to premium conversion
  const premiumStarts = await db.collection('businessMetrics')
    .where('event', '==', 'subscription_started')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(endDate))
    .get();
  
  report.metrics.conversionMetrics.premiumConversions = premiumStarts.size;
}

async function calculateUserEngagement(report: any, startDate: Date, endDate: Date) {
  // Get active users
  const sessionsSnapshot = await db.collection('userSessions')
    .where('startTime', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('startTime', '<', admin.firestore.Timestamp.fromDate(endDate))
    .get();
  
  const uniqueUsers = new Set<string>();
  let totalSessionDuration = 0;
  let sessionsWithDuration = 0;
  
  sessionsSnapshot.forEach(doc => {
    const session = doc.data();
    uniqueUsers.add(session.userId);
    
    if (session.duration) {
      totalSessionDuration += session.duration;
      sessionsWithDuration++;
    }
  });
  
  report.metrics.activeUsers = uniqueUsers.size;
  report.metrics.userEngagement = {
    totalSessions: sessionsSnapshot.size,
    averageSessionsPerUser: uniqueUsers.size > 0 
      ? (sessionsSnapshot.size / uniqueUsers.size).toFixed(2)
      : 0,
    averageSessionDuration: sessionsWithDuration > 0
      ? Math.round(totalSessionDuration / sessionsWithDuration / 1000) + 's'
      : '0s',
  };
  
  // Calculate retention (users active in last 7 days who were also active 7-14 days ago)
  const twoWeeksAgo = new Date(startDate);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
  
  const previousWeekSessions = await db.collection('userSessions')
    .where('startTime', '>=', admin.firestore.Timestamp.fromDate(twoWeeksAgo))
    .where('startTime', '<', admin.firestore.Timestamp.fromDate(startDate))
    .get();
  
  const previousWeekUsers = new Set<string>();
  previousWeekSessions.forEach(doc => {
    previousWeekUsers.add(doc.data().userId);
  });
  
  const retainedUsers = Array.from(uniqueUsers).filter(userId => 
    previousWeekUsers.has(userId)
  ).length;
  
  report.metrics.userEngagement.weeklyRetention = previousWeekUsers.size > 0
    ? ((retainedUsers / previousWeekUsers.size) * 100).toFixed(2) + '%'
    : 'N/A';
}

async function sendAnalyticsReport(report: any) {
  // In production, this would send to email, Slack, etc.
  const webhookUrl = process.env.ANALYTICS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      // Send webhook with report summary
      console.log('[sendAnalyticsReport] Would send report webhook');
    } catch (error) {
      console.error('[sendAnalyticsReport] Failed to send webhook:', error);
    }
  }
}

async function cleanupOldEvents() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Clean up raw events older than 7 days
  const oldEventsQuery = db.collection('analyticsEvents')
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
    .limit(500);
  
  const snapshot = await oldEventsQuery.get();
  
  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    console.log(`[cleanupOldEvents] Deleted ${snapshot.size} old events`);
  }
  
  // Clean up old sessions (keep last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const oldSessionsQuery = db.collection('userSessions')
    .where('startTime', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
    .limit(500);
  
  const sessionsSnapshot = await oldSessionsQuery.get();
  
  if (!sessionsSnapshot.empty) {
    const batch = db.batch();
    sessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    console.log(`[cleanupOldEvents] Deleted ${sessionsSnapshot.size} old sessions`);
  }
}