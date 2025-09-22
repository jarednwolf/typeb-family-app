"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyErrorReport = exports.reportErrorBatch = exports.reportError = exports.processErrorReports = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const Sentry = __importStar(require("@sentry/node"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
exports.processErrorReports = functions.firestore
    .document('errorReports/{reportId}')
    .onCreate(async (snap, context) => {
    const { reportId } = context.params;
    const errorData = snap.data();
    try {
        const errorHash = generateErrorHash(errorData.message, errorData.stack);
        await updateErrorSummary(errorHash, errorData, reportId, context.eventId);
        if (isCriticalError(errorData)) {
            await sendCriticalErrorAlert(errorData);
        }
        await forwardToExternalServices(errorData);
        await cleanupOldReports();
        console.log(`[processErrorReports] Processed error report ${reportId}`);
    }
    catch (error) {
        console.error('[processErrorReports] Failed to process error:', error);
        try {
            Sentry.captureException(error);
        }
        catch (_a) { }
    }
});
exports.reportError = functions.https.onRequest(async (req, res) => {
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
        const errorReport = req.body;
        if (!(errorReport === null || errorReport === void 0 ? void 0 : errorReport.message)) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        errorReport.timestamp = firestore_1.Timestamp.now();
        const docRef = await db.collection('errorReports').add(errorReport);
        res.status(200).json({ success: true, reportId: docRef.id });
    }
    catch (error) {
        console.error('[reportError] Failed to save error report:', error);
        const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
        res.status(500).json({ error: isEmu ? String((error === null || error === void 0 ? void 0 : error.message) || error) : 'Internal server error' });
        try {
            Sentry.captureException(error);
        }
        catch (_a) { }
    }
});
exports.reportErrorBatch = functions.https.onRequest(async (req, res) => {
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
        const { errors } = req.body;
        if (!Array.isArray(errors) || errors.length === 0) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }
        const batch = db.batch();
        const reportIds = [];
        for (let i = 0; i < Math.min(errors.length, 500); i++) {
            const error = errors[i];
            error.timestamp = firestore_1.Timestamp.now();
            const docRef = db.collection('errorReports').doc();
            batch.set(docRef, error);
            reportIds.push(docRef.id);
        }
        await batch.commit();
        res.status(200).json({ success: true, processed: reportIds.length, reportIds });
    }
    catch (error) {
        console.error('[reportErrorBatch] Failed to save error reports:', error);
        const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
        res.status(500).json({ error: isEmu ? String((error === null || error === void 0 ? void 0 : error.message) || error) : 'Internal server error' });
        try {
            Sentry.captureException(error);
        }
        catch (_a) { }
    }
});
exports.generateDailyErrorReport = functions.pubsub
    .schedule('every day 09:00')
    .timeZone('America/Phoenix')
    .onRun(async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const summariesSnapshot = await db.collection('errorSummaries')
            .where('lastSeen', '>=', firestore_1.Timestamp.fromDate(yesterday))
            .where('lastSeen', '<', firestore_1.Timestamp.fromDate(today))
            .orderBy('count', 'desc')
            .limit(20)
            .get();
        if (summariesSnapshot.empty) {
            console.log('[generateDailyErrorReport] No errors to report');
            return;
        }
        const report = {
            date: yesterday.toISOString().split('T')[0],
            totalErrors: 0,
            uniqueErrors: summariesSnapshot.size,
            topErrors: [],
            affectedUsers: new Set(),
            platforms: {},
        };
        summariesSnapshot.forEach(doc => {
            const summary = doc.data();
            report.totalErrors += summary.count;
            summary.affectedUsers.forEach(userId => report.affectedUsers.add(userId));
            report.topErrors.push({ message: summary.message, count: summary.count, affectedUsers: summary.affectedUsers.length });
            summary.platforms.forEach(platform => { report.platforms[platform] = (report.platforms[platform] || 0) + 1; });
        });
        await db.collection('errorReportsSummary').add(Object.assign(Object.assign({}, report), { affectedUsers: Array.from(report.affectedUsers), createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        console.log(`[generateDailyErrorReport] Generated report for ${report.date}`);
    }
    catch (error) {
        console.error('[generateDailyErrorReport] Failed to generate report:', error);
        try {
            Sentry.captureException(error);
        }
        catch (_a) { }
    }
});
function generateErrorHash(message, stack) {
    const content = `${message}${stack ? stack.split('\n')[0] : ''}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
async function updateErrorSummary(errorHash, errorData, reportId, eventId) {
    const summaryRef = db.collection('errorSummaries').doc(errorHash);
    await db.runTransaction(async (transaction) => {
        var _a;
        const summaryDoc = await transaction.get(summaryRef);
        if (summaryDoc.exists) {
            const existing = summaryDoc.data();
            const processedEventIds = Array.isArray(existing.processedEventIds)
                ? existing.processedEventIds
                : [];
            const alreadyProcessed = eventId ? processedEventIds.includes(eventId) : false;
            if (alreadyProcessed) {
                // Keep lastSeen fresh but avoid double-counting
                const newLastSeen = errorData.timestamp;
                transaction.update(summaryRef, { lastSeen: newLastSeen });
                return;
            }
            const affectedUsersSet = new Set(Array.isArray(existing.affectedUsers) ? existing.affectedUsers : []);
            affectedUsersSet.add(errorData.userId || 'anonymous');
            const platformsSet = new Set(Array.isArray(existing.platforms) ? existing.platforms : []);
            platformsSet.add(errorData.platform);
            const appVersionsSet = new Set(Array.isArray(existing.appVersions) ? existing.appVersions : []);
            appVersionsSet.add(errorData.appVersion);
            const updatePayload = {
                count: (existing.count || 0) + 1,
                lastSeen: errorData.timestamp,
                affectedUsers: Array.from(affectedUsersSet),
                platforms: Array.from(platformsSet),
                appVersions: Array.from(appVersionsSet),
            };
            if (eventId) {
                updatePayload.processedEventIds = [eventId, ...processedEventIds.filter((id) => id !== eventId)].slice(0, 50);
            }
            transaction.update(summaryRef, updatePayload);
        }
        else {
            const newSummary = {
                errorHash,
                message: errorData.message,
                count: 1,
                firstSeen: errorData.timestamp,
                lastSeen: errorData.timestamp,
                affectedUsers: [errorData.userId || 'anonymous'],
                platforms: [errorData.platform],
                appVersions: [errorData.appVersion],
                metadata: {
                    stack: (_a = errorData.stack) === null || _a === void 0 ? void 0 : _a.split('\n')[0],
                    environment: errorData.environment,
                },
                processedEventIds: eventId ? [eventId] : [],
            };
            transaction.set(summaryRef, newSummary);
        }
    });
}
function isCriticalError(errorData) {
    var _a, _b;
    const criticalKeywords = [
        'crash', 'fatal', 'out of memory', 'unhandled', 'security', 'authentication failed', 'payment failed'
    ];
    const messageLower = errorData.message.toLowerCase();
    return criticalKeywords.some(keyword => messageLower.includes(keyword)) ||
        ((_a = errorData.metadata) === null || _a === void 0 ? void 0 : _a.fatal) === true ||
        ((_b = errorData.metadata) === null || _b === void 0 ? void 0 : _b.errorBoundary) === true;
}
async function sendCriticalErrorAlert(errorData) {
    console.error(`[CRITICAL ERROR ALERT] ${errorData.message}`, {
        userId: errorData.userId,
        platform: errorData.platform,
        appVersion: errorData.appVersion,
    });
    await db.collection('criticalErrors').add(Object.assign(Object.assign({}, errorData), { alertedAt: admin.firestore.FieldValue.serverTimestamp() }));
}
async function forwardToExternalServices(errorData) {
    const sentryDsn = process.env.SENTRY_DSN;
    if (sentryDsn) {
        console.log('[forwardToExternalServices] Would forward to Sentry');
    }
    const monitoringUrl = process.env.MONITORING_WEBHOOK_URL;
    if (monitoringUrl) {
        console.log('[forwardToExternalServices] Would send monitoring webhook');
    }
}
async function cleanupOldReports() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldReportsQuery = db.collection('errorReports')
        .where('timestamp', '<', firestore_1.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100);
    const snapshot = await oldReportsQuery.get();
    if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => { batch.delete(doc.ref); });
        await batch.commit();
        console.log(`[cleanupOldReports] Deleted ${snapshot.size} old error reports`);
    }
}
//# sourceMappingURL=errorReporting.js.map