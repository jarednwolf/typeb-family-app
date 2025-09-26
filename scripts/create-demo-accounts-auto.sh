#!/bin/bash

# Create Demo Accounts using Firebase Auth REST API
# This uses the Web API key from your .env file

echo "🎭 Creating demo accounts in Firebase..."
echo ""

# Get the API key from .env file
API_KEY="AIzaSyB7J0bv6LIADDlgCWj_ZkovFON-gaoGt5w"

# Firebase Auth REST API endpoint
AUTH_URL="https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$API_KEY"

echo "Creating demo parent account (demo@typebapp.com)..."

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
    PARENT_UID=$(echo "$PARENT_RESPONSE" | grep -o '"localId":"[^"]*' | cut -d'"' -f4)
    echo "   UID: $PARENT_UID"
elif echo "$PARENT_RESPONSE" | grep -q "EMAIL_EXISTS"; then
    echo "ℹ️  Demo parent account already exists"
else
    echo "❌ Failed to create demo parent account:"
    echo "$PARENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PARENT_RESPONSE"
fi

echo ""
echo "Creating demo child account (demo.child@typebapp.com)..."

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
    CHILD_UID=$(echo "$CHILD_RESPONSE" | grep -o '"localId":"[^"]*' | cut -d'"' -f4)
    echo "   UID: $CHILD_UID"
elif echo "$CHILD_RESPONSE" | grep -q "EMAIL_EXISTS"; then
    echo "ℹ️  Demo child account already exists"
else
    echo "❌ Failed to create demo child account:"
    echo "$CHILD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CHILD_RESPONSE"
fi

echo ""
echo "=========================================="
echo "✅ DEMO ACCOUNTS READY!"
echo "=========================================="
echo ""
echo "Demo Parent Account:"
echo "  📧 Email: demo@typebapp.com"
echo "  🔑 Password: Demo123!"
echo ""
echo "Demo Child Account:"
echo "  📧 Email: demo.child@typebapp.com"
echo "  🔑 Password: Demo123!"
echo ""
echo "Family Invite Code: DEMO01"
echo ""
echo "These accounts can now sign into your app."
echo "The app will automatically:"
echo "  • Set up their user profiles"
echo "  • Create a demo family"
echo "  • Enable premium features"
echo ""
echo "You can verify the accounts were created at:"
echo "https://console.firebase.google.com/project/typeb-family-app/authentication/users"