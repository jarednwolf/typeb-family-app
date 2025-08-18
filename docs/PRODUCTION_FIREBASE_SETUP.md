# Production Firebase Setup Guide

This guide walks through creating and configuring a production Firebase project for the TypeB Family App.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Google account with billing enabled
- Access to Apple Developer account (for iOS push notifications)
- Access to Google Play Console (for Android push notifications)

## Step 1: Create Production Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `typeb-family-production`
4. Enable Google Analytics
5. Select or create a Google Analytics account
6. Review and accept terms

## Step 2: Enable Required Services

### Authentication
1. Navigate to Authentication > Sign-in method
2. Enable the following providers:
   - Email/Password
   - Google Sign-In
   - Apple Sign-In (configure with Apple credentials)

### Firestore Database
1. Navigate to Firestore Database
2. Click "Create database"
3. Select production mode
4. Choose multi-region location (nam5 recommended for US)
5. Apply security rules from `firestore.rules`

### Cloud Storage
1. Navigate to Storage
2. Click "Get started"
3. Select production mode
4. Choose same region as Firestore
5. Apply security rules from `storage.rules`

### Cloud Functions
1. Navigate to Functions
2. Upgrade to Blaze plan (pay-as-you-go)
3. Deploy functions:
   ```bash
   cd functions
   npm install
   firebase use typeb-family-production
   firebase deploy --only functions
   ```

## Step 3: Configure Firebase Projects

### iOS Configuration
1. In Firebase Console, click "Add app" > iOS
2. Enter iOS bundle ID: `com.typeb.family`
3. Download `GoogleService-Info.plist`
4. Replace the file in `ios/TypeBFamily/`
5. Configure APNs:
   - Upload APNs authentication key or certificates
   - Found in Project Settings > Cloud Messaging

### Android Configuration
1. In Firebase Console, click "Add app" > Android
2. Enter Android package name: `com.typeb.family`
3. Download `google-services.json`
4. Replace the file in `android/app/`
5. Add SHA-1 fingerprint for Google Sign-In

## Step 4: Environment Configuration

1. Copy `.env.production.example` to `.env.production`
2. Update with production values:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your-production-api-key
   FIREBASE_AUTH_DOMAIN=typeb-family-production.firebaseapp.com
   FIREBASE_PROJECT_ID=typeb-family-production
   FIREBASE_STORAGE_BUCKET=typeb-family-production.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Third-party Services
   SENTRY_DSN=your-sentry-dsn
   REVENUECAT_API_KEY=your-revenuecat-key
   MIXPANEL_TOKEN=your-mixpanel-token
   ```

## Step 5: Configure Cloud Functions Environment

Set environment variables for Cloud Functions:
```bash
firebase functions:config:set \
  sendgrid.api_key="your-sendgrid-key" \
  sentry.dsn="your-sentry-dsn" \
  app.base_url="https://typeb.family"
```

## Step 6: Initialize Production Data

### Create Firestore Indexes
Deploy Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```

### Set Up Initial Data
1. Create admin user account
2. Initialize achievement catalog:
   ```javascript
   // Run in Firebase Console or admin script
   const batch = db.batch();
   ACHIEVEMENTS_CATALOG.forEach(achievement => {
     const ref = db.collection('achievementsCatalog').doc(achievement.id);
     batch.set(ref, achievement);
   });
   await batch.commit();
   ```

## Step 7: Configure Monitoring

### Performance Monitoring
1. Navigate to Performance in Firebase Console
2. Verify Performance Monitoring is enabled
3. Set up custom traces and metrics

### Crashlytics
1. Navigate to Crashlytics
2. Follow platform-specific setup instructions
3. Force a test crash to verify setup

### Analytics
1. Navigate to Analytics
2. Configure conversion events:
   - `sign_up`
   - `task_completed`
   - `premium_purchase`
   - `achievement_unlocked`
3. Set up audiences for targeting

## Step 8: Security Checklist

- [ ] Firestore security rules deployed and tested
- [ ] Storage security rules deployed and tested  
- [ ] API keys restricted by platform/domain
- [ ] App Check enabled for all services
- [ ] Cloud Functions have proper authentication
- [ ] Sensitive data encrypted at rest
- [ ] Regular security rules audits scheduled

## Step 9: Production Testing

1. Create test family accounts
2. Verify all features work correctly:
   - Authentication flows
   - Task management
   - Real-time updates
   - Push notifications
   - Premium features
   - Analytics tracking

## Step 10: Go Live Checklist

- [ ] All environment variables configured
- [ ] Security rules thoroughly tested
- [ ] Monitoring dashboards set up
- [ ] Backup strategy implemented
- [ ] Incident response plan documented
- [ ] Rate limiting configured
- [ ] Cost alerts set up
- [ ] Documentation updated

## Maintenance

### Regular Tasks
- Monitor Firebase usage and costs
- Review security rules quarterly
- Update dependencies monthly
- Audit user permissions
- Check error rates and performance

### Backup Strategy
- Enable Firestore automated backups
- Configure backup retention (30 days recommended)
- Document restore procedures
- Test restore process quarterly

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify OAuth redirect URIs
   - Check API key restrictions
   - Ensure correct bundle IDs/package names

2. **Push Notification Issues**
   - Verify APNs/FCM configuration
   - Check device tokens are saved
   - Test with Firebase Console

3. **Performance Issues**
   - Review Firestore indexes
   - Optimize security rules
   - Check Cloud Function cold starts
   - Monitor quota usage

## Support

For production issues:
1. Check Firebase Status: https://status.firebase.google.com/
2. Review error logs in Firebase Console
3. Contact Firebase Support for critical issues