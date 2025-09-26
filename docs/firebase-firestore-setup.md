# Firebase Firestore Setup Guide

## Problem Diagnosis
The "Missing or insufficient permissions" error occurs because Firestore's default security rules block all read/write access. We need to update these rules to allow authenticated users to access their data.

## Steps to Fix Firestore Permissions

### 1. Access Firestore in Firebase Console
1. Go to: https://console.firebase.google.com/u/1/project/typeb-family-app/firestore
2. If Firestore is not yet created, click "Create database"
   - Choose "Start in production mode" 
   - Select your preferred location (us-central is fine)

### 2. Update Security Rules
1. Click on the "Rules" tab in Firestore
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all users (for family member listing)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Tasks collection rules (for Phase 2)
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    
    // Families collection rules (for Phase 3)
    match /families/{familyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish" to save the rules

### 3. Enable Authentication Provider
1. Go to: https://console.firebase.google.com/u/1/project/typeb-family-app/authentication/providers
2. Click on "Email/Password" provider
3. Enable "Email/Password" (first toggle)
4. Leave "Email link (passwordless sign-in)" disabled
5. Click "Save"

### 4. Test the Fix
After updating the rules:
1. Reload the app in the iOS Simulator (shake device or Cmd+R)
2. Try creating a new account
3. The account should be created successfully without permission errors
4. Check Firebase Console > Authentication > Users to see the new user
5. Check Firebase Console > Firestore > Data to see the user document

## Understanding the Rules

- **Line 5-8**: Users can only read/write their own user document
- **Line 11-13**: All authenticated users can read any user document (needed for family features)
- **Line 16-18**: Placeholder for tasks (Phase 2)
- **Line 21-24**: Placeholder for families (Phase 3)
- **Line 27-29**: Deny all other access by default (security best practice)

## Troubleshooting

If you still see permission errors:
1. Make sure you clicked "Publish" after updating the rules
2. Wait 1-2 minutes for rules to propagate
3. Check that Authentication is enabled for Email/Password
4. Verify the app is using the correct Firebase project

## Security Notes
These rules are appropriate for development. Before production:
- Review and tighten security rules
- Add validation rules for data structure
- Implement proper role-based access control
- Add rate limiting and abuse prevention