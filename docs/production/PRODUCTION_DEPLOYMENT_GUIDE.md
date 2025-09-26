# TypeB Family App - Production Deployment Guide

This guide walks through the complete process of deploying the TypeB Family App to production.

## Table of Contents
1. [Firebase Project Setup](#firebase-project-setup)
2. [Environment Configuration](#environment-configuration)
3. [Third-Party Services](#third-party-services)
4. [Building & Deployment](#building--deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Post-Deployment Checklist](#post-deployment-checklist)

## Firebase Project Setup

### 1. Create Production Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it: `typeb-family-app-prod` (or similar)
4. Enable Google Analytics (select existing account or create new)
5. Wait for project creation to complete

### 2. Enable Required Services

Navigate to each service and enable:

- **Authentication**
  - Enable Email/Password provider
  - Configure authorized domains
  - Set up email templates for password reset

- **Firestore Database**
  - Create database in production mode
  - Select closest region to your users
  - Deploy security rules: `firebase deploy --only firestore:rules`

- **Storage**
  - Enable Cloud Storage
  - Deploy storage rules: `firebase deploy --only storage`

- **Cloud Functions**
  - Upgrade to Blaze plan (required for functions)
  - Set your billing alerts

### 3. Configure Firebase in Console

1. **Add iOS App**
   - Bundle ID: `com.typeb.familyapp`
   - Download `GoogleService-Info.plist`
   - Place in `ios/TypeBFamily/`

2. **Add Android App**
   - Package name: `com.typeb.familyapp`
   - Download `google-services.json`
   - Place in `android/app/`

3. **Add Web App** (for configuration)
   - App nickname: "TypeB Family Web Config"
   - Copy configuration values

### 4. Deploy Cloud Functions

```bash
cd typeb-family-app/functions

# Set production environment variables
firebase functions:config:set \
  sentry.dsn="your-sentry-dsn" \
  monitoring.webhook_url="your-webhook" \
  monitoring.slack_webhook="your-slack-webhook" \
  email.sendgrid_api_key="your-sendgrid-key" \
  email.from="noreply@typebapp.com"

# Deploy functions to production
firebase use typeb-family-app-prod
firebase deploy --only functions
```

## Environment Configuration

### 1. Update .env.production

Replace placeholders in `.env.production` with actual values:

```bash
# Production Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIza... # From Firebase Console
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=typeb-family-app-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=typeb-family-app-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=typeb-family-app-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Cloud Functions URL
EXPO_PUBLIC_CLOUD_FUNCTIONS_URL=https://us-central1-typeb-family-app-prod.cloudfunctions.net
```

### 2. Configure EAS Build

Create/update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "staging"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./path/to/service-account.json"
      }
    }
  }
}
```

## Third-Party Services

### 1. Sentry Setup

1. Create project at [sentry.io](https://sentry.io)
2. Install Sentry SDK:
   ```bash
   npm install sentry-expo
   ```
3. Configure in app:
   ```typescript
   // App.tsx
   import * as Sentry from 'sentry-expo';
   
   Sentry.init({
     dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
     enableInExpoDevelopment: false,
     debug: false,
   });
   ```

### 2. RevenueCat Setup

1. Create app in [RevenueCat dashboard](https://app.revenuecat.com)
2. Configure products for iOS and Android
3. Get API keys for each platform
4. Update `.env.production` with keys

### 3. Push Notifications

#### iOS Setup:
1. Enable Push Notifications capability in Xcode
2. Create APNs key in Apple Developer Console
3. Upload to Firebase Console > Project Settings > Cloud Messaging

#### Android Setup:
1. FCM is automatically configured with Firebase
2. Ensure `google-services.json` is in place

### 4. Analytics Services (Optional)

Configure additional analytics if needed:
- Mixpanel: Add project token
- Amplitude: Add API key
- Custom analytics endpoint

## Building & Deployment

### 1. Pre-Build Checklist

- [ ] All environment variables set
- [ ] Firebase services deployed
- [ ] Third-party services configured
- [ ] App icons and splash screens updated
- [ ] Version numbers incremented in app.json

### 2. Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build both platforms
eas build --platform all --profile production
```

### 3. Testing Production Builds

Before submitting to stores:
1. Download builds from EAS
2. Test on real devices
3. Verify all features work
4. Check crash reporting
5. Monitor performance metrics

### 4. Submit to App Stores

```bash
# Submit iOS to TestFlight
eas submit --platform ios --profile production

# Submit Android to Play Console
eas submit --platform android --profile production
```

## Monitoring Setup

### 1. Firebase Console Monitoring

Set up dashboards for:
- Crashlytics (crash reports)
- Performance Monitoring
- Analytics events
- Cloud Functions logs

### 2. Custom Monitoring Dashboard

Create a monitoring dashboard with:
- Real-time error rates
- Performance metrics graphs
- User activity analytics
- Business metrics (conversions, retention)

### 3. Alert Configuration

Configure alerts for:
- Crash rate > 1%
- Function errors > 100/hour
- Performance degradation > 20%
- API response time > 3s

### 4. Slack Integration

Set up Slack webhooks for:
- Critical errors
- Performance alerts
- Daily summaries
- User feedback

## Post-Deployment Checklist

### Immediate (First 24 hours)
- [ ] Monitor crash reports
- [ ] Check performance metrics
- [ ] Verify analytics tracking
- [ ] Test all critical user flows
- [ ] Monitor Cloud Functions execution

### First Week
- [ ] Review user feedback
- [ ] Analyze performance data
- [ ] Check conversion funnels
- [ ] Monitor server costs
- [ ] Plan first update based on feedback

### Ongoing Maintenance
- [ ] Weekly performance reviews
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Regular backup verification
- [ ] Cost optimization reviews

## Rollback Plan

In case of critical issues:

1. **Immediate Rollback**
   - Remove from app stores if critical
   - Deploy hotfix via CodePush (if configured)
   - Revert Cloud Functions if needed

2. **Communication**
   - Notify users via in-app message
   - Update status page
   - Send email if necessary

3. **Fix and Redeploy**
   - Identify root cause
   - Fix in development
   - Test thoroughly
   - Deploy fixed version

## Security Checklist

- [ ] API keys not exposed in code
- [ ] Firestore rules properly restrictive
- [ ] Storage rules limit file sizes/types
- [ ] Authentication properly configured
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced everywhere
- [ ] Rate limiting implemented
- [ ] Input validation on all forms

## Performance Optimization

- [ ] Images optimized and lazy loaded
- [ ] Code splitting implemented
- [ ] Caching strategies in place
- [ ] Database queries optimized
- [ ] Background tasks properly managed
- [ ] Memory leaks addressed

## Support Information

- **Email**: support@typebapp.com
- **Documentation**: https://docs.typebapp.com
- **Status Page**: https://status.typebapp.com
- **Developer Portal**: https://developers.typebapp.com

---

Last updated: 2025-08-17
Version: 1.0.0