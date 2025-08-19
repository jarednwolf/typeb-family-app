# Vercel Environment Variables Setup

## Required Environment Variables

You need to add these environment variables in your Vercel project settings to fix the Firebase connection errors:

### 1. Go to Vercel Dashboard
1. Navigate to your project: https://vercel.com/dashboard
2. Click on your project (typeb-family-app or typebapp)
3. Go to "Settings" tab
4. Click on "Environment Variables" in the left sidebar

### 2. Add These Variables

Add each of these environment variables for **all environments** (Production, Preview, Development):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCOOvQfcyQ52eEPSC3esgl8bex0A9RUXu0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tybeb-staging.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tybeb-staging
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tybeb-staging.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=388132461668
NEXT_PUBLIC_FIREBASE_APP_ID=1:388132461668:web:28a15aca13c36aaa475371
```

### 3. Redeploy

After adding all environment variables:
1. Go to the "Deployments" tab
2. Find the latest deployment
3. Click the three dots menu
4. Select "Redeploy"
5. Confirm the redeployment

This will fix the Firebase connection errors you're seeing in the console.

## For Local Development

Create an `.env.local` file in the `apps/web` directory with the same variables:

```bash
# apps/web/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCOOvQfcyQ52eEPSC3esgl8bex0A9RUXu0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tybeb-staging.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tybeb-staging
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tybeb-staging.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=388132461668
NEXT_PUBLIC_FIREBASE_APP_ID=1:388132461668:web:28a15aca13c36aaa475371
```

## Troubleshooting

If you still see Firebase errors after setting these:
1. Clear your browser cache
2. Check that all variables start with `NEXT_PUBLIC_`
3. Ensure there are no trailing spaces in the values
4. Make sure to redeploy after adding the variables
