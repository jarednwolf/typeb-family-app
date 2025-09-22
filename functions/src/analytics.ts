import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface AnalyticsEvent {
  event: string;
  params?: Record<string, any>;
  timestamp: Timestamp;
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
  startTime: Timestamp;
  endTime: Timestamp;
  count: number;
  uniqueUsers: number;
  platforms: Record<string, number>;
  appVersions: Record<string, number>;
  metadata?: Record<string, any>;
}

export const trackAnalyticsEvent = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
  try {
    const eventData = req.body as any;
    if (!eventData?.event || !eventData?.platform) { res.status(400).json({ error: 'Missing required fields' }); return; }
    eventData.timestamp = Timestamp.now();
    const docRef = await db.collection('analyticsEvents').add(eventData);
    await trackBusinessMetrics(eventData);
    res.status(200).json({ success: true, eventId: docRef.id });
  } catch (error: any) {
    console.error('[trackAnalyticsEvent] Failed to save event:', error);
    const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
    res.status(500).json({ error: isEmu ? String(error?.message || error) : 'Internal server error' });
  }
});

export const trackAnalyticsEventsBatch = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
  try {
    const { events } = req.body as { events: any[] };
    if (!Array.isArray(events) || events.length === 0) { res.status(400).json({ error: 'Invalid request body' }); return; }
    const batch = db.batch();
    const eventIds: string[] = [];
    for (let i = 0; i < Math.min(events.length, 500); i++) {
      const event = events[i];
      event.timestamp = Timestamp.now();
      const docRef = db.collection('analyticsEvents').doc();
      batch.set(docRef, event);
      eventIds.push(docRef.id);
    }
    await batch.commit();
    res.status(200).json({ success: true, processed: eventIds.length, eventIds });
  } catch (error: any) {
    console.error('[trackAnalyticsEventsBatch] Failed to save events:', error);
    const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
    res.status(500).json({ error: isEmu ? String(error?.message || error) : 'Internal server error' });
  }
});

export const aggregateAnalyticsEvents = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async () => {
    try {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const eventsSnapshot = await db.collection('analyticsEvents')
        .where('timestamp', '>=', Timestamp.fromDate(tenMinutesAgo))
        .where('timestamp', '<', Timestamp.fromDate(now))
        .get();
      if (eventsSnapshot.empty) { console.log('[aggregateAnalyticsEvents] No events to aggregate'); return; }
      const eventGroups = new Map<string, AnalyticsEvent[]>();
      const uniqueUsersPerEvent = new Map<string, Set<string>>();
      eventsSnapshot.forEach(doc => {
        const event = doc.data() as AnalyticsEvent;
        const group = eventGroups.get(event.event) || [];
        group.push(event);
        eventGroups.set(event.event, group);
        if (event.userId) {
          const users = uniqueUsersPerEvent.get(event.event) || new Set<string>();
          users.add(event.userId);
          uniqueUsersPerEvent.set(event.event, users);
        }
      });
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
          startTime: Timestamp.fromDate(tenMinutesAgo),
          endTime: Timestamp.fromDate(now),
          count: events.length,
          uniqueUsers: uniqueUsersPerEvent.get(eventName)?.size || 0,
          platforms,
          appVersions,
        } as EventAggregate;
        const docRef = db.collection('analyticsAggregates').doc();
        batch.set(docRef, { ...aggregate, createdAt: FieldValue.serverTimestamp() });
      }
      await batch.commit();
      console.log(`[aggregateAnalyticsEvents] Aggregated ${eventGroups.size} event types`);
      await cleanupOldEvents();
    } catch (error) {
      console.error('[aggregateAnalyticsEvents] Failed to aggregate:', error);
    }
  });

export const generateDailyAnalyticsReport = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('America/Phoenix')
  .onRun(async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aggregatesSnapshot = await db.collection('analyticsAggregates')
        .where('startTime', '>=', Timestamp.fromDate(yesterday))
        .where('startTime', '<', Timestamp.fromDate(today))
        .get();
      if (aggregatesSnapshot.empty) { console.log('[generateDailyAnalyticsReport] No data to report'); return; }
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
        Object.entries(aggregate.platforms).forEach(([platform, count]) => {
          (existing.platforms as Record<string, number>)[platform] = ((existing.platforms as Record<string, number>)[platform] || 0) + (count as number);
        });
        Object.entries(aggregate.appVersions).forEach(([version, count]) => {
          (existing.appVersions as Record<string, number>)[version] = ((existing.appVersions as Record<string, number>)[version] || 0) + (count as number);
        });
        eventSummaries.set(aggregate.event, existing);
      });
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
        createdAt: FieldValue.serverTimestamp(),
      };
      const eventArray = Array.from(eventSummaries.values());
      eventArray.sort((a, b) => b.totalCount - a.totalCount);
      report.metrics.topEvents = eventArray.slice(0, 10).map((e: any) => ({ event: e.event, count: e.totalCount, platforms: e.platforms }));
      report.metrics.totalEvents = eventArray.reduce((sum: number, e: any) => sum + e.totalCount, 0);
      eventArray.forEach((e: any) => { Object.entries(e.platforms).forEach(([platform, count]) => { (report.metrics.platformBreakdown as Record<string, number>)[platform] = ((report.metrics.platformBreakdown as Record<string, number>)[platform] || 0) + (count as number); }); });
      await calculateConversionMetrics(report, yesterday, today);
      await calculateUserEngagement(report, yesterday, today);
      await db.collection('analyticsReports').add(report);
      console.log(`[generateDailyAnalyticsReport] Generated report for ${report.date}`);
      await sendAnalyticsReport(report);
    } catch (error) {
      console.error('[generateDailyAnalyticsReport] Failed to generate report:', error);
    }
  });

export const trackUserSession = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
  try {
    const { userId, sessionId, action, duration } = req.body as any;
    if (!userId || !sessionId || !action) { res.status(400).json({ error: 'Missing required fields' }); return; }
    const sessionRef = db.collection('userSessions').doc(sessionId);
    if (action === 'start') {
      await sessionRef.set({
        userId,
        sessionId,
        startTime: FieldValue.serverTimestamp(),
        lastActiveAt: FieldValue.serverTimestamp(),
        platform: (req.body && req.body.platform) || 'unknown',
        appVersion: (req.body && req.body.appVersion) || 'unknown',
        events: 0,
      });
    } else if (action === 'update') {
      await sessionRef.update({ lastActiveAt: FieldValue.serverTimestamp(), events: FieldValue.increment(1) });
    } else if (action === 'end') {
      await sessionRef.update({ endTime: FieldValue.serverTimestamp(), duration: duration || 0 });
    }
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[trackUserSession] Failed to track session:', error);
    const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
    res.status(500).json({ error: isEmu ? String(error?.message || error) : 'Internal server error' });
  }
});

async function trackBusinessMetrics(event: AnalyticsEvent) {
  const businessEvents = [ 'sign_up', 'family_created', 'task_completed', 'purchase_completed', 'subscription_started', 'subscription_cancelled' ];
  if (businessEvents.includes(event.event)) {
    await db.collection('businessMetrics').add({ ...event, createdAt: FieldValue.serverTimestamp() });
  }
}

async function calculateConversionMetrics(report: any, startDate: Date, endDate: Date) {
  const signUps = await db.collection('businessMetrics')
    .where('event', '==', 'sign_up')
    .where('timestamp', '>=', Timestamp.fromDate(startDate))
    .where('timestamp', '<', Timestamp.fromDate(endDate))
    .get();
  const familyCreations = await db.collection('businessMetrics')
    .where('event', '==', 'family_created')
    .where('timestamp', '>=', Timestamp.fromDate(startDate))
    .where('timestamp', '<', Timestamp.fromDate(endDate))
    .get();
  report.metrics.conversionMetrics = {
    signUps: signUps.size,
    familyCreations: familyCreations.size,
    signUpToFamilyConversion: signUps.size > 0 ? ((familyCreations.size / signUps.size) * 100).toFixed(2) + '%' : '0%',
  };
  const premiumStarts = await db.collection('businessMetrics')
    .where('event', '==', 'subscription_started')
    .where('timestamp', '>=', Timestamp.fromDate(startDate))
    .where('timestamp', '<', Timestamp.fromDate(endDate))
    .get();
  report.metrics.conversionMetrics.premiumConversions = premiumStarts.size;
}

async function calculateUserEngagement(report: any, startDate: Date, endDate: Date) {
  const sessionsSnapshot = await db.collection('userSessions')
    .where('startTime', '>=', Timestamp.fromDate(startDate))
    .where('startTime', '<', Timestamp.fromDate(endDate))
    .get();
  const uniqueUsers = new Set<string>();
  let totalSessionDuration = 0;
  let sessionsWithDuration = 0;
  sessionsSnapshot.forEach(doc => {
    const session = doc.data() as any;
    uniqueUsers.add(session.userId);
    if (session.duration) {
      totalSessionDuration += session.duration;
      sessionsWithDuration++;
    }
  });
  report.metrics.activeUsers = uniqueUsers.size;
  report.metrics.userEngagement = {
    totalSessions: sessionsSnapshot.size,
    averageSessionsPerUser: uniqueUsers.size > 0 ? (sessionsSnapshot.size / uniqueUsers.size).toFixed(2) : 0,
    averageSessionDuration: sessionsWithDuration > 0 ? Math.round(totalSessionDuration / sessionsWithDuration / 1000) + 's' : '0s',
  };
  const twoWeeksAgo = new Date(startDate);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
  const previousWeekSessions = await db.collection('userSessions')
    .where('startTime', '>=', Timestamp.fromDate(twoWeeksAgo))
    .where('startTime', '<', Timestamp.fromDate(startDate))
    .get();
  const previousWeekUsers = new Set<string>();
  previousWeekSessions.forEach(doc => { previousWeekUsers.add((doc.data() as any).userId); });
  const retainedUsers = Array.from(uniqueUsers).filter(userId => previousWeekUsers.has(userId)).length;
  report.metrics.userEngagement.weeklyRetention = previousWeekUsers.size > 0 ? ((retainedUsers / previousWeekUsers.size) * 100).toFixed(2) + '%' : 'N/A';
}

async function sendAnalyticsReport(report: any) {
  const webhookUrl = process.env.ANALYTICS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      console.log('[sendAnalyticsReport] Would send report webhook');
    } catch (error) {
      console.error('[sendAnalyticsReport] Failed to send webhook:', error);
    }
  }
}

async function cleanupOldEvents() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const oldEventsQuery = db.collection('analyticsEvents')
    .where('timestamp', '<', Timestamp.fromDate(sevenDaysAgo))
    .limit(500);
  const snapshot = await oldEventsQuery.get();
  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => { batch.delete(doc.ref); });
    await batch.commit();
    console.log(`[cleanupOldEvents] Deleted ${snapshot.size} old events`);
  }
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldSessionsQuery = db.collection('userSessions')
    .where('startTime', '<', Timestamp.fromDate(thirtyDaysAgo))
    .limit(500);
  const sessionsSnapshot = await oldSessionsQuery.get();
  if (!sessionsSnapshot.empty) {
    const batch = db.batch();
    sessionsSnapshot.docs.forEach(doc => { batch.delete(doc.ref); });
    await batch.commit();
    console.log(`[cleanupOldEvents] Deleted ${sessionsSnapshot.size} old sessions`);
  }
}
