import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  metadata?: Record<string, any>;
  userDescription?: string;
  userId?: string;
  familyId?: string;
  timestamp: admin.firestore.Timestamp;
  platform: string;
  appVersion: string;
  osVersion: string;
  deviceType?: string;
  environment: string;
}

interface ErrorSummary {
  errorHash: string;
  message: string;
  count: number;
  firstSeen: admin.firestore.Timestamp;
  lastSeen: admin.firestore.Timestamp;
  affectedUsers: string[];
  platforms: string[];
  appVersions: string[];
  metadata?: Record<string, any>;
}

/**
 * Process error reports when they are created
 * Aggregates similar errors and prepares for monitoring dashboards
 */
export const processErrorReports = functions.firestore
  .document('errorReports/{reportId}')
  .onCreate(async (snap, context) => {
    const { reportId } = context.params;
    const errorData = snap.data() as ErrorReport;
    
    try {
      // Generate error hash for grouping similar errors
      const errorHash = generateErrorHash(errorData.message, errorData.stack);
      
      // Update error summary
      await updateErrorSummary(errorHash, errorData);
      
      // Check if this is a critical error
      if (isCriticalError(errorData)) {
        await sendCriticalErrorAlert(errorData);
      }
      
      // Log to external services (Sentry, etc.) if configured
      await forwardToExternalServices(errorData);
      
      // Clean up old error reports (keep last 30 days)
      await cleanupOldReports();
      
      console.log(`[processErrorReports] Processed error report ${reportId}`);
      
    } catch (error) {
      console.error('[processErrorReports] Failed to process error:', error);
    }
  });

/**
 * HTTP endpoint to receive error reports from the app
 * Provides an alternative to direct Firestore writes
 */
export const reportError = functions.https.onRequest(async (req, res) => {
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
    const errorReport = req.body as ErrorReport;
    
    // Validate required fields
    if (!errorReport.message || !errorReport.timestamp) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Add server timestamp
    errorReport.timestamp = admin.firestore.Timestamp.now();
    
    // Save to Firestore
    const docRef = await db.collection('errorReports').add(errorReport);
    
    res.status(200).json({
      success: true,
      reportId: docRef.id,
    });
    
  } catch (error) {
    console.error('[reportError] Failed to save error report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Batch endpoint for receiving multiple error reports
 */
export const reportErrorBatch = functions.https.onRequest(async (req, res) => {
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
    const { errors } = req.body as { errors: ErrorReport[] };
    
    if (!Array.isArray(errors) || errors.length === 0) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    
    // Process in batches of 500 (Firestore limit)
    const batch = db.batch();
    const reportIds: string[] = [];
    
    for (let i = 0; i < Math.min(errors.length, 500); i++) {
      const error = errors[i];
      error.timestamp = admin.firestore.Timestamp.now();
      
      const docRef = db.collection('errorReports').doc();
      batch.set(docRef, error);
      reportIds.push(docRef.id);
    }
    
    await batch.commit();
    
    res.status(200).json({
      success: true,
      processed: reportIds.length,
      reportIds,
    });
    
  } catch (error) {
    console.error('[reportErrorBatch] Failed to save error reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate daily error reports
 */
export const generateDailyErrorReport = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/Phoenix')
  .onRun(async (context) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get error summaries for yesterday
      const summariesSnapshot = await db.collection('errorSummaries')
        .where('lastSeen', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('lastSeen', '<', admin.firestore.Timestamp.fromDate(today))
        .orderBy('count', 'desc')
        .limit(20)
        .get();
      
      if (summariesSnapshot.empty) {
        console.log('[generateDailyErrorReport] No errors to report');
        return;
      }
      
      // Generate report
      const report = {
        date: yesterday.toISOString().split('T')[0],
        totalErrors: 0,
        uniqueErrors: summariesSnapshot.size,
        topErrors: [] as any[],
        affectedUsers: new Set<string>(),
        platforms: {} as Record<string, number>,
      };
      
      summariesSnapshot.forEach(doc => {
        const summary = doc.data() as ErrorSummary;
        report.totalErrors += summary.count;
        summary.affectedUsers.forEach(userId => report.affectedUsers.add(userId));
        
        report.topErrors.push({
          message: summary.message,
          count: summary.count,
          affectedUsers: summary.affectedUsers.length,
        });
        
        // Count platforms
        summary.platforms.forEach(platform => {
          report.platforms[platform] = (report.platforms[platform] || 0) + 1;
        });
      });
      
      // Save daily report
      await db.collection('errorReportsSummary').add({
        ...report,
        affectedUsers: Array.from(report.affectedUsers),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`[generateDailyErrorReport] Generated report for ${report.date}`);
      
    } catch (error) {
      console.error('[generateDailyErrorReport] Failed to generate report:', error);
    }
  });

// Helper functions

function generateErrorHash(message: string, stack?: string): string {
  // Simple hash based on error message and stack trace
  const content = `${message}${stack ? stack.split('\n')[0] : ''}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

async function updateErrorSummary(errorHash: string, errorData: ErrorReport) {
  const summaryRef = db.collection('errorSummaries').doc(errorHash);
  
  await db.runTransaction(async (transaction) => {
    const summaryDoc = await transaction.get(summaryRef);
    
    if (summaryDoc.exists) {
      const summary = summaryDoc.data() as ErrorSummary;
      
      // Update existing summary
      transaction.update(summaryRef, {
        count: admin.firestore.FieldValue.increment(1),
        lastSeen: errorData.timestamp,
        affectedUsers: admin.firestore.FieldValue.arrayUnion(errorData.userId || 'anonymous'),
        platforms: admin.firestore.FieldValue.arrayUnion(errorData.platform),
        appVersions: admin.firestore.FieldValue.arrayUnion(errorData.appVersion),
      });
    } else {
      // Create new summary
      const newSummary: ErrorSummary = {
        errorHash,
        message: errorData.message,
        count: 1,
        firstSeen: errorData.timestamp,
        lastSeen: errorData.timestamp,
        affectedUsers: [errorData.userId || 'anonymous'],
        platforms: [errorData.platform],
        appVersions: [errorData.appVersion],
        metadata: {
          stack: errorData.stack?.split('\n')[0],
          environment: errorData.environment,
        },
      };
      
      transaction.set(summaryRef, newSummary);
    }
  });
}

function isCriticalError(errorData: ErrorReport): boolean {
  // Define critical error conditions
  const criticalKeywords = [
    'crash',
    'fatal',
    'out of memory',
    'unhandled',
    'security',
    'authentication failed',
    'payment failed',
  ];
  
  const messageLower = errorData.message.toLowerCase();
  return criticalKeywords.some(keyword => messageLower.includes(keyword)) ||
    errorData.metadata?.fatal === true ||
    errorData.metadata?.errorBoundary === true;
}

async function sendCriticalErrorAlert(errorData: ErrorReport) {
  // In production, this would send to Slack, PagerDuty, etc.
  console.error(`[CRITICAL ERROR ALERT] ${errorData.message}`, {
    userId: errorData.userId,
    platform: errorData.platform,
    appVersion: errorData.appVersion,
  });
  
  // Save critical error alert
  await db.collection('criticalErrors').add({
    ...errorData,
    alertedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function forwardToExternalServices(errorData: ErrorReport) {
  // Forward to Sentry if configured
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    // Implementation would send to Sentry
    console.log('[forwardToExternalServices] Would forward to Sentry');
  }
  
  // Forward to custom monitoring service
  const monitoringUrl = process.env.MONITORING_WEBHOOK_URL;
  if (monitoringUrl) {
    // Implementation would send webhook
    console.log('[forwardToExternalServices] Would send monitoring webhook');
  }
}

async function cleanupOldReports() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const oldReportsQuery = db.collection('errorReports')
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
    .limit(100);
  
  const snapshot = await oldReportsQuery.get();
  
  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    console.log(`[cleanupOldReports] Deleted ${snapshot.size} old error reports`);
  }
}