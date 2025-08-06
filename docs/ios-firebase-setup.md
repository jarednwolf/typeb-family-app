# iOS Firebase Configuration for TypeB

## Step 1: Add iOS App to Firebase

1. In Firebase Console (https://console.firebase.google.com/u/1/project/typeb-family-app/overview)
2. Click "Add app" button
3. Select iOS platform (Apple icon)
4. **iOS Bundle ID**: `com.typeb.familyapp` (or your preference)
   - This MUST match what we'll set in app.json
5. **App nickname**: TypeB iOS (optional)
6. **App Store ID**: Leave blank for now
7. Click "Register app"

## Step 2: Download Configuration File

1. Download `GoogleService-Info.plist`
2. Save it to: `typeb-family-app/ios/GoogleService-Info.plist`
   - We'll create this directory structure when needed

## Step 3: Update app.json for iOS

Update `typeb-family-app/app.json`:

```json
{
  "expo": {
    "name": "TypeB Family",
    "slug": "typeb-family-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.typeb.familyapp",
      "googleServicesFile": "./ios/GoogleService-Info.plist",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to take photos for task validation.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photo library to upload images for task validation."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.typeb.familyapp",
      "googleServicesFile": "./android/google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/firestore"
    ]
  }
}
```

## Step 4: Install iOS-specific Firebase Dependencies

For Expo managed workflow, Firebase works through the JavaScript SDK, but for future native features:

```bash
npx expo install expo-dev-client
```

## Step 5: Configure for Development

For Expo Go (development):
- Firebase will work through the web SDK
- No additional iOS configuration needed

For standalone app (production):
```bash
# When ready to build for App Store
eas build --platform ios
```

## Step 6: Web Configuration (What We Need Now)

Since we're using Expo with Firebase JS SDK, we need the web configuration from Firebase:

1. Go to Project Settings in Firebase Console
2. Scroll to "Your apps"
3. Find the Web app (or create one if not exists)
4. Copy the configuration object

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "typeb-family-app.firebaseapp.com",
  projectId: "typeb-family-app",
  storageBucket: "typeb-family-app.appspot.com",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..." // optional
};
```

## Step 7: Testing on iOS

### Using Expo Go (Recommended for Development):
```bash
npm start
# Scan QR code with Expo Go app on iPhone
```

### Using iOS Simulator:
```bash
npm run ios
# Requires Xcode installed
```

## Important Notes

1. **Bundle Identifier**: Must be unique and match Firebase
2. **Development vs Production**: 
   - Development: Uses Expo Go, web SDK
   - Production: Uses native SDK, requires EAS Build
3. **Push Notifications**: Require additional setup with APNs

## Troubleshooting

### "No bundle URL present"
- Restart Metro bundler
- Clear cache: `expo start -c`

### Firebase not connecting
- Check bundle identifier matches
- Verify GoogleService-Info.plist is in correct location
- Ensure Firebase project has iOS app registered

### Authentication errors
- Add `localhost` to authorized domains in Firebase Console
- Check that Email/Password auth is enabled

## Next Steps

1. Add your Firebase web configuration to .env
2. Test authentication on iOS device/simulator
3. Verify all features work correctly