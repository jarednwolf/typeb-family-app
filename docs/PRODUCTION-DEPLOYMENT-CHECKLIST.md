# Production Deployment Checklist for TypeB Family App

## ✅ Completed Steps

### 1. EAS Configuration
- [x] EAS account logged in (wolfjn1)
- [x] EAS project created and linked
- [x] Project ID: 0b1cab38-fdeb-4b64-a3bb-874e84c9d5c9
- [x] Project URL: https://expo.dev/accounts/wolfjn1/projects/typeb-family-app

### 2. Firebase Deployment
- [x] Security rules deployed to production
- [x] Firestore indexes deployed (some already existed)
- [x] Project console: https://console.firebase.google.com/project/typeb-family-app/overview

## 🔄 In Progress

### 3. External Services Setup
**RevenueCat** (Awaiting Account Creation)
- [ ] Create account at https://app.revenuecat.com
- [ ] Configure iOS app (Bundle ID: com.typeb.familyapp)
- [ ] Configure Android app (Package: com.typeb.familyapp)
- [ ] Create products:
  - typeb_premium_monthly ($4.99/month, 7-day trial)
  - typeb_premium_annual ($39.99/year, 7-day trial)
- [ ] Create entitlement: "premium"
- [ ] Get API keys (iOS starts with appl_, Android with goog_)

**Sentry** (Awaiting Account Creation)
- [ ] Create account at https://sentry.io
- [ ] Create React Native project
- [ ] Get DSN
- [ ] Configure alerts and integrations

### 4. Environment Variables
Once you have the API keys, update `.env.production`:
```env
# Replace these placeholders with actual keys
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_[YOUR_ACTUAL_KEY]
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_[YOUR_ACTUAL_KEY]
EXPO_PUBLIC_SENTRY_DSN=https://[YOUR_KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
```

## 📱 Build & Submit Process

### 5. Build Apps (After API Keys are Set)
```bash
# iOS Production Build
cd typeb-family-app
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production

# Check build status
eas build:list
```

### 6. Submit to Stores
```bash
# Submit to TestFlight
eas submit --platform ios --latest

# Submit to Google Play
eas submit --platform android --latest
```

### 7. Store Configuration Needed
**iOS (App Store Connect)**
- [ ] Apple Developer account required ($99/year)
- [ ] Update eas.json with:
  - Apple ID email
  - App Store Connect App ID
  - Apple Team ID

**Android (Google Play Console)**
- [ ] Google Play Developer account required ($25 one-time)
- [ ] Service account key JSON file
- [ ] Update eas.json with service account path

## 🧪 E2E Test Fixes (Can be done in parallel)

### Current Test Status
- Authentication tests: Failing (needs test ID updates)
- Family management tests: Failing (timing issues)
- Task tests: Failing (photo upload issues)

### Fix Strategy
1. Run test ID update script
2. Fix timing issues in wait helpers
3. Update selectors for new UI
4. Run tests individually to isolate issues

## 📊 Pre-Launch Verification

### Technical Checklist
- [ ] All API keys configured and working
- [ ] Payment flow tested in sandbox
- [ ] Error tracking verified with test error
- [ ] Performance acceptable (<1s response times)
- [ ] Security rules tested
- [ ] Offline mode working

### Business Checklist
- [ ] Privacy policy URL active
- [ ] Terms of service URL active
- [ ] Support email configured
- [ ] App store descriptions ready
- [ ] Screenshots prepared (6.5", 5.5", iPad)
- [ ] App icon in all required sizes

## 🚀 Launch Day Checklist

### Final Verification
- [ ] Production build tested on real devices
- [ ] All features working correctly
- [ ] Analytics tracking verified
- [ ] Crash reporting active
- [ ] Support system ready

### Monitoring Setup
- [ ] RevenueCat dashboard bookmarked
- [ ] Sentry alerts configured
- [ ] Firebase console accessible
- [ ] App Store Connect notifications on
- [ ] Google Play Console notifications on

## 📝 Post-Launch Tasks

### Day 1
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Respond to support tickets
- [ ] Track conversion metrics

### Week 1
- [ ] Analyze user behavior
- [ ] Fix critical bugs
- [ ] Update based on feedback
- [ ] Plan first update

## 🔗 Important Links

### Development
- EAS Project: https://expo.dev/accounts/wolfjn1/projects/typeb-family-app
- Firebase Console: https://console.firebase.google.com/project/typeb-family-app
- GitHub Repo: [Your GitHub URL]

### External Services
- RevenueCat: https://app.revenuecat.com
- Sentry: https://sentry.io
- Firebase: https://console.firebase.google.com

### App Stores
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

## 📞 Support Contacts

### Technical Support
- Expo/EAS: https://expo.dev/support
- Firebase: https://firebase.google.com/support
- RevenueCat: support@revenuecat.com
- Sentry: support@sentry.io

### Store Support
- Apple Developer: https://developer.apple.com/support
- Google Play: https://support.google.com/googleplay/android-developer

---

**Last Updated**: January 9, 2025  
**Status**: Ready for external service configuration  
**Next Steps**: Create RevenueCat and Sentry accounts, then update environment variables