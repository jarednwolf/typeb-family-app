import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: admin.firestore.Timestamp;
  metadata?: Record<string, any>;
  userId?: string;
  familyId?: string;
  platform: string;
  appVersion: string;
  deviceType?: string;
}

interface NavigationMetric {
  screen: string;
  previousScreen?: string;
  transitionDuration: number;
  renderDuration: number;
  interactionReady: number;
  timestamp: admin.firestore.Timestamp;
  userId?: string;
  platform: string;
}

interface AggregatedMetric {
  metric: string;
  period: 'hour' | 'day' | 'week';
  startTime: admin.firestore.Timestamp;
  endTime: admin.firestore.Timestamp;
  count: number;
  average: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  platforms: Record<string, number>;
  appVersions: Record<string, number>;
}

export const reportPerformanceMetric = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
  try {
    const metric = req.body as PerformanceMetric;
    if (!metric.name || !metric.value || !metric.unit) { res.status(400).json({ error: 'Missing required fields' }); return; }
    metric.timestamp = admin.firestore.Timestamp.now();
    const docRef = await db.collection('performanceMetrics').add(metric);
    await checkPerformanceThresholds(metric);
    res.status(200).json({ success: true, metricId: docRef.id });
  } catch (error) {
    console.error('[reportPerformanceMetric] Failed to save metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const reportPerformanceMetricsBatch = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
  try {
    const { metrics } = req.body as { metrics: PerformanceMetric[] };
    if (!Array.isArray(metrics) || metrics.length === 0) { res.status(400).json({ error: 'Invalid request body' }); return; }
    const batch = db.batch();
    const metricIds: string[] = [];
    for (let i = 0; i < Math.min(metrics.length, 500); i++) {
      const metric = metrics[i];
      metric.timestamp = admin.firestore.Timestamp.now();
      const docRef = db.collection('performanceMetrics').doc();
      batch.set(docRef, metric);
      metricIds.push(docRef.id);
    }
    await batch.commit();
    res.status(200).json({ success: true, processed: metricIds.length, metricIds });
  } catch (error) {
    console.error('[reportPerformanceMetricsBatch] Failed to save metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const aggregatePerformanceMetrics = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const metricsSnapshot = await db.collection('performanceMetrics')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(fiveMinutesAgo))
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(now))
        .get();
      if (metricsSnapshot.empty) { console.log('[aggregatePerformanceMetrics] No metrics to aggregate'); return; }
      const metricGroups = new Map<string, PerformanceMetric[]>();
      metricsSnapshot.forEach(doc => {
        const metric = doc.data() as PerformanceMetric;
        const group = metricGroups.get(metric.name) || [];
        group.push(metric);
        metricGroups.set(metric.name, group);
      });
      const batch = db.batch();
      for (const [metricName, metrics] of metricGroups.entries()) {
        const values = metrics.map(m => m.value).sort((a, b) => a - b);
        const aggregate = calculateAggregates(metricName, values, metrics);
        const docRef = db.collection('performanceAggregates').doc();
        batch.set(docRef, {
          ...aggregate,
          period: 'hour',
          startTime: admin.firestore.Timestamp.fromDate(fiveMinutesAgo),
          endTime: admin.firestore.Timestamp.fromDate(now),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      console.log(`[aggregatePerformanceMetrics] Aggregated ${metricGroups.size} metrics`);
      await cleanupOldMetrics();
    } catch (error) {
      console.error('[aggregatePerformanceMetrics] Failed to aggregate:', error);
    }
  });

export const generateHourlyPerformanceReport = functions.pubsub
  .schedule('every hour')
  .onRun(async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const aggregatesSnapshot = await db.collection('performanceAggregates')
        .where('startTime', '>=', admin.firestore.Timestamp.fromDate(oneHourAgo))
        .where('startTime', '<', admin.firestore.Timestamp.fromDate(now))
        .get();
      if (aggregatesSnapshot.empty) { console.log('[generateHourlyPerformanceReport] No data to report'); return; }
      const hourlyMetrics = new Map<string, any>();
      aggregatesSnapshot.forEach(doc => {
        const aggregate = doc.data() as AggregatedMetric;
        const existing = hourlyMetrics.get(aggregate.metric) || {
          metric: aggregate.metric,
          samples: 0,
          totalAverage: 0,
          minValue: Infinity,
          maxValue: -Infinity,
          p50Values: [],
          p90Values: [],
          p95Values: [],
          platforms: {},
          appVersions: {},
        };
        existing.samples += aggregate.count;
        existing.totalAverage += aggregate.average * aggregate.count;
        existing.minValue = Math.min(existing.minValue, aggregate.min);
        existing.maxValue = Math.max(existing.maxValue, aggregate.max);
        existing.p50Values.push(aggregate.p50);
        existing.p90Values.push(aggregate.p90);
        existing.p95Values.push(aggregate.p95);
        Object.entries(aggregate.platforms).forEach(([platform, count]) => {
          existing.platforms[platform] = (existing.platforms[platform] || 0) + (count as number);
        });
        Object.entries(aggregate.appVersions).forEach(([version, count]) => {
          existing.appVersions[version] = (existing.appVersions[version] || 0) + (count as number);
        });
        hourlyMetrics.set(aggregate.metric, existing);
      });
      const report = {
        period: 'hour',
        startTime: oneHourAgo,
        endTime: now,
        metrics: Array.from(hourlyMetrics.values()).map(m => ({
          metric: m.metric,
          samples: m.samples,
          average: m.totalAverage / m.samples,
          min: m.minValue,
          max: m.maxValue,
          p50: calculateMedian(m.p50Values),
          p90: calculateMedian(m.p90Values),
          p95: calculateMedian(m.p95Values),
          platforms: m.platforms,
          appVersions: m.appVersions,
        })),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('performanceReports').add(report);
      await checkPerformanceDegradation(report);
      console.log(`[generateHourlyPerformanceReport] Generated report with ${report.metrics.length} metrics`);
    } catch (error) {
      console.error('[generateHourlyPerformanceReport] Failed to generate report:', error);
    }
  });

export const trackNavigationPerformance = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
  try {
    const navMetric = req.body as NavigationMetric;
    if (!navMetric.screen || !navMetric.transitionDuration) { res.status(400).json({ error: 'Missing required fields' }); return; }
    navMetric.timestamp = admin.firestore.Timestamp.now();
    const docRef = await db.collection('navigationMetrics').add(navMetric);
    const metrics: PerformanceMetric[] = [
      { name: `nav_transition_${navMetric.screen}`, value: navMetric.transitionDuration, unit: 'ms', timestamp: navMetric.timestamp, platform: navMetric.platform, appVersion: '', metadata: { screen: navMetric.screen, previousScreen: navMetric.previousScreen } },
      { name: `nav_render_${navMetric.screen}`, value: navMetric.renderDuration, unit: 'ms', timestamp: navMetric.timestamp, platform: navMetric.platform, appVersion: '', metadata: { screen: navMetric.screen } },
      { name: `nav_interaction_${navMetric.screen}`, value: navMetric.interactionReady, unit: 'ms', timestamp: navMetric.timestamp, platform: navMetric.platform, appVersion: '', metadata: { screen: navMetric.screen } },
    ];
    const batch = db.batch();
    metrics.forEach(metric => { const metricRef = db.collection('performanceMetrics').doc(); batch.set(metricRef, metric); });
    await batch.commit();
    res.status(200).json({ success: true, navigationId: docRef.id });
  } catch (error) {
    console.error('[trackNavigationPerformance] Failed to save navigation metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateAggregates(
  metricName: string,
  sortedValues: number[],
  metrics: PerformanceMetric[]
): Partial<AggregatedMetric> {
  const count = sortedValues.length;
  const sum = sortedValues.reduce((a, b) => a + b, 0);
  const platforms: Record<string, number> = {};
  const appVersions: Record<string, number> = {};
  metrics.forEach(m => {
    platforms[m.platform] = (platforms[m.platform] || 0) + 1;
    appVersions[m.appVersion] = (appVersions[m.appVersion] || 0) + 1;
  });
  return {
    metric: metricName,
    count,
    average: sum / count,
    min: sortedValues[0],
    max: sortedValues[count - 1],
    p50: getPercentile(sortedValues, 0.5),
    p90: getPercentile(sortedValues, 0.9),
    p95: getPercentile(sortedValues, 0.95),
    p99: getPercentile(sortedValues, 0.99),
    platforms,
    appVersions,
  };
}

function getPercentile(sortedValues: number[], percentile: number): number {
  const index = Math.ceil(percentile * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function calculateMedian(values: number[]): number {
  const sorted = values.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function checkPerformanceThresholds(metric: PerformanceMetric) {
  const thresholds: Record<string, number> = {
    screen_transition: 1000,
    screen_render: 2000,
    api_call: 5000,
    app_startup: 3000,
    image_load: 1000,
    data_fetch: 2000,
  };
  for (const [pattern, threshold] of Object.entries(thresholds)) {
    if (metric.name.includes(pattern) && metric.value > threshold) {
      console.warn(`[Performance Alert] ${metric.name}: ${metric.value}ms exceeds threshold of ${threshold}ms`);
      await db.collection('performanceAlerts').add({
        metric: metric.name,
        value: metric.value,
        threshold,
        timestamp: metric.timestamp,
        platform: metric.platform,
        metadata: metric.metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;
    }
  }
}

async function checkPerformanceDegradation(report: any) {
  const twoHoursAgo = new Date(report.startTime.toDate().getTime() - 60 * 60 * 1000);
  const previousReportSnapshot = await db.collection('performanceReports')
    .where('period', '==', 'hour')
    .where('startTime', '>=', admin.firestore.Timestamp.fromDate(twoHoursAgo))
    .where('startTime', '<', admin.firestore.Timestamp.fromDate(report.startTime.toDate()))
    .orderBy('startTime', 'desc')
    .limit(1)
    .get();
  if (previousReportSnapshot.empty) { return; }
  const previousReport = previousReportSnapshot.docs[0].data();
  const previousMetrics = new Map(previousReport.metrics.map((m: any) => [m.metric, m]));
  for (const currentMetric of report.metrics) {
    const previousMetric = previousMetrics.get(currentMetric.metric) as any;
    if (!previousMetric) continue;
    const degradation = ((currentMetric.p90 - previousMetric.p90) / previousMetric.p90) * 100;
    if (degradation > 20) {
      console.warn(`[Performance Degradation] ${currentMetric.metric}: ${degradation.toFixed(2)}% increase in p90`);
      await db.collection('performanceDegradation').add({
        metric: currentMetric.metric,
        previousP90: previousMetric.p90,
        currentP90: currentMetric.p90,
        degradationPercent: degradation,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

async function cleanupOldMetrics() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oldMetricsQuery = db.collection('performanceMetrics')
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(oneDayAgo))
    .limit(500);
  const snapshot = await oldMetricsQuery.get();
  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => { batch.delete(doc.ref); });
    await batch.commit();
    console.log(`[cleanupOldMetrics] Deleted ${snapshot.size} old metrics`);
  }
  const oldNavQuery = db.collection('navigationMetrics')
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(oneDayAgo))
    .limit(500);
  const navSnapshot = await oldNavQuery.get();
  if (!navSnapshot.empty) {
    const batch = db.batch();
    navSnapshot.docs.forEach(doc => { batch.delete(doc.ref); });
    await batch.commit();
    console.log(`[cleanupOldMetrics] Deleted ${navSnapshot.size} old navigation metrics`);
  }
}
