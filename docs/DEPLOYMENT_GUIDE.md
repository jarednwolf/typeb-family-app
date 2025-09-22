# TypeB Family App - Production Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Firebase Setup](#firebase-setup)
4. [Build & Deploy Process](#build--deploy-process)
5. [App Store Submission](#app-store-submission)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code coverage > 80%
- [ ] Performance benchmarks met
- [ ] Security audit passed

### Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] User guide updated
- [ ] Privacy policy current
- [ ] Terms of service current

### Testing
- [ ] Unit tests: ✅ Completed
- [ ] Integration tests: ✅ Completed
- [ ] E2E tests: ✅ Completed
- [ ] Manual testing on all platforms
- [ ] Beta testing feedback addressed

## Environment Configuration

### 1. Production Environment Variables

Create `.env.production` file:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-production-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=typeb-family-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=typeb-family-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=typeb-family-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# RevenueCat
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_IOS=your-ios-key
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_ANDROID=your-android-key

# Sentry
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production

# API Configuration
EXPO_PUBLIC_API_URL=https://api.typebapp.com
EXPO_PUBLIC_WEBSOCKET_URL=wss://ws.typebapp.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
EXPO_PUBLIC_PERFORMANCE_MONITORING=true
```

### 2. Update app.json

```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1",
      "bundleIdentifier": "com.typeb.familyapp"
    },
    "android": {
      "versionCode": 1,
      "package": "com.typeb.familyapp"
    }
  }
}
```

## Firebase Setup

### 1. Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project typeb-family-app

# Deploy Storage rules
firebase deploy --only storage:rules --project typeb-family-app
```

### 2. Deploy Indexes

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes --project typeb-family-app
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions --project typeb-family-app
```

### 4. Configure Firebase Services

- Enable Authentication providers (Email/Password, Google)
- Set up Cloud Storage CORS configuration
- Configure FCM for push notifications
- Set up Analytics and Crashlytics

## Build & Deploy Process

### 1. Clean Build Environment

```bash
# Clean all caches
npm run clean
rm -rf node_modules
rm -rf ios/Pods
npm install
cd ios && pod install && cd ..
```

### 2. Run Production Build Tests

```bash
# Run all tests
npm test -- --coverage
npm run test:integration
npm run test:e2e

# Check bundle size
npx react-native-bundle-visualizer
```

### 3. Build for iOS

```bash
# Using EAS Build
eas build --platform ios --profile production

# Or local build
npm run ios:release
```

### 4. Build for Android

```bash
# Using EAS Build
eas build --platform android --profile production

# Or local build
cd android
./gradlew assembleRelease
# or for AAB
./gradlew bundleRelease
```

### 5. Submit to Stores

```bash
# iOS App Store
eas submit --platform ios --latest

# Google Play Store
eas submit --platform android --latest
```

## App Store Submission

### iOS App Store

1. **Prepare Assets**
   - App icon (1024x1024)
   - Screenshots for all device sizes
   - App preview video (optional)
   - Description and keywords

2. **App Store Connect Setup**
   - Create app listing
   - Fill in app information
   - Set pricing and availability
   - Configure in-app purchases
   - Submit for review

3. **TestFlight Beta**
   ```bash
   eas build --platform ios --profile preview
   eas submit --platform ios
   ```

### Google Play Store

1. **Prepare Assets**
   - Feature graphic (1024x500)
   - Screenshots for phones and tablets
   - Short and full descriptions
   - Privacy policy URL

2. **Google Play Console Setup**
   - Create app listing
   - Upload AAB file
   - Set up pricing
   - Configure in-app products
   - Submit for review

3. **Internal Testing Track**
   ```bash
   eas build --platform android --profile preview
   eas submit --platform android --track internal
   ```

## Monitoring & Maintenance

### 1. Setup Monitoring

```bash
# Verify Sentry integration
npx sentry-cli releases list

# Test crash reporting
npx sentry-cli send-event -m "Test deployment event"
```

### 2. Performance Monitoring

- Firebase Performance Monitoring dashboard
- Custom performance metrics
- API response times
- Screen load times
- Bundle size tracking

### 3. Error Tracking

```javascript
// Monitor critical errors
Sentry.captureException(error, {
  tags: {
    section: 'deployment',
    severity: 'critical'
  }
});
```

### 4. Analytics Setup

- User engagement metrics
- Feature usage tracking
- Conversion funnels
- Revenue metrics

## Rollback Procedures

### 1. Emergency Rollback

```bash
# Revert to previous version
git checkout tags/v1.0.0-stable
eas build --platform all --profile production
eas submit --platform all
```

### 2. Firebase Rules Rollback

```bash
# Restore previous rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules --project typeb-family-app
```

### 3. Function Rollback

```bash
# List function versions
firebase functions:list --project typeb-family-app

# Rollback to specific version
firebase functions:rollback functionName:version --project typeb-family-app
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear Watchman
watchman watch-del-all

# Clean build folders
cd ios && xcodebuild clean && cd ..
cd android && ./gradlew clean && cd ..
```

#### Signing Issues (iOS)

```bash
# Update certificates
eas credentials:configure --platform ios

# Verify provisioning profiles
eas build:inspect --platform ios --profile production
```

#### Signing Issues (Android)

```bash
# Generate new keystore
keytool -genkey -v -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Verify keystore
keytool -list -v -keystore release.keystore
```

#### Firebase Connection Issues

```bash
# Verify configuration
firebase projects:list
firebase use typeb-family-app

# Test functions locally
npm run serve
```

## Post-Deployment

### 1. Verification

- [ ] App launches without crashes
- [ ] User can sign up/sign in
- [ ] Core features working
- [ ] Payments processing
- [ ] Push notifications working
- [ ] Analytics recording events
- [ ] Crash reporting active

### 2. Monitor Initial Hours

- Watch crash reports
- Monitor API errors
- Check performance metrics
- Review user feedback
- Monitor server costs

### 3. Communication

- Update status page
- Notify beta testers
- Send release notes
- Update documentation
- Team celebration! 🎉

## Useful Commands

```bash
# Check current version
npm version

# Bump version
npm version patch/minor/major

# Tag release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Create release branch
git checkout -b release/v1.0.0
git push -u origin release/v1.0.0

# Monitor logs
firebase functions:log --project typeb-family-app

# Check bundle size
npx react-native-bundle-visualizer

# Profile performance
npx react-native profile
```

## Support Contacts

- **Technical Issues**: tech@typebapp.com
- **Firebase Support**: https://firebase.google.com/support
- **RevenueCat Support**: https://www.revenuecat.com/support
- **Sentry Support**: https://sentry.io/support

## Release Notes Template

```markdown
## Version 1.0.0 - Production Release

### New Features
- Photo validation for task completion
- Premium subscription with RevenueCat
- Real-time family sync
- Push notifications
- Offline support

### Improvements
- Performance optimizations
- Enhanced security
- Better error handling
- Improved UI/UX

### Bug Fixes
- Fixed photo upload issues
- Resolved sync conflicts
- Fixed memory leaks

### Known Issues
- Minor UI glitch on older Android devices
- Occasional delay in push notifications

### Coming Soon
- Advanced analytics
- Family challenges
- Voice notes
```

---

**Remember**: Always test in production-like environment before deploying. Have rollback plan ready. Monitor closely after deployment.
