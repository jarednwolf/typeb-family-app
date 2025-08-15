#!/bin/bash

# Create Demo Accounts using Firebase Auth REST API
# This uses the Web API key from your Firebase project

echo "🎭 Creating demo accounts using Firebase REST API..."
echo ""

# Your Firebase Web API Key (from your Firebase project settings)
# You need to get this from: Firebase Console > Project Settings > General > Web API Key
echo "Please enter your Firebase Web API Key:"
echo "(Found in Firebase Console > Project Settings > General)"
read -r API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ API Key is required. Exiting..."
    exit 1
fi

# Firebase Auth REST API endpoint
AUTH_URL="https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$API_KEY"

echo ""
echo "Creating demo parent account..."

# Create Demo Parent Account
PARENT_RESPONSE=$(curl -s -X POST "$AUTH_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@typebapp.com",
    "password": "Demo123!",
    "returnSecureToken": true
  }')

# Check if parent account was created
if echo "$PARENT_RESPONSE" | grep -q "idToken"; then
    echo "✅ Demo parent account created successfully!"
    PARENT_ID_TOKEN=$(echo "$PARENT_RESPONSE" | grep -o '"idToken":"[^"]*' | cut -d'"' -f4)
    PARENT_UID=$(echo "$PARENT_RESPONSE" | grep -o '"localId":"[^"]*' | cut -d'"' -f4)
elif echo "$PARENT_RESPONSE" | grep -q "EMAIL_EXISTS"; then
    echo "ℹ️  Demo parent account already exists"
else
    echo "❌ Failed to create demo parent account:"
    echo "$PARENT_RESPONSE"
fi

echo ""
echo "Creating demo child account..."

# Create Demo Child Account
CHILD_RESPONSE=$(curl -s -X POST "$AUTH_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo.child@typebapp.com",
    "password": "Demo123!",
    "returnSecureToken": true
  }')

# Check if child account was created
if echo "$CHILD_RESPONSE" | grep -q "idToken"; then
    echo "✅ Demo child account created successfully!"
    CHILD_ID_TOKEN=$(echo "$CHILD_RESPONSE" | grep -o '"idToken":"[^"]*' | cut -d'"' -f4)
    CHILD_UID=$(echo "$CHILD_RESPONSE" | grep -o '"localId":"[^"]*' | cut -d'"' -f4)
elif echo "$CHILD_RESPONSE" | grep -q "EMAIL_EXISTS"; then
    echo "ℹ️  Demo child account already exists"
else
    echo "❌ Failed to create demo child account:"
    echo "$CHILD_RESPONSE"
fi

echo ""
echo "=========================================="
echo "DEMO ACCOUNTS SUMMARY:"
echo "=========================================="
echo ""
echo "Demo Parent Account:"
echo "  Email: demo@typebapp.com"
echo "  Password: Demo123!"
echo ""
echo "Demo Child Account:"
echo "  Email: demo.child@typebapp.com"
echo "  Password: Demo123!"
echo ""
echo "These accounts can now sign into your app."
echo "The app will automatically set up their profiles"
echo "and demo family when they first sign in."
echo ""
echo "✅ Done!"