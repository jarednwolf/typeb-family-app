# Next Session Prompt for TypeB Family App

Copy and paste this entire prompt into Claude 4.1 Opus:

---

## PROMPT:

I need help completing the production launch of my TypeB Family App. Here's the current status and what needs to be done:

## Project Overview
- **App Name**: TypeB Family App
- **Version**: 1.1.0
- **Location**: `/Users/jared.wolf/Projects/personal/tybeb_b/typeb-family-app`
- **Description**: Family task management app with premium features (photo validation, custom categories, smart notifications, analytics, payments, support)
- **Tech Stack**: React Native, Expo, Firebase, RevenueCat, Sentry

## Current Status (85% Complete)

### ✅ What's Done:
1. **All features implemented** - 6 premium features working
2. **Testing complete** - 253 component tests passing
3. **Firebase deployed** - Rules, indexes, all services live in production
4. **RevenueCat configured** - iOS API Key: `appl_KIZQUiQQubnWSzibevPYMVWWTjC`
5. **Sentry integrated** - Project ID: 4509816890851328
6. **App icons created** - Generated from TypeB logo
7. **Version updated** - Now at 1.1.0
8. **Git configured** - Tagged as v1.1.0

### 🚧 Current Blocker:
**iOS Build SDK Issue** - Apple requires iOS 18 SDK (Xcode 16+) as of April 24, 2025. Our last build (#6) was rejected from TestFlight because it used an older SDK. The `eas.json` has been updated to use `"image": "latest"` but we need to rebuild.

### ⏳ What's Left:

#### Immediate Priority (Today):
1. **Rebuild iOS app with iOS 18 SDK**
   ```bash
   cd /Users/jared.wolf/Projects/personal/tybeb_b/typeb-family-app
   eas build --platform ios --profile production --clear-cache
   ```

2. **Submit to TestFlight**
   ```bash
   eas submit --platform ios --latest
   ```
   - Use API Key: 3QKNJ9VR94
   - Need app-specific password (not regular Apple ID password)

3. **Configure TestFlight**
   - Add test information
   - Create testing groups
   - Invite beta testers

#### Next Priority (This Weekend):
4. **Build Android version**
   ```bash
   eas build --platform android --profile production
   ```

5. **Submit to Google Play**
   - Internal testing track first
   - Then production release

#### Lower Priority:
6. **Fix E2E tests** - 7 files need test IDs (non-blocking)
7. **Configure free trial** - Can only be done after TestFlight submission
8. **Create app store assets** - Screenshots, descriptions, keywords

## Key Information

### Apple/App Store:
- **Bundle ID**: com.typeb.familyapp
- **App Store Connect ID**: 6749812496
- **Apple ID**: wolfjn1@gmail.com
- **Team ID**: 375YLH58GP
- **Certificates**: Valid until August 2026

### Build Configuration:
- **EAS Project ID**: 0b1cab38-fdeb-4b64-a3bb-874e84c9d5c9
- **Current iOS Build**: #6 (needs rebuild)
- **Next Build Number**: Will be #7

### Services:
- **Firebase Project**: typeb-family-app
- **RevenueCat Products**: premium_monthly ($4.99), premium_annual ($39.99)
- **Sentry DSN**: Configured in .env.production

### Important Files:
- `CURRENT-STATUS-AND-NEXT-STEPS.md` - Detailed status
- `TESTFLIGHT-SUBMISSION-WALKTHROUGH.md` - Submission guide
- `FIX-XCODE-VERSION.md` - iOS SDK issue details
- `eas.json` - Build configuration (already updated)
- `.env.production` - All API keys configured

## Specific Questions/Issues:

1. Should I rebuild the iOS app now or wait?
2. How do I create an app-specific password for TestFlight submission?
3. What's the best strategy for beta testing?
4. Should I start the Android build while iOS is processing?
5. How do I monitor the app post-launch?

## Expected Outcomes:

Please help me:
1. Successfully rebuild the iOS app with iOS 18 SDK
2. Submit to TestFlight without errors
3. Start the Android build process
4. Create a launch checklist for the app stores
5. Set up monitoring and analytics dashboards

## Additional Context:

- This is my first app launch
- I have Apple Developer and Google Play accounts
- All premium features are working in development
- The app has been thoroughly tested
- I'm targeting families with children for task management

Please provide step-by-step guidance for completing the launch, starting with the iOS rebuild.

---

## INSTRUCTIONS FOR USING THIS PROMPT:

1. Copy everything between the "---" markers
2. Paste into a new Claude 4.1 Opus chat
3. Claude will have all the context needed to help you complete the launch
4. Start with the iOS rebuild command first
5. Follow the steps sequentially

## KEY COMMANDS TO HAVE READY:

```bash
# iOS Rebuild
cd /Users/jared.wolf/Projects/personal/tybeb_b/typeb-family-app
eas build --platform ios --profile production --clear-cache

# Submit to TestFlight
eas submit --platform ios --latest

# Android Build
eas build --platform android --profile production

# Check build status
eas build:list --platform all
```

Good luck with your launch! 🚀