#!/bin/bash

# Update .env.staging with Firebase staging values
# Since tybeb-staging is already set up, we can use these values

echo "📝 Updating .env.staging with Firebase staging project values..."

# Create a temporary file with the updates
cat > .env.staging.tmp << 'EOF'
# TypeB Staging Environment Configuration
# Updated: $(date)

# Environment
EXPO_PUBLIC_ENVIRONMENT=staging

# Firebase Configuration - STAGING
FIREBASE_PROJECT_ID=tybeb-staging
FIREBASE_API_KEY=your-staging-api-key
FIREBASE_AUTH_DOMAIN=tybeb-staging.firebaseapp.com
FIREBASE_STORAGE_BUCKET=tybeb-staging.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-staging-sender-id
FIREBASE_APP_ID=your-staging-app-id
FIREBASE_MEASUREMENT_ID=your-staging-measurement-id

# TODO: Get these from Firebase Console
# 1. Go to https://console.firebase.google.com/u/0/project/tybeb-staging/settings/general
# 2. Scroll down to "Your apps" section
# 3. Click on the Web app (</>) 
# 4. Copy the config values

EOF

# Append the rest of the template
tail -n +11 env.example >> .env.staging.tmp

echo ""
echo "✅ Created .env.staging.tmp with staging values"
echo ""
echo "⚠️  IMPORTANT: You need to:"
echo "1. Go to Firebase Console: https://console.firebase.google.com/u/0/project/tybeb-staging/settings/general"
echo "2. Find your Web app configuration"
echo "3. Replace the placeholder values in .env.staging.tmp"
echo "4. Then run: mv .env.staging.tmp .env.staging"
echo ""
echo "For .env.local (development), you can use the same staging values for now."
