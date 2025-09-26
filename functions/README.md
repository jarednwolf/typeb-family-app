# TypeB Family App - Cloud Functions

This directory contains Firebase Cloud Functions for the TypeB Family App production backend.

## Overview

### Error Reporting Functions (`errorReporting.ts`)
- **processErrorReports**: Triggered when error reports are created in Firestore
- **reportError**: HTTP endpoint for receiving individual error reports
- **reportErrorBatch**: HTTP endpoint for batch error reporting
- **generateDailyErrorReport**: Scheduled function for daily error summaries

### Performance Monitoring Functions (`performanceMetrics.ts`)
- **reportPerformanceMetric**: HTTP endpoint for individual performance metrics
- **reportPerformanceMetricsBatch**: HTTP endpoint for batch performance metrics
- **aggregatePerformanceMetrics**: Runs every 5 minutes to aggregate metrics
- **generateHourlyPerformanceReport**: Hourly performance reports
- **trackNavigationPerformance**: Special endpoint for navigation metrics

### Analytics Functions (`analytics.ts`)
- **trackAnalyticsEvent**: HTTP endpoint for analytics events
- **trackAnalyticsEventsBatch**: Batch analytics events endpoint
- **aggregateAnalyticsEvents**: Runs every 10 minutes for aggregation
- **generateDailyAnalyticsReport**: Daily analytics summaries
- **trackUserSession**: Session tracking endpoint

### Existing Functions
- **approveTaskAndAwardPoints**: Task approval workflow
- **redeemReward**: Points redemption
- **generateThumbnail**: Image processing for uploads

## Deployment

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Production Firebase project created

### Initial Setup
```bash
# Navigate to functions directory
cd typeb-family-app/functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variables for functions
firebase functions:config:set \
  sentry.dsn="your-sentry-dsn" \
  monitoring.webhook_url="your-webhook-url" \
  analytics.webhook_url="your-analytics-webhook"
```

### Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function groups
firebase deploy --only functions:errorReporting
firebase deploy --only functions:performanceMetrics
firebase deploy --only functions:analytics

# Deploy individual function
firebase deploy --only functions:processErrorReports
```

### Environment Variables
Configure these in Firebase Functions config:
```bash
# Sentry integration
firebase functions:config:set sentry.dsn="your-dsn"

# Monitoring webhooks
firebase functions:config:set monitoring.webhook_url="https://your-webhook"
firebase functions:config:set monitoring.slack_webhook="https://hooks.slack.com/..."

# Email notifications
firebase functions:config:set email.sendgrid_api_key="your-key"
firebase functions:config:set email.from="noreply@typebapp.com"
```

## Monitoring & Alerts

### Critical Error Alerts
The system automatically alerts on:
- Fatal errors
- Authentication failures
- Payment failures
- Out of memory errors
- Unhandled exceptions

### Performance Alerts
Triggered when:
- Screen transition > 1000ms
- API calls > 5000ms
- App startup > 3000ms
- Performance degradation > 20%

### Analytics Tracking
Key business metrics tracked:
- Sign-ups and conversions
- Task completion rates
- Premium conversions
- User retention
- Session duration

## Firestore Collections

### Write-only (from app)
- `errorReports`: Error reports from the app
- `performanceMetrics`: Performance measurements
- `analyticsEvents`: User analytics events
- `navigationMetrics`: Navigation performance data
- `userSessions`: Session tracking

### Server-only (Cloud Functions)
- `errorSummaries`: Aggregated error data
- `performanceAggregates`: Aggregated performance data
- `analyticsAggregates`: Aggregated analytics
- `businessMetrics`: Key business events
- `criticalErrors`: High-priority alerts
- `performanceAlerts`: Performance issues
- `performanceDegradation`: Performance trend alerts

### Reports (read by dashboard)
- `errorReportsSummary`: Daily error reports
- `performanceReports`: Hourly performance reports
- `analyticsReports`: Daily analytics reports

## Testing

### Local Testing with Emulators
```bash
# Start Firebase emulators
firebase emulators:start

# Run functions shell for testing
npm run shell

# Test HTTP functions
curl -X POST http://localhost:5001/your-project/us-central1/reportError \
  -H "Content-Type: application/json" \
  -d '{"message":"Test error","platform":"ios"}'
```

### Unit Tests
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Best Practices

1. **Error Handling**: All functions have try-catch blocks and log errors
2. **Batching**: Use batch endpoints for multiple items (500 item limit)
3. **Cleanup**: Old data is automatically cleaned up after retention period
4. **Performance**: Functions use transactions for atomic operations
5. **Security**: All endpoints validate authentication and input

## Troubleshooting

### Common Issues

1. **Function timeout**: Increase timeout in function config
2. **Memory issues**: Increase memory allocation
3. **Cold starts**: Use minimum instances for critical functions
4. **CORS errors**: Check CORS headers in HTTP functions

### Viewing Logs
```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only processErrorReports

# Stream logs
firebase functions:log --follow
```

## Maintenance

### Regular Tasks
- Monitor function execution times
- Check error rates in Firebase Console
- Review aggregated reports
- Update function dependencies monthly
- Review and optimize Firestore indexes

### Scaling Considerations
- Functions auto-scale based on load
- Consider regional deployment for global users
- Use Cloud Tasks for long-running operations
- Implement rate limiting for public endpoints