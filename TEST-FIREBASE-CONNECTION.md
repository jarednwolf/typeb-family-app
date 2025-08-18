# 🧪 Test Your Firebase Connection

## After updating your .env files, test everything works:

### 1. Quick Firebase Connection Test

```bash
# Test the mobile app with staging
cd typeb-family-app

# Use staging environment
EXPO_PUBLIC_ENVIRONMENT=staging npm start

# Press 'i' for iOS simulator
# You should see the app load without Firebase errors
```

### 2. Check Firebase Auth is Working

Look for these in the console:
- ✅ No "Firebase App not initialized" errors
- ✅ No "Invalid API key" errors  
- ✅ App loads to login screen

### 3. Test Web App

```bash
# In a new terminal
cd apps/web

# Copy the staging env for web
cp ../.env.staging .env.local

# Start the web app
npm run dev

# Open http://localhost:3000
# Should load without errors
```

### 4. Verify in Firebase Console

Go to: https://console.firebase.google.com/u/0/project/tybeb-staging/authentication/users

- You should see the Authentication page
- Try the app's signup flow
- Check if new users appear here

## Common Issues & Fixes

### "Invalid API Key" Error
- You copied the wrong API key
- Check: https://console.firebase.google.com/u/0/project/tybeb-staging/settings/general

### "Firebase App not initialized"
- Environment variables not loading
- Check: `grep FIREBASE_API_KEY .env.staging` has actual value, not placeholder

### "Permission Denied" Errors
- Firebase security rules need deployment
- Run: `firebase deploy --only firestore:rules --project tybeb-staging`

## ✅ Success Indicators

You know it's working when:
1. App loads without red error screens
2. Login/Signup screens appear
3. No Firebase errors from in console
4. Can create a test account

## Next Steps

Once Firebase is connected:
1. ✅ Mark INF-002 complete in tracker
2. 🚀 Start COPPA implementation (SEC-001)
3. 📝 Update privacy policy (SEC-002)

---

**Still having issues?** 
- Double-check your API key starts with `AIzaSy`
- Make sure you're using `tybeb-staging` project
- Verify you selected the Web app (</>) not iOS/Android
