#!/bin/bash

# Create Demo Accounts using Firebase REST API
# This script creates demo accounts in your production Firebase

echo "🎭 Creating demo accounts in Firebase..."
echo ""
echo "This script will guide you through creating demo accounts."
echo "You'll need to manually create these accounts in the Firebase Console."
echo ""
echo "=========================================="
echo "DEMO ACCOUNTS TO CREATE:"
echo "=========================================="
echo ""
echo "1. Demo Parent Account:"
echo "   Email: demo@typebapp.com"
echo "   Password: Demo123!"
echo "   Display Name: Demo Parent"
echo ""
echo "2. Demo Child Account:"
echo "   Email: demo.child@typebapp.com"
echo "   Password: Demo123!"
echo "   Display Name: Demo Child"
echo ""
echo "=========================================="
echo "STEPS TO CREATE IN FIREBASE CONSOLE:"
echo "=========================================="
echo ""
echo "1. Go to https://console.firebase.google.com"
echo "2. Select your 'typeb-family-app' project"
echo "3. Navigate to Authentication > Users"
echo "4. Click 'Add user' button"
echo "5. Enter the email and password for each account"
echo "6. Click 'Add user' to create each account"
echo ""
echo "After creating the accounts, the app will automatically:"
echo "- Set up user profiles when they first sign in"
echo "- Allow them to create or join a demo family"
echo "- Enable all premium features for demo accounts"
echo ""
echo "Press Enter to open Firebase Console in your browser..."
read

# Open Firebase Console in browser
open "https://console.firebase.google.com/project/typeb-family-app/authentication/users"

echo ""
echo "✅ Firebase Console opened in your browser."
echo "Please create the demo accounts as described above."