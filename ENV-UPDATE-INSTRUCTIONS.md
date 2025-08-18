# 🔥 Firebase Environment Configuration Instructions

## Your Current Status
✅ `.env.local`, `.env.staging`, `.env.production` files exist  
❌ But they still have placeholder values (`your-project-id`, etc.)  
✅ Firebase staging project exists: `tybeb-staging`  

## Step 1: Get Your Firebase Config Values

### For STAGING Environment:

1. **Open Firebase Console**: 
   https://console.firebase.google.com/u/0/project/tybeb-staging/settings/general

2. **Find or Create a Web App**:
   - Scroll to "Your apps" section
   - If no web app exists, click "Add app" → Choose Web (</>) → Name it "TypeB Web Staging"
   - If web app exists, click on it

3. **Copy the Configuration**:
   You'll see something like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD...",              // Copy this
     authDomain: "tybeb-staging.firebaseapp.com",
     projectId: "tybeb-staging",
     storageBucket: "tybeb-staging.appspot.com",
     messagingSenderId: "123456789",    // Copy this
     appId: "1:123456789:web:abc..."    // Copy this
   };
   ```

## Step 2: Update Your Environment Files

### Quick Update Script:
```bash
# For staging
cat > .env.staging << EOF
# TypeB Staging Environment
EXPO_PUBLIC_ENVIRONMENT=staging

# Firebase Configuration - From your Firebase Console
FIREBASE_PROJECT_ID=tybeb-staging
FIREBASE_API_KEY=AIzaSy... # YOUR ACTUAL API KEY
FIREBASE_AUTH_DOMAIN=tybeb-staging.firebaseapp.com
FIREBASE_STORAGE_BUCKET=tybeb-staging.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789 # YOUR ACTUAL SENDER ID
FIREBASE_APP_ID=1:123456789:web:... # YOUR ACTUAL APP ID

# Copy the rest from template
$(tail -n +20 env.example)
EOF
```

### For Local Development:
```bash
# Copy staging to local for now
cp .env.staging .env.local
sed -i '' 's/staging/development/g' .env.local
```

## Step 3: Add RevenueCat Keys (if you have them)

Edit the files and add:
```bash
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_[your-key]
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_[your-key]
```

## Step 4: Test the Connection

```bash
# Test with staging Firebase
cd typeb-family-app
EXPO_PUBLIC_ENVIRONMENT=staging npm start

# In another terminal
cd apps/web
npm run dev
```

## Step 5: Never Commit Real Keys!

```bash
# Verify .env files are gitignored
git status # Should NOT show .env.local, .env.staging, .env.production

# If they show up, add to .gitignore:
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
echo "!env.example" >> .gitignore
```

## 🚨 Production Environment

For `.env.production`, you'll need:
1. Create a separate Firebase project for production (if not done)
2. Use production RevenueCat keys
3. Use production Sentry DSN
4. Set `EXPO_PUBLIC_ENVIRONMENT=production`

## Quick Check

Run this to verify your setup:
```bash
# Check if Firebase project ID is set correctly
grep "FIREBASE_PROJECT_ID" .env.staging

# Should show:
# FIREBASE_PROJECT_ID=tybeb-staging

# Not:
# FIREBASE_PROJECT_ID=your-project-id
```

---

**Need the values RIGHT NOW?**

Since you have access to the Firebase Console for `tybeb-staging`, you can get all the values there. The most important ones are:
- API Key (required)
- Messaging Sender ID (for push notifications)
- App ID (for analytics)

The others are predictable:
- Auth Domain: `tybeb-staging.firebaseapp.com`
- Storage Bucket: `tybeb-staging.appspot.com`
- Project ID: `tybeb-staging`
