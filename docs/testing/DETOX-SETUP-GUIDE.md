# Detox E2E Testing Setup Guide
**For TypeB Family App - React Native with Expo**
**Date**: January 9, 2025

## Overview

Detox is a gray-box end-to-end testing framework for React Native apps. This guide covers setting up Detox for the TypeB Family App using Expo's development builds.

## Prerequisites

### System Requirements
- **macOS**: Required for iOS testing
- **Node.js**: v18 or higher
- **Xcode**: Latest version (for iOS)
- **Android Studio**: Latest version (for Android)
- **Java**: JDK 11 or higher (already installed for Firebase emulators)

### Expo Requirements
- **Expo SDK**: 50 or higher (we have SDK 50)
- **Development Build**: Required (not Expo Go)
- **EAS CLI**: For building development clients

## Installation Steps

### Step 1: Install Detox CLI
```bash
# Install Detox CLI globally
npm install -g detox-cli

# Verify installation
detox --version
```

### Step 2: Install Detox Dependencies
```bash
cd typeb-family-app

# Install Detox and related packages
npm install --save-dev detox
npm install --save-dev @config-plugins/detox
npm install --save-dev jest-circus
```

### Step 3: Configure Expo Plugin
Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "@config-plugins/detox",
        {
          "skipProguard": false,
          "subdomains": "*"
        }
      ]
    ]
  }
}
```

### Step 4: Create Detox Configuration
Create `.detoxrc.js`:
```javascript
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TypeBFamilyApp.app',
      build: 'xcodebuild -workspace ios/TypeBFamilyApp.xcworkspace -scheme TypeBFamilyApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TypeBFamilyApp.app',
      build: 'xcodebuild -workspace ios/TypeBFamilyApp.xcworkspace -scheme TypeBFamilyApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    }
  }
};
```

### Step 5: Create E2E Test Structure
```bash
# Create e2e directory structure
mkdir -p e2e/tests
mkdir -p e2e/helpers
mkdir -p e2e/fixtures
```

Create `e2e/jest.config.js`:
```javascript
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true
};
```

### Step 6: Create Test Helpers
Create `e2e/helpers/testHelpers.js`:
```javascript
const { device, element, by, expect } = require('detox');

const testHelpers = {
  async login(email, password) {
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('login-button')).tap();
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  },

  async logout() {
    await element(by.id('settings-tab')).tap();
    await element(by.id('logout-button')).tap();
    await expect(element(by.id('signin-screen'))).toBeVisible();
  },

  async createTask(title, description) {
    await element(by.id('create-task-button')).tap();
    await element(by.id('task-title-input')).typeText(title);
    await element(by.id('task-description-input')).typeText(description);
    await element(by.id('save-task-button')).tap();
  },

  async waitForElement(testID, timeout = 5000) {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  generateTestEmail() {
    return `test-${Date.now()}@example.com`;
  },

  generateFamilyName() {
    return `Test Family ${Date.now()}`;
  }
};

module.exports = testHelpers;
```

### Step 7: Add Package.json Scripts
```json
{
  "scripts": {
    "e2e:build:ios": "detox build --configuration ios.sim.debug",
    "e2e:build:android": "detox build --configuration android.emu.debug",
    "e2e:test:ios": "detox test --configuration ios.sim.debug",
    "e2e:test:android": "detox test --configuration android.emu.debug",
    "e2e:ios": "npm run e2e:build:ios && npm run e2e:test:ios",
    "e2e:android": "npm run e2e:build:android && npm run e2e:test:android"
  }
}
```

## Building Development Clients

### For iOS (macOS only)
```bash
# Install pods
cd ios && pod install && cd ..

# Build development client
eas build --platform ios --profile development --local

# Or use Xcode
open ios/TypeBFamilyApp.xcworkspace
```

### For Android
```bash
# Build development client
eas build --platform android --profile development --local

# Or use gradle
cd android && ./gradlew assembleDebug
```

## Writing E2E Tests

### Test Structure
```javascript
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show sign in screen on app launch', async () => {
    await expect(element(by.id('signin-screen'))).toBeVisible();
    await expect(element(by.text('Welcome Back'))).toBeVisible();
  });

  it('should sign in with valid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Test123!');
    await element(by.id('signin-button')).tap();
    
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });
});
```

## Best Practices

### 1. Test IDs
Add testID props to all interactive elements:
```jsx
<TouchableOpacity testID="signin-button" onPress={handleSignIn}>
  <Text>Sign In</Text>
</TouchableOpacity>
```

### 2. Wait Strategies
Always wait for elements before interacting:
```javascript
await waitFor(element(by.id('loading-complete')))
  .toBeVisible()
  .withTimeout(10000);
```

### 3. Test Data Management
- Use unique test data for each test
- Clean up test data after tests
- Use Firebase emulators for backend

### 4. Synchronization
```javascript
// Wait for animations to complete
await device.disableSynchronization();
await element(by.id('animated-view')).tap();
await device.enableSynchronization();
```

## Common Issues & Solutions

### Issue 1: Build Failures
**Solution**: Ensure you have a development build, not Expo Go
```bash
npx expo prebuild
```

### Issue 2: Test Timeouts
**Solution**: Increase timeout in jest.config.js
```javascript
testTimeout: 240000 // 4 minutes
```

### Issue 3: Element Not Found
**Solution**: Add proper testIDs and wait for elements
```javascript
await waitFor(element(by.id('my-element')))
  .toExist()
  .withTimeout(10000);
```

### Issue 4: Keyboard Issues
**Solution**: Dismiss keyboard when needed
```javascript
await device.pressBack(); // Android
await element(by.id('scroll-view')).swipe('down'); // iOS
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Detox CLI
        run: npm install -g detox-cli
      
      - name: Build iOS app
        run: npm run e2e:build:ios
      
      - name: Run E2E tests
        run: npm run e2e:test:ios
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: detox-artifacts
          path: artifacts/
```

## Estimated Setup Time

- **Initial Setup**: 2-3 hours
- **First Test**: 1 hour
- **Full Test Suite**: 8-10 hours
- **CI Integration**: 2-3 hours

## Next Steps

1. Install Detox and dependencies
2. Create development builds
3. Add testIDs to components
4. Write critical path tests
5. Integrate with CI/CD

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Expo with Detox](https://docs.expo.dev/build/internal-distribution/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/)

---
*Last Updated: January 9, 2025*
*TypeB Development Team*