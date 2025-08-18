# Third-Party Services Setup Guide

This guide covers the setup and configuration of third-party services for the TypeB Family App production environment.

## Overview

The TypeB Family App integrates with several third-party services:
- **Sentry** - Error tracking and performance monitoring
- **RevenueCat** - In-app purchase management
- **OneSignal** - Push notification service
- **Mixpanel** - Advanced analytics
- **SendGrid** - Transactional emails

## 1. Sentry Setup

### Create Sentry Project
1. Sign up at [sentry.io](https://sentry.io)
2. Create new organization: "TypeB"
3. Create new project:
   - Platform: React Native
   - Name: typeb-family-app
4. Note your DSN from project settings

### Configure Sentry
```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Login to Sentry
sentry-cli login

# Initialize Sentry in the project
cd typeb-family-app
npx @sentry/wizard -i reactNative
```

### Update Configuration
1. Add to `.env.production`:
   ```env
   SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/PROJECT_ID
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=typeb
   SENTRY_PROJECT=typeb-family-app
   ```

2. Configure source maps upload in `ios/fastlane/Fastfile` and `android/fastlane/Fastfile`

### Set Up Alerts
1. Navigate to Alerts in Sentry
2. Create alert rules:
   - Error rate > 1% in 5 minutes
   - New error types
   - Performance degradation
   - Crash-free rate < 99.5%

## 2. RevenueCat Setup

### Create RevenueCat Account
1. Sign up at [revenuecat.com](https://www.revenuecat.com)
2. Create new project: "TypeB Family"
3. Add app:
   - iOS: com.typeb.family
   - Android: com.typeb.family

### Configure Products
1. Create Entitlement: "premium"
2. Add products:
   - `typeb_premium_monthly` - $4.99/month
   - `typeb_premium_yearly` - $39.99/year
   - `typeb_premium_lifetime` - $99.99

### iOS Configuration
1. In App Store Connect:
   - Create IAP products matching RevenueCat
   - Create subscription group: "TypeB Premium"
2. In RevenueCat:
   - Add App Store Connect API key
   - Configure products

### Android Configuration
1. In Google Play Console:
   - Create subscription products
   - Set up licensing
2. In RevenueCat:
   - Add Play Store service account
   - Configure products

### Implementation
1. Add to `.env.production`:
   ```env
   REVENUECAT_API_KEY_IOS=appl_YOUR_IOS_KEY
   REVENUECAT_API_KEY_ANDROID=goog_YOUR_ANDROID_KEY
   ```

2. Configure webhooks:
   - URL: `https://us-central1-typeb-family-production.cloudfunctions.net/handleRevenueCatWebhook`
   - Events: All events

## 3. OneSignal Setup

### Create OneSignal App
1. Sign up at [onesignal.com](https://onesignal.com)
2. Create new app: "TypeB Family"
3. Configure platforms:
   - iOS: Upload p12 certificate or auth key
   - Android: Add FCM server key

### Configure OneSignal
1. Add to `.env.production`:
   ```env
   ONESIGNAL_APP_ID=your-app-id
   ONESIGNAL_REST_API_KEY=your-rest-api-key
   ```

2. Set up segments:
   - Parents
   - Children
   - Premium Users
   - Inactive Users (7+ days)

### Notification Templates
Create templates for:
1. Task reminders
2. Achievement unlocked
3. Family milestones
4. Chat messages
5. Premium upgrade prompts

### Automation
Set up automated messages:
- Welcome series (3 messages over 7 days)
- Re-engagement (after 3 days inactive)
- Premium trial expiring
- Weekly family summary

## 4. Mixpanel Setup

### Create Mixpanel Project
1. Sign up at [mixpanel.com](https://mixpanel.com)
2. Create project: "TypeB Family Production"
3. Note your project token

### Configure Mixpanel
1. Add to `.env.production`:
   ```env
   MIXPANEL_TOKEN=your-project-token
   ```

2. Set up event tracking:
   ```javascript
   // Core events to track
   - user_signup
   - user_login
   - task_created
   - task_completed
   - achievement_unlocked
   - premium_started
   - chat_message_sent
   - family_member_added
   ```

### Create Dashboards
1. **User Engagement Dashboard**
   - DAU/MAU ratio
   - Session duration
   - Feature adoption
   - Retention cohorts

2. **Task Completion Dashboard**
   - Tasks per user
   - Completion rates by category
   - Photo validation rates
   - Streak tracking

3. **Revenue Dashboard**
   - MRR/ARR
   - Conversion funnel
   - Churn rate
   - LTV by acquisition channel

### Set Up Reports
Weekly email reports for:
- Key metrics summary
- User growth
- Revenue metrics
- Feature usage

## 5. SendGrid Setup

### Create SendGrid Account
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify sender domain: typeb.family
3. Create API key with full access

### Configure SendGrid
1. Add to Cloud Functions config:
   ```bash
   firebase functions:config:set sendgrid.api_key="SG.YOUR_API_KEY"
   firebase functions:config:set sendgrid.from_email="hello@typeb.family"
   firebase functions:config:set sendgrid.from_name="TypeB Family"
   ```

2. Create email templates:
   - Welcome email
   - Password reset
   - Family invitation
   - Weekly summary
   - Achievement celebration
   - Premium welcome

### Email Automation
Set up triggered emails:
1. Welcome series
2. Onboarding tips
3. Feature announcements
4. Milestone celebrations

## 6. Integration Checklist

### Development Environment
- [ ] All API keys in `.env.development`
- [ ] Test mode enabled for all services
- [ ] Webhook endpoints configured
- [ ] Error handling implemented

### Staging Environment
- [ ] Separate projects/apps created
- [ ] Limited test data
- [ ] Monitoring enabled
- [ ] Alerts configured

### Production Environment
- [ ] Production API keys in `.env.production`
- [ ] Webhooks pointing to production
- [ ] Rate limiting configured
- [ ] Backup payment processor ready

## 7. Security Best Practices

### API Key Management
1. Never commit API keys to version control
2. Use environment variables
3. Restrict API keys by:
   - IP address (for servers)
   - Bundle ID (for mobile)
   - Domain (for web)

### Webhook Security
1. Validate webhook signatures
2. Use HTTPS only
3. Implement idempotency
4. Add request timeouts

### Data Privacy
1. Implement data retention policies
2. Honor user deletion requests
3. Encrypt sensitive data
4. Regular security audits

## 8. Monitoring & Alerts

### Service Status Monitoring
Use StatusPage or similar to monitor:
- Sentry API
- RevenueCat API
- OneSignal delivery
- SendGrid delivery
- Mixpanel ingestion

### Cost Monitoring
Set up alerts for:
- Sentry event volume
- OneSignal notification count
- SendGrid email volume
- Mixpanel data points

### Performance Monitoring
Track:
- API response times
- Webhook processing time
- Email delivery rates
- Push notification delivery rates

## 9. Disaster Recovery

### Backup Services
For each critical service, have ready:
1. Alternative provider evaluated
2. Migration plan documented
3. Data export automated
4. Fallback configuration prepared

### Service Degradation Plan
1. **Sentry down**: Fall back to console logging
2. **RevenueCat down**: Cache subscription status locally
3. **OneSignal down**: Queue notifications for retry
4. **SendGrid down**: Use backup email service
5. **Mixpanel down**: Store events locally, batch send later

## 10. Testing

### Integration Tests
```javascript
// Test each service integration
describe('Third Party Services', () => {
  test('Sentry captures errors', async () => {
    // Test error capture
  });
  
  test('RevenueCat validates receipts', async () => {
    // Test purchase flow
  });
  
  test('OneSignal sends notifications', async () => {
    // Test notification delivery
  });
  
  test('SendGrid sends emails', async () => {
    // Test email delivery
  });
  
  test('Mixpanel tracks events', async () => {
    // Test event tracking
  });
});
```

### Load Testing
1. Simulate high volume of:
   - Error reports
   - Purchase validations
   - Push notifications
   - Email sends
   - Analytics events

2. Verify:
   - No data loss
   - Acceptable latency
   - Proper rate limiting
   - Graceful degradation

## Maintenance

### Monthly Tasks
- Review service usage vs. limits
- Audit API key permissions
- Update webhook endpoints if needed
- Check for service updates/deprecations

### Quarterly Tasks
- Review and optimize costs
- Audit data retention
- Update integration libraries
- Security review

### Annual Tasks
- Renegotiate service contracts
- Evaluate alternative providers
- Comprehensive security audit
- Disaster recovery drill