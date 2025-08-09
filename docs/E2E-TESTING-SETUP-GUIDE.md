# E2E Testing Setup Guide - TypeB Family App

## Current Status (December 9, 2024)

### 🎉 Major Achievement: Firebase Emulator Integration Working!
The app now successfully connects to Firebase emulators in development mode, and manual testing is fully functional.

### ✅ Completed Setup
1. **iOS Simulator**: iPhone 15 simulator is available and configured
2. **Detox Configuration**: `.detoxrc.js` properly configured for iOS and Android
3. **Build Process**: iOS build succeeds with Detox
4. **applesimutils**: Successfully installed via Homebrew
5. **Test IDs Added**: All screens now have test IDs
6. **Keyboard Crash Fix**: All `typeText` replaced with `replaceText`
7. **Navigation Tab IDs**: All tabs now have test IDs
8. **Validation Messages**: Test expectations updated to match actual app messages
9. **Firebase Emulator Integration**: ✅ App connects to local emulators in dev mode
10. **Rate Limiting Fix**: ✅ Disabled in development to prevent Firestore permission errors
11. **Manual Testing**: ✅ Fully functional with emulator setup

### 🎯 Test Results Summary

| Test Suite | Total | Passing | Failing | Skipped | Status |
|------------|-------|---------|---------|---------|--------|
| auth.test.js | 15 | 4 ✅ | 11 ❌ | 0 | Partial |
| family.test.js | 10 | 0 | 10 ❌ | 0 | Failed |
| tasks.test.js | 25 | 0 | 25 ❌ | 0 | Failed |
| **Total** | **50** | **4** | **46** | **0** | **8% Pass Rate** |

**Note**: E2E test automation development is paused to prioritize premium feature launch. Manual testing is working perfectly.

### ✅ Key Fixes Implemented

#### Firebase Emulator Connection
- **File**: `src/services/firebase.ts`
- **Solution**: App automatically uses emulators when `__DEV__` is true
- **Emulator Ports**: Auth (9099), Firestore (8080), Storage (9199)

#### Rate Limiting Disabled in Development
- **File**: `src/services/auth.ts`
- **Solution**: Added `__DEV__` check to skip rate limiting in development mode
- **Result**: No more "false for 'get' @ L9" Firestore permission errors

#### Firestore Rules Updated
- **File**: `firestore.rules`
- **Solution**: Updated rateLimit collection rules to allow access

### ❌ Remaining Issues (Deferred)

#### 1. UI Visibility Problems in Automated Tests
- **Problem**: Some form elements are clipped or not fully visible during E2E tests
- **Affected**: confirm-password-input, create-account-button
- **Note**: Manual testing works fine; issue only affects automated tests

#### 2. Navigation Tab Discovery
- **Problem**: Navigation tabs not found after sign-up in automated tests
- **Note**: Manual testing shows tabs work correctly

## Setup Instructions

### Running the App with Firebase Emulators

```bash
# Terminal 1: Start Firebase emulators
cd typeb-family-app
firebase emulators:start --only auth,firestore,storage --project typeb-family-app

# Terminal 2: Seed test data
cd typeb-family-app
node scripts/seed-emulator.js

# Terminal 3: Start the app
npm start
# Then press 'i' for iOS or 'a' for Android
```

### Test Credentials (Seeded in Emulator)
- Parent: `test.parent@example.com` / `TestParent123!`
- Child: `test.child@example.com` / `TestChild123!`
- Existing User: `existing@example.com` / `Existing123!`
- Family Invite Code: `TEST01`

### iOS E2E Testing (Partially Working)

```bash
# Install required tools
brew tap wix/brew
brew install applesimutils

# Build iOS app for testing
npm run e2e:build:ios

# Run iOS E2E tests
npm run e2e:test:ios

# Run specific test suite
npm run e2e:test:ios -- --testNamePattern="Authentication Flow"

# Run with screenshots on failure
npm run e2e:test:ios -- --take-screenshots failing
```

### Android E2E Testing (Not Yet Configured)

```bash
# Install Android Studio from https://developer.android.com/studio

# Set up environment variables in ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Create Android emulator
avdmanager create avd -n Pixel_7_API_33 -k "system-images;android-33;google_apis;arm64-v8a" -d pixel_7

# Build Android app for testing
npm run e2e:build:android

# Run Android E2E tests
npm run e2e:test:android
```

## Test Files Structure

```
e2e/
├── jest.config.js          # Jest configuration for E2E tests
├── helpers/
│   └── testHelpers.js      # Helper functions with scroll support
├── tests/
│   ├── auth.test.js        # Authentication flow tests (15 tests, 4 passing)
│   ├── family.test.js      # Family management tests (10 tests, 0 passing)
│   └── tasks.test.js       # Task management tests (25 tests, 0 passing)
├── fixtures/
│   └── testData.js         # Test data for emulator seeding
└── scripts/
    └── seed-emulator.js    # Script to populate emulator with test data
```

## Development Mode Features

When running in development (`__DEV__` = true):
- ✅ Firebase automatically connects to local emulators
- ✅ Rate limiting is disabled to prevent authentication issues
- ✅ Console logs show "🔧 Connected to Firebase emulators"
- ✅ Console logs show "[AUTH] Skipping rate limit check in development mode"
- ✅ Test data can be seeded using `node scripts/seed-emulator.js`

## Recent Fixes Applied

### 1. Firebase Emulator Connection
```javascript
// src/services/firebase.ts
const firebaseConfig = __DEV__ 
  ? {
      // Emulator configuration
      apiKey: "fake-api-key",
      authDomain: "127.0.0.1",
      projectId: "typeb-family-app",
      // ...
    }
  : {
      // Production configuration
      // ...
    };
```

### 2. Rate Limiting Disabled in Dev
```javascript
// src/services/auth.ts
const checkRateLimit = async (identifier: string, action: string): Promise<void> => {
  // Skip rate limiting in development/emulator mode
  if (__DEV__) {
    console.log('[AUTH] Skipping rate limit check in development mode');
    return;
  }
  // ... rate limiting logic
};
```

### 3. Keyboard Crash Fix
```javascript
// Before (crashes on iOS 17+)
await element(by.id('email-input')).typeText('test@example.com');

// After (works correctly)
await element(by.id('email-input')).replaceText('test@example.com');
```

### 4. Test Helper Updates with Scroll Support
```javascript
// e2e/helpers/testHelpers.js
async safeReplaceText(testID, text, scrollViewID = 'signup-screen') {
  await this.ensureElementVisible(testID, scrollViewID);
  await element(by.id(testID)).replaceText(text);
}
```

## Next Steps

### Immediate (Completed ✅)
- [x] Install applesimutils for iOS E2E testing
- [x] Add test IDs to all screens
- [x] Fix keyboard crash by using replaceText
- [x] Add test IDs to navigation tabs
- [x] Fix validation message mismatches
- [x] Configure Firebase emulator with test data seeding
- [x] Fix Firestore permission errors
- [x] Enable manual testing with emulators

### Deferred (After Premium Features Launch)
- [ ] Fix UI visibility issues in automated tests
- [ ] Get all auth tests passing (currently 4/15)
- [ ] Enable and fix family management tests
- [ ] Enable and fix task management tests
- [ ] Add retry logic for flaky tests
- [ ] Performance test with 100+ tasks
- [ ] Add E2E tests to CI/CD pipeline
- [ ] Achieve >80% pass rate for production readiness

## Troubleshooting

### "false for 'get' @ L9" Error ✅ RESOLVED
**Solution**: Rate limiting is now disabled in development mode. The app skips rate limit checks when `__DEV__` is true.

### iOS Keyboard Crash ✅ RESOLVED
**Solution**: All `typeText` calls replaced with `replaceText`

### View Not Visible Errors (Automated Tests Only)
- Elements may be clipped by keyboard
- Try dismissing keyboard before interactions
- May need to scroll to element first
- Note: Manual testing works fine

### Authentication Failures
- Use Firebase emulator with seeded data
- Run `node scripts/seed-emulator.js` to populate test users
- Check console for "[AUTH] Skipping rate limit check" confirmation

## Test ID Checklist

### ✅ Completed
- SignInScreen (all IDs added)
- SignUpScreen (all IDs added)
- ForgotPasswordScreen (all IDs added)
- FamilySetupScreen (all IDs added)
- Navigation tabs (all tabs have IDs)
- DashboardScreen (all IDs added)
- SettingsScreen (all IDs added)
- CreateFamilyScreen (all IDs added)
- JoinFamilyScreen (all IDs added)
- FamilyScreen (all IDs added)
- CreateTaskModal (all IDs added)
- TaskDetailModal (all IDs added)

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [iOS Simulator Keyboard Issues](https://github.com/wix/Detox/issues/4230)