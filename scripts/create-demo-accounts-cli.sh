#!/bin/bash

# Create Demo Accounts using Firebase CLI
# Requires firebase-tools to be installed: npm install -g firebase-tools

echo "🎭 Creating demo accounts using Firebase CLI..."
echo ""

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Set the project
firebase use typeb-family-app

echo "Creating demo parent account..."
# Note: Firebase CLI doesn't directly support creating users with passwords
# We'll use a workaround with Firebase Admin SDK via a temporary Node script

cat > temp-create-users.js << 'EOF'
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize with application default credentials
initializeApp({
  projectId: 'typeb-family-app'
});

const auth = getAuth();
const db = getFirestore();

async function createDemoAccounts() {
  try {
    // Create Demo Parent
    let parentUid;
    try {
      const parent = await auth.createUser({
        email: 'demo@typebapp.com',
        password: 'Demo123!',
        displayName: 'Demo Parent',
        emailVerified: true
      });
      parentUid = parent.uid;
      console.log('✓ Created demo parent account');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail('demo@typebapp.com');
        parentUid = existing.uid;
        console.log('✓ Demo parent account already exists');
      } else {
        throw error;
      }
    }

    // Create Demo Child
    let childUid;
    try {
      const child = await auth.createUser({
        email: 'demo.child@typebapp.com',
        password: 'Demo123!',
        displayName: 'Demo Child',
        emailVerified: true
      });
      childUid = child.uid;
      console.log('✓ Created demo child account');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail('demo.child@typebapp.com');
        childUid = existing.uid;
        console.log('✓ Demo child account already exists');
      } else {
        throw error;
      }
    }

    // Create user profiles in Firestore
    await db.collection('users').doc(parentUid).set({
      id: parentUid,
      email: 'demo@typebapp.com',
      displayName: 'Demo Parent',
      role: 'parent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPremium: true,
      notificationsEnabled: true,
      timezone: 'America/Phoenix'
    }, { merge: true });
    console.log('✓ Created demo parent profile');

    await db.collection('users').doc(childUid).set({
      id: childUid,
      email: 'demo.child@typebapp.com',
      displayName: 'Demo Child',
      role: 'child',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationsEnabled: true,
      timezone: 'America/Phoenix'
    }, { merge: true });
    console.log('✓ Created demo child profile');

    console.log('\n✅ Demo accounts created successfully!');
    console.log('\nDemo Parent:');
    console.log('  Email: demo@typebapp.com');
    console.log('  Password: Demo123!');
    console.log('\nDemo Child:');
    console.log('  Email: demo.child@typebapp.com');
    console.log('  Password: Demo123!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

createDemoAccounts();
EOF

# Check if firebase-admin is installed locally
if [ ! -d "node_modules/firebase-admin" ]; then
    echo "Installing firebase-admin temporarily..."
    npm install firebase-admin --no-save
fi

# Run the script with Firebase Admin SDK
echo ""
echo "Authenticating with Firebase..."
echo "Note: You need to be logged in with 'firebase login' and have admin access to the project"
echo ""

# Set up application default credentials
export GOOGLE_APPLICATION_CREDENTIALS=""
firebase login:ci --no-localhost 2>/dev/null | head -1 > .firebase-token
export FIREBASE_TOKEN=$(cat .firebase-token)
rm .firebase-token

# Run with application default credentials
GOOGLE_APPLICATION_CREDENTIALS="" node temp-create-users.js

# Clean up
rm temp-create-users.js

echo ""
echo "✅ Script completed!"