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
exports.trackUserSession = exports.generateDailyAnalyticsReport = exports.aggregateAnalyticsEvents = exports.trackAnalyticsEventsBatch = exports.trackAnalyticsEvent = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
exports.trackAnalyticsEvent = functions.https.onRequest(async (req, res) => {
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
        const eventData = req.body;
        if (!(eventData === null || eventData === void 0 ? void 0 : eventData.event) || !(eventData === null || eventData === void 0 ? void 0 : eventData.platform)) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        eventData.timestamp = firestore_1.Timestamp.now();
        const docRef = await db.collection('analyticsEvents').add(eventData);
        await trackBusinessMetrics(eventData);
        res.status(200).json({ success: true, eventId: docRef.id });
    }
    catch (error) {
        console.error('[trackAnalyticsEvent] Failed to save event:', error);
        const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
        res.status(500).json({ error: isEmu ? String((error === null || error === void 0 ? void 0 : error.message) || error) : 'Internal server error' });
    }
});
exports.trackAnalyticsEventsBatch = functions.https.onRequest(async (req, res) => {
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
        const { events } = req.body;
        if (!Array.isArray(events) || events.length === 0) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }
        const batch = db.batch();
        const eventIds = [];
        for (let i = 0; i < Math.min(events.length, 500); i++) {
            const event = events[i];
            event.timestamp = firestore_1.Timestamp.now();
            const docRef = db.collection('analyticsEvents').doc();
            batch.set(docRef, event);
            eventIds.push(docRef.id);
        }
        await batch.commit();
        res.status(200).json({ success: true, processed: eventIds.length, eventIds });
    }
    catch (error) {
        console.error('[trackAnalyticsEventsBatch] Failed to save events:', error);
        const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
        res.status(500).json({ error: isEmu ? String((error === null || error === void 0 ? void 0 : error.message) || error) : 'Internal server error' });
    }
});
exports.aggregateAnalyticsEvents = functions.pubsub
    .schedule('every 10 minutes')
    .onRun(async () => {
    var _a;
    try {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        const eventsSnapshot = await db.collection('analyticsEvents')
            .where('timestamp', '>=', firestore_1.Timestamp.fromDate(tenMinutesAgo))
            .where('timestamp', '<', firestore_1.Timestamp.fromDate(now))
            .get();
        if (eventsSnapshot.empty) {
            console.log('[aggregateAnalyticsEvents] No events to aggregate');
            return;
        }
        const eventGroups = new Map();
        const uniqueUsersPerEvent = new Map();
        eventsSnapshot.forEach(doc => {
            const event = doc.data();
            const group = eventGroups.get(event.event) || [];
            group.push(event);
            eventGroups.set(event.event, group);
            if (event.userId) {
                const users = uniqueUsersPerEvent.get(event.event) || new Set();
                users.add(event.userId);
                uniqueUsersPerEvent.set(event.event, users);
            }
        });
        const batch = db.batch();
        for (const [eventName, events] of eventGroups.entries()) {
            const platforms = {};
            const appVersions = {};
            events.forEach(e => {
                platforms[e.platform] = (platforms[e.platform] || 0) + 1;
                appVersions[e.appVersion] = (appVersions[e.appVersion] || 0) + 1;
            });
            const aggregate = {
                event: eventName,
                period: 'hour',
                startTime: firestore_1.Timestamp.fromDate(tenMinutesAgo),
                endTime: firestore_1.Timestamp.fromDate(now),
                count: events.length,
                uniqueUsers: ((_a = uniqueUsersPerEvent.get(eventName)) === null || _a === void 0 ? void 0 : _a.size) || 0,
                platforms,
                appVersions,
            };
            const docRef = db.collection('analyticsAggregates').doc();
            batch.set(docRef, Object.assign(Object.assign({}, aggregate), { createdAt: firestore_1.FieldValue.serverTimestamp() }));
        }
        await batch.commit();
        console.log(`[aggregateAnalyticsEvents] Aggregated ${eventGroups.size} event types`);
        await cleanupOldEvents();
    }
    catch (error) {
        console.error('[aggregateAnalyticsEvents] Failed to aggregate:', error);
    }
});
exports.generateDailyAnalyticsReport = functions.pubsub
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
            .where('startTime', '>=', firestore_1.Timestamp.fromDate(yesterday))
            .where('startTime', '<', firestore_1.Timestamp.fromDate(today))
            .get();
        if (aggregatesSnapshot.empty) {
            console.log('[generateDailyAnalyticsReport] No data to report');
            return;
        }
        const eventSummaries = new Map();
        aggregatesSnapshot.forEach(doc => {
            const aggregate = doc.data();
            const existing = eventSummaries.get(aggregate.event) || {
                event: aggregate.event,
                totalCount: 0,
                uniqueUsers: new Set(),
                platforms: {},
                appVersions: {},
            };
            existing.totalCount += aggregate.count;
            Object.entries(aggregate.platforms).forEach(([platform, count]) => {
                existing.platforms[platform] = (existing.platforms[platform] || 0) + count;
            });
            Object.entries(aggregate.appVersions).forEach(([version, count]) => {
                existing.appVersions[version] = (existing.appVersions[version] || 0) + count;
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
                topEvents: [],
                userEngagement: {},
                platformBreakdown: {},
                conversionMetrics: {},
            },
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        };
        const eventArray = Array.from(eventSummaries.values());
        eventArray.sort((a, b) => b.totalCount - a.totalCount);
        report.metrics.topEvents = eventArray.slice(0, 10).map((e) => ({ event: e.event, count: e.totalCount, platforms: e.platforms }));
        report.metrics.totalEvents = eventArray.reduce((sum, e) => sum + e.totalCount, 0);
        eventArray.forEach((e) => { Object.entries(e.platforms).forEach(([platform, count]) => { report.metrics.platformBreakdown[platform] = (report.metrics.platformBreakdown[platform] || 0) + count; }); });
        await calculateConversionMetrics(report, yesterday, today);
        await calculateUserEngagement(report, yesterday, today);
        await db.collection('analyticsReports').add(report);
        console.log(`[generateDailyAnalyticsReport] Generated report for ${report.date}`);
        await sendAnalyticsReport(report);
    }
    catch (error) {
        console.error('[generateDailyAnalyticsReport] Failed to generate report:', error);
    }
});
exports.trackUserSession = functions.https.onRequest(async (req, res) => {
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
                startTime: firestore_1.FieldValue.serverTimestamp(),
                lastActiveAt: firestore_1.FieldValue.serverTimestamp(),
                platform: (req.body && req.body.platform) || 'unknown',
                appVersion: (req.body && req.body.appVersion) || 'unknown',
                events: 0,
            });
        }
        else if (action === 'update') {
            await sessionRef.update({ lastActiveAt: firestore_1.FieldValue.serverTimestamp(), events: firestore_1.FieldValue.increment(1) });
        }
        else if (action === 'end') {
            await sessionRef.update({ endTime: firestore_1.FieldValue.serverTimestamp(), duration: duration || 0 });
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('[trackUserSession] Failed to track session:', error);
        const isEmu = process.env.FUNCTIONS_EMULATOR === 'true';
        res.status(500).json({ error: isEmu ? String((error === null || error === void 0 ? void 0 : error.message) || error) : 'Internal server error' });
    }
});
async function trackBusinessMetrics(event) {
    const businessEvents = ['sign_up', 'family_created', 'task_completed', 'purchase_completed', 'subscription_started', 'subscription_cancelled'];
    if (businessEvents.includes(event.event)) {
        await db.collection('businessMetrics').add(Object.assign(Object.assign({}, event), { createdAt: firestore_1.FieldValue.serverTimestamp() }));
    }
}
async function calculateConversionMetrics(report, startDate, endDate) {
    const signUps = await db.collection('businessMetrics')
        .where('event', '==', 'sign_up')
        .where('timestamp', '>=', firestore_1.Timestamp.fromDate(startDate))
        .where('timestamp', '<', firestore_1.Timestamp.fromDate(endDate))
        .get();
    const familyCreations = await db.collection('businessMetrics')
        .where('event', '==', 'family_created')
        .where('timestamp', '>=', firestore_1.Timestamp.fromDate(startDate))
        .where('timestamp', '<', firestore_1.Timestamp.fromDate(endDate))
        .get();
    report.metrics.conversionMetrics = {
        signUps: signUps.size,
        familyCreations: familyCreations.size,
        signUpToFamilyConversion: signUps.size > 0 ? ((familyCreations.size / signUps.size) * 100).toFixed(2) + '%' : '0%',
    };
    const premiumStarts = await db.collection('businessMetrics')
        .where('event', '==', 'subscription_started')
        .where('timestamp', '>=', firestore_1.Timestamp.fromDate(startDate))
        .where('timestamp', '<', firestore_1.Timestamp.fromDate(endDate))
        .get();
    report.metrics.conversionMetrics.premiumConversions = premiumStarts.size;
}
async function calculateUserEngagement(report, startDate, endDate) {
    const sessionsSnapshot = await db.collection('userSessions')
        .where('startTime', '>=', firestore_1.Timestamp.fromDate(startDate))
        .where('startTime', '<', firestore_1.Timestamp.fromDate(endDate))
        .get();
    const uniqueUsers = new Set();
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
        averageSessionsPerUser: uniqueUsers.size > 0 ? (sessionsSnapshot.size / uniqueUsers.size).toFixed(2) : 0,
        averageSessionDuration: sessionsWithDuration > 0 ? Math.round(totalSessionDuration / sessionsWithDuration / 1000) + 's' : '0s',
    };
    const twoWeeksAgo = new Date(startDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
    const previousWeekSessions = await db.collection('userSessions')
        .where('startTime', '>=', firestore_1.Timestamp.fromDate(twoWeeksAgo))
        .where('startTime', '<', firestore_1.Timestamp.fromDate(startDate))
        .get();
    const previousWeekUsers = new Set();
    previousWeekSessions.forEach(doc => { previousWeekUsers.add(doc.data().userId); });
    const retainedUsers = Array.from(uniqueUsers).filter(userId => previousWeekUsers.has(userId)).length;
    report.metrics.userEngagement.weeklyRetention = previousWeekUsers.size > 0 ? ((retainedUsers / previousWeekUsers.size) * 100).toFixed(2) + '%' : 'N/A';
}
async function sendAnalyticsReport(report) {
    const webhookUrl = process.env.ANALYTICS_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            console.log('[sendAnalyticsReport] Would send report webhook');
        }
        catch (error) {
            console.error('[sendAnalyticsReport] Failed to send webhook:', error);
        }
    }
}
async function cleanupOldEvents() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oldEventsQuery = db.collection('analyticsEvents')
        .where('timestamp', '<', firestore_1.Timestamp.fromDate(sevenDaysAgo))
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
        .where('startTime', '<', firestore_1.Timestamp.fromDate(thirtyDaysAgo))
        .limit(500);
    const sessionsSnapshot = await oldSessionsQuery.get();
    if (!sessionsSnapshot.empty) {
        const batch = db.batch();
        sessionsSnapshot.docs.forEach(doc => { batch.delete(doc.ref); });
        await batch.commit();
        console.log(`[cleanupOldEvents] Deleted ${sessionsSnapshot.size} old sessions`);
    }
}
//# sourceMappingURL=analytics.js.map