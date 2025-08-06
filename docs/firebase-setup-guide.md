# Firebase Setup Guide for TypeB Family App

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Project name: `typeb-family-app` (or your preferred name)
4. Accept the terms and click Continue
5. **Disable Google Analytics** for now (can enable later)
6. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. In "Sign-in method" tab, click "Email/Password"
4. Enable "Email/Password" (first toggle)
5. Enable "Email link (passwordless sign-in)" (optional, for future)
6. Click "Save"

## Step 3: Create Firestore Database

1. Click "Firestore Database" in left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development
   - Note: We'll add security rules before production
4. Select location closest to you (e.g., "us-central1")
5. Click "Enable"

## Step 4: Enable Storage

1. Click "Storage" in left sidebar
2. Click "Get started"
3. Start in test mode (for development)
4. Choose same location as Firestore
5. Click "Done"

## Step 5: Get Configuration

### For Web/Expo:
1. In Project Overview, click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps"
3. Click "</>" (Web app) icon
4. App nickname: `typeb-web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the configuration object

### For iOS (Later):
1. Click "Add app" → iOS
2. iOS bundle ID: `com.typeb.family` (or your preference)
3. Download `GoogleService-Info.plist`
4. Save for later iOS configuration

## Step 6: Enable Required APIs

In Firebase Console:
1. Click gear ⚙️ → "Project settings"
2. Click "Service accounts" tab
3. Click "Manage service account permissions"
4. In Google Cloud Console, ensure these APIs are enabled:
   - Firebase Authentication API
   - Cloud Firestore API
   - Cloud Storage API
   - Firebase Cloud Messaging API (for push notifications)

## Step 7: Set Up Security Rules (Development)

### Firestore Rules (Development Only):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary development rules - REPLACE BEFORE PRODUCTION
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules (Development Only):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Temporary development rules - REPLACE BEFORE PRODUCTION
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 8: Your Firebase Configuration

After completing the above steps, your Firebase config will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "typeb-family-app.firebaseapp.com",
  projectId: "typeb-family-app",
  storageBucket: "typeb-family-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
  measurementId: "G-XXXXXXXXXX" // Optional
};
```

## Step 9: Create .env File

Copy your configuration values to the `.env` file:

```bash
cd typeb-family-app
cp .env.example .env
```

Then edit `.env` with your actual values:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 10: Test Your Setup

```bash
cd typeb-family-app
npm start
```

Try to:
1. Create a new account
2. Sign in
3. Sign out
4. Reset password

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check that all environment variables are set correctly
   - Restart Expo after changing .env file

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add localhost to authorized domains in Firebase Console
   - Authentication → Settings → Authorized domains

3. **"Permission denied" errors**
   - Check Firestore/Storage security rules
   - Ensure user is authenticated

## Security Checklist (Before Production)

- [ ] Update Firestore security rules
- [ ] Update Storage security rules
- [ ] Enable App Check
- [ ] Set up proper backup strategy
- [ ] Configure rate limiting
- [ ] Review API key restrictions
- [ ] Enable audit logging

## Next Steps

Once Firebase is configured and tested:
1. Commit your .env file changes (but never commit actual .env to Git!)
2. Test all authentication flows
3. Ready for Phase 2: Task Management

---

**Important**: Never commit your actual `.env` file to Git. Only commit `.env.example` with placeholder values.