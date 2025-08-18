#!/bin/bash

echo "🔥 Quick Firebase Config Setup"
echo "=============================="
echo ""
echo "1️⃣  OPEN THIS LINK RIGHT NOW:"
echo "   https://console.firebase.google.com/u/0/project/tybeb-staging/settings/general"
echo ""
echo "2️⃣  Scroll to 'Your apps' section"
echo "   - If you see a web app (</> icon), click it"
echo "   - If not, click 'Add app' → Web → Name it 'TypeB Web'"
echo ""
echo "3️⃣  You'll see configuration like this:"
echo "   apiKey: 'AIzaSy...'         ← COPY THIS"
echo "   authDomain: 'tybeb-staging.firebaseapp.com'"
echo "   projectId: 'tybeb-staging'"
echo "   storageBucket: 'tybeb-staging.appspot.com'"
echo "   messagingSenderId: '123456789'  ← COPY THIS"
echo "   appId: '1:123:web:abc...'       ← COPY THIS"
echo ""
echo "4️⃣  Run this command with YOUR values:"
echo ""
cat << 'SCRIPT'
# PASTE YOUR VALUES HERE AND RUN THIS:
export FIREBASE_API_KEY="AIzaSy..."  # <-- YOUR ACTUAL KEY
export FIREBASE_SENDER_ID="123456"   # <-- YOUR ACTUAL SENDER ID
export FIREBASE_APP_ID="1:123:web:..." # <-- YOUR ACTUAL APP ID

# This will update your .env.staging automatically
sed -i '' "s/FIREBASE_API_KEY=.*/FIREBASE_API_KEY=$FIREBASE_API_KEY/" .env.staging
sed -i '' "s/FIREBASE_PROJECT_ID=.*/FIREBASE_PROJECT_ID=tybeb-staging/" .env.staging
sed -i '' "s/FIREBASE_AUTH_DOMAIN=.*/FIREBASE_AUTH_DOMAIN=tybeb-staging.firebaseapp.com/" .env.staging
sed -i '' "s/FIREBASE_STORAGE_BUCKET=.*/FIREBASE_STORAGE_BUCKET=tybeb-staging.appspot.com/" .env.staging
sed -i '' "s/FIREBASE_MESSAGING_SENDER_ID=.*/FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_SENDER_ID/" .env.staging
sed -i '' "s/FIREBASE_APP_ID=.*/FIREBASE_APP_ID=$FIREBASE_APP_ID/" .env.staging

# Copy to .env.local for development
cp .env.staging .env.local

echo "✅ Environment files updated!"
SCRIPT
