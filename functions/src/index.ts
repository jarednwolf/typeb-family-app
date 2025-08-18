import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all cloud functions

// Task functions
export { approveTaskAndAwardPoints, redeemReward } from './tasks';

// Storage functions
export { generateThumbnail } from './storage';

// Error reporting functions
export {
  processErrorReports,
  reportError,
  reportErrorBatch,
  generateDailyErrorReport
} from './errorReporting';

// Performance monitoring functions
export {
  reportPerformanceMetric,
  reportPerformanceMetricsBatch,
  aggregatePerformanceMetrics,
  generateHourlyPerformanceReport,
  trackNavigationPerformance
} from './performanceMetrics';

// Analytics functions
export {
  trackAnalyticsEvent,
  trackAnalyticsEventsBatch,
  aggregateAnalyticsEvents,
  generateDailyAnalyticsReport,
  trackUserSession
} from './analytics';