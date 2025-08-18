#!/bin/bash

echo "🔥 Updating environment files with Firebase staging configuration..."

# Your actual Firebase configuration from the console
FIREBASE_API_KEY="AIzaSyCOOvQfcyQ52eEPSC3esgl8bex0A9RUXu0"
FIREBASE_AUTH_DOMAIN="tybeb-staging.firebaseapp.com"
FIREBASE_PROJECT_ID="tybeb-staging"
FIREBASE_STORAGE_BUCKET="tybeb-staging.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="388132461668"
FIREBASE_APP_ID="1:388132461668:web:28a15aca13c36aaa475371"

# Update .env.staging
sed -i '' "s|FIREBASE_API_KEY=.*|FIREBASE_API_KEY=$FIREBASE_API_KEY|" .env.staging
sed -i '' "s|FIREBASE_AUTH_DOMAIN=.*|FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN|" .env.staging
sed -i '' "s|FIREBASE_PROJECT_ID=.*|FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID|" .env.staging
sed -i '' "s|FIREBASE_STORAGE_BUCKET=.*|FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET|" .env.staging
sed -i '' "s|FIREBASE_MESSAGING_SENDER_ID=.*|FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID|" .env.staging
sed -i '' "s|FIREBASE_APP_ID=.*|FIREBASE_APP_ID=$FIREBASE_APP_ID|" .env.staging

# Update .env.local with the same values for development
sed -i '' "s|FIREBASE_API_KEY=.*|FIREBASE_API_KEY=$FIREBASE_API_KEY|" .env.local
sed -i '' "s|FIREBASE_AUTH_DOMAIN=.*|FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN|" .env.local
sed -i '' "s|FIREBASE_PROJECT_ID=.*|FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID|" .env.local
sed -i '' "s|FIREBASE_STORAGE_BUCKET=.*|FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET|" .env.local
sed -i '' "s|FIREBASE_MESSAGING_SENDER_ID=.*|FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID|" .env.local
sed -i '' "s|FIREBASE_APP_ID=.*|FIREBASE_APP_ID=$FIREBASE_APP_ID|" .env.local

# Make sure environment is set correctly
sed -i '' "s|EXPO_PUBLIC_ENVIRONMENT=.*|EXPO_PUBLIC_ENVIRONMENT=staging|" .env.staging
sed -i '' "s|EXPO_PUBLIC_ENVIRONMENT=.*|EXPO_PUBLIC_ENVIRONMENT=development|" .env.local

echo "✅ Environment files updated with Firebase configuration!"
echo ""
echo "📋 Configuration applied:"
echo "  Project ID: $FIREBASE_PROJECT_ID"
echo "  Auth Domain: $FIREBASE_AUTH_DOMAIN"
echo "  Storage Bucket: $FIREBASE_STORAGE_BUCKET"
echo ""
echo "📱 Testing connection..."
