# Firestore Security Rules Deployment Guide

## Current Issue
You're experiencing "Missing or insufficient permissions" errors because the strict production security rules require user documents to exist before allowing any operations, but the user document can't be created during sign-in.

## Quick Fix for Development

Deploy the development-friendly rules:

```bash
# Deploy development rules
firebase deploy --only firestore:rules --project your-project-id
```

But first, copy the dev rules to the main rules file:

```bash
cp firestore.rules.dev firestore.rules
```

## Key Differences

### Production Rules (`firestore.rules`)
- Very strict security
- Requires user document to exist for most operations
- Causes chicken-and-egg problem during sign-up/sign-in

### Development Rules (`firestore.rules.dev`)
- More permissive for initial setup
- Allows user document creation during authentication
- Uses `userExists()` checks to handle missing documents gracefully
- Still maintains security for established users

## Deployment Steps

### For Local Development:
1. Use the Firebase emulator with dev rules:
   ```bash
   firebase emulators:start --only firestore
   ```

2. Or deploy dev rules to your development project:
   ```bash
   cp firestore.rules.dev firestore.rules
   firebase deploy --only firestore:rules --project dev-project
   ```

### For Production:
1. First deploy dev rules to allow initial users:
   ```bash
   cp firestore.rules.dev firestore.rules
   firebase deploy --only firestore:rules --project production
   ```

2. After users are created, switch to strict rules:
   ```bash
   git checkout firestore.rules  # Restore production rules
   firebase deploy --only firestore:rules --project production
   ```

## Testing the Fix

1. Deploy the dev rules
2. Try signing up a new user
3. Verify the user document is created in Firestore
4. Test signing in with the created user

## Security Considerations

The development rules still maintain security by:
- Requiring authentication for all operations
- Validating data formats and required fields
- Enforcing role-based access control
- Preventing unauthorized cross-user access

The main difference is they handle the case where a user document doesn't exist yet, which is necessary during the sign-up flow.

## Long-term Solution

Consider implementing Cloud Functions to handle user creation atomically:
- Create a Cloud Function triggered on user creation
- Have it create the initial user document with proper permissions
- This removes the chicken-and-egg problem entirely

## Emergency Rollback

If you need to quickly allow access:

```bash
# Super permissive rules (DEVELOPMENT ONLY!)
echo 'rules_version = "2";
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}' > firestore.rules.emergency

firebase deploy --only firestore:rules --project your-project
```

**WARNING**: Never use emergency rules in production!