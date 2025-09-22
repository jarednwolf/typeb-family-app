# Day 2 Production Sprint - Comprehensive Cursor Prompt

Copy and paste this entire prompt into a new Cursor chat with ChatGPT-4 or Claude:

---

## CONTEXT

I'm on Day 2 of a 7-day production sprint for TypeB Family App - a React Native task management app with photo validation for families. Yesterday (Day 1) I completed infrastructure setup, Firebase configuration, CI/CD pipeline, and COPPA compliance.

### Current State
- **Repository**: https://github.com/jarednwolf/typeb-family-app (monorepo structure)
- **Firebase Project**: `tybeb-staging` (configured and connected)
- **Web App**: Live at https://typebapp.com (Next.js on Vercel)
- **Mobile App**: React Native with Expo SDK 50 (in TestFlight beta)
- **Environment Files**: `.env.local`, `.env.staging`, `.env.production` configured
- **CI/CD**: GitHub Actions pipeline active
- **Documentation**: Consolidated in `/docs` folder

### Tech Stack
- **Frontend**: React Native (Expo), Next.js 15.4
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **State**: Redux Toolkit
- **Payments**: RevenueCat (ready to configure)
- **Build**: EAS Build (mobile), Vercel (web)

### Firebase Configuration (Already Set)
```javascript
const firebaseConfig = {
  apiKey: "<your-api-key>",
  authDomain: "<your-project>.firebaseapp.com",
  projectId: "tybeb-staging",
  storageBucket: "tybeb-staging.firebasestorage.app",
  messagingSenderId: "388132461668",
  appId: "1:388132461668:web:28a15aca13c36aaa475371"
};
```

## DAY 2 OBJECTIVES

Complete these tasks in order of priority:

### 1. Google SSO Integration (2 hours)
- [ ] Enable Google Sign-In in Firebase Console
- [ ] Install and configure @react-native-google-signin/google-signin
- [ ] Add Google Sign-In button to login/signup screens
- [ ] Update Firebase Auth service to handle Google auth
- [ ] Test on both web and mobile platforms
- [ ] Update user profile creation for Google users

### 2. RevenueCat Configuration (1 hour)
- [ ] Set up products in RevenueCat dashboard ($4.99/mo, $39.99/yr)
- [ ] Add RevenueCat API keys to environment files
- [ ] Configure webhook endpoint in Firebase Functions
- [ ] Implement subscription check in app
- [ ] Add paywall component for premium features
- [ ] Test subscription flow in sandbox mode

### 3. Security Hardening (2 hours)
- [ ] Review and update Firebase Security Rules
- [ ] Add rate limiting to Firestore rules
- [ ] Implement proper error boundaries in React Native
- [ ] Add input sanitization for all user inputs
- [ ] Configure App Check for additional security
- [ ] Add domain restrictions to Firebase API key

### 4. Error Handling & Monitoring (1 hour)
- [ ] Configure Sentry properly with environment variables
- [ ] Add error boundaries to all screens
- [ ] Implement proper error messages for users
- [ ] Add network error handling
- [ ] Set up performance monitoring

## SPECIFIC IMPLEMENTATION REQUIREMENTS

### Google SSO Implementation

#### For React Native (typeb-family-app/):
```typescript
// Install dependencies
npm install @react-native-google-signin/google-signin

// In src/services/auth.ts, add:
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // From Firebase Console
  offlineAccess: true,
});

// Sign-in function
const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
    return await signInWithCredential(auth, googleCredential);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
  }
};
```

#### For Next.js Web (apps/web/):
```typescript
// Use Firebase JavaScript SDK
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const signInWithGoogle = () => signInWithPopup(auth, provider);
```

### RevenueCat Setup

1. Create these products in RevenueCat:
   - Product ID: `typeb_premium_monthly` - $4.99/month
   - Product ID: `typeb_premium_annual` - $39.99/year (save $10)

2. Add to environment files:
```bash
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_[your_key]
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_[your_key]
REVENUECAT_WEBHOOK_SECRET=[your_secret]
```

3. Implement in app:
```typescript
// src/services/revenueCat.ts
import Purchases from 'react-native-purchases';

export const initializeRevenueCat = async () => {
  Purchases.setDebugLogsEnabled(__DEV__);
  
  if (Platform.OS === 'ios') {
    await Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
  } else {
    await Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });
  }
};
```

### Security Rules Update

Update `firestore.rules` with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rate limiting function
    function rateLimit(requests) {
      return request.time > resource.data.lastWrite + duration(1s);
    }
    
    // Users collection with rate limiting
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                      request.auth.uid == userId && 
                      rateLimit(1);
    }
    
    // Tasks with family isolation
    match /tasks/{taskId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.familyMemberIds;
      allow write: if request.auth != null && 
                      request.auth.uid in resource.data.familyMemberIds &&
                      rateLimit(5);
    }
  }
}
```

## FILE STRUCTURE TO WORK WITH

```
/typeb-family-app/
  /src/
    /screens/
      /auth/
        - LoginScreen.tsx (add Google button here)
        - SignUpScreen.tsx (add Google button here)
    /services/
        - auth.ts (add Google auth methods)
        - revenueCat.ts (create this)
        - errorMonitoring.ts (configure Sentry)
    /components/
        - GoogleSignInButton.tsx (create this)
        - Paywall.tsx (create this)
        - ErrorBoundary.tsx (create this)

/apps/web/
  /src/
    /app/
      /login/
        - page.tsx (add Google sign-in)
    /lib/
        - firebase.ts (add Google auth)
```

## TESTING REQUIREMENTS

### Google SSO Testing
1. Test login with new Google account
2. Test login with existing email (should merge accounts)
3. Verify user profile creation in Firestore
4. Test logout functionality
5. Test on both iOS simulator and web

### RevenueCat Testing
1. Test viewing products
2. Test purchase flow (use sandbox)
3. Test restoration of purchases
4. Verify webhook receives events
5. Test premium feature gating

### Security Testing
1. Try to access other users' data (should fail)
2. Test rate limiting (rapid requests should be blocked)
3. Test invalid inputs (should be sanitized)
4. Check error messages don't leak sensitive info

## DEPLOYMENT CHECKLIST

After implementing each feature:

```bash
# Test locally
cd typeb-family-app
npm test

# Commit with conventional commits
git add -A
git commit -m "feat: add Google SSO authentication"
git commit -m "feat: integrate RevenueCat for subscriptions"
git commit -m "security: harden Firebase rules with rate limiting"

# Push to trigger CI/CD
git push origin main

# Deploy Firebase rules
firebase deploy --only firestore:rules --project tybeb-staging

# Check CI/CD pipeline
gh run list --limit 5
```

## KNOWN ISSUES TO AVOID

1. **Expo Simulator Issue**: iOS simulator has AppEntry module errors. Use web browser (press 'w' in Expo) or physical device for testing.

2. **Firebase API Key Warning**: Google sends automated warnings about public API keys. This is normal - Firebase web API keys are meant to be public.

3. **Version Compatibility**: Ensure @react-native-google-signin version is compatible with Expo SDK 50.

## SUCCESS METRICS

By end of Day 2, you should have:
- [ ] Users can sign in with Google on both platforms
- [ ] RevenueCat products visible and purchasable
- [ ] Security rules preventing unauthorized access
- [ ] Error tracking active in Sentry
- [ ] All changes committed and pushed
- [ ] CI/CD pipeline passing

## HELPFUL COMMANDS

```bash
# Start development
cd typeb-family-app
npx expo start -c
# Press 'w' for web if simulator has issues

# View logs
firebase functions:log --project tybeb-staging

# Test Firebase connection
curl https://tybeb-staging.firebaseapp.com

# Check GitHub Actions
gh run view

# Deploy to staging
firebase deploy --project tybeb-staging
```

## RESOURCES

- Firebase Console: https://console.firebase.google.com/project/tybeb-staging
- RevenueCat Dashboard: https://app.revenuecat.com
- GitHub Repo: https://github.com/jarednwolf/typeb-family-app
- Google Sign-In Docs: https://github.com/react-native-google-signin/google-signin
- RevenueCat React Native: https://docs.revenuecat.com/docs/reactnative

## QUESTIONS TO ASK IF STUCK

1. "How do I get the Google Web Client ID from Firebase Console?"
2. "What's the correct way to handle Google sign-in errors in React Native?"
3. "How do I test RevenueCat purchases without real money?"
4. "What Firebase Security Rules are best for rate limiting?"
5. "How do I properly configure Sentry for both web and mobile?"

---

**IMPORTANT**: Focus on getting each feature working at a basic level first, then enhance. The goal is to have all three main features (Google SSO, RevenueCat, Security) functional by end of day, not perfect.

**Time Budget**: 
- Morning (2 hrs): Google SSO
- Midday (1 hr): RevenueCat
- Afternoon (2 hrs): Security & Error Handling
- Evening (1 hr): Testing & Deployment

Start with Google SSO as it's the most complex. Good luck with Day 2!
