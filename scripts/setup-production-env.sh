#!/bin/bash

# TypeB Family App - Production Environment Setup
# This script helps set up the production environment configuration

set -e

echo "🏭 TypeB Family - Production Environment Setup"
echo "=============================================="
echo ""
echo "This script will help you configure the production environment for tybeb-prod"
echo ""

# Function to prompt for value with optional default
prompt_for_value() {
    local prompt_text="$1"
    local default_value="$2"
    local var_name="$3"
    
    if [ -n "$default_value" ]; then
        read -p "$prompt_text [$default_value]: " value
        value="${value:-$default_value}"
    else
        read -p "$prompt_text: " value
    fi
    
    echo "$value"
}

# Create .env.production file
create_production_env() {
    echo "📝 Creating .env.production file..."
    echo ""
    
    # Firebase Production Configuration
    echo "Firebase Production Configuration (tybeb-prod):"
    echo "You can find these values at: https://console.firebase.google.com/u/0/project/tybeb-prod/settings/general"
    echo ""
    
    FIREBASE_API_KEY=$(prompt_for_value "Firebase API Key" "" "FIREBASE_API_KEY")
    FIREBASE_MESSAGING_SENDER_ID=$(prompt_for_value "Firebase Messaging Sender ID" "" "FIREBASE_MESSAGING_SENDER_ID")
    FIREBASE_APP_ID=$(prompt_for_value "Firebase App ID" "" "FIREBASE_APP_ID")
    FIREBASE_MEASUREMENT_ID=$(prompt_for_value "Firebase Measurement ID (optional)" "" "FIREBASE_MEASUREMENT_ID")
    
    echo ""
    echo "RevenueCat Configuration:"
    REVENUECAT_IOS_KEY=$(prompt_for_value "RevenueCat iOS Public Key" "" "REVENUECAT_IOS_KEY")
    REVENUECAT_ANDROID_KEY=$(prompt_for_value "RevenueCat Android Public Key" "" "REVENUECAT_ANDROID_KEY")
    
    echo ""
    echo "Sentry Configuration (optional):"
    SENTRY_DSN=$(prompt_for_value "Sentry DSN (press Enter to skip)" "" "SENTRY_DSN")
    
    # Write to .env.production
    cat > .env.production << EOF
# Production Environment Variables
# Generated on $(date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Environment
EXPO_PUBLIC_ENVIRONMENT=production

# Firebase Production (tybeb-prod)
EXPO_PUBLIC_FIREBASE_API_KEY_PROD=$FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD=tybeb-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID_PROD=tybeb-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD=tybeb-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD=$FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID_PROD=$FIREBASE_APP_ID
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID_PROD=$FIREBASE_MEASUREMENT_ID

# RevenueCat
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_IOS=$REVENUECAT_IOS_KEY
EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_ANDROID=$REVENUECAT_ANDROID_KEY

# Sentry
EXPO_PUBLIC_SENTRY_DSN=$SENTRY_DSN
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_RELEASE=\${VERSION}

# API Configuration
EXPO_PUBLIC_API_URL=https://api.typebapp.com
EXPO_PUBLIC_WEBSOCKET_URL=wss://ws.typebapp.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
EXPO_PUBLIC_PERFORMANCE_MONITORING=true
EXPO_PUBLIC_BETA_FEATURES=false
EOF
    
    echo ""
    echo "✅ .env.production file created successfully!"
    
    # Add to .gitignore if not already there
    if ! grep -q "^\.env\.production$" .gitignore 2>/dev/null; then
        echo ".env.production" >> .gitignore
        echo "✅ Added .env.production to .gitignore"
    fi
}

# Setup Firebase project
setup_firebase_project() {
    echo ""
    echo "🔥 Setting up Firebase project..."
    echo ""
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo "❌ Firebase CLI not found. Please install it first:"
        echo "npm install -g firebase-tools"
        exit 1
    fi
    
    # Login to Firebase
    echo "Logging into Firebase..."
    firebase login
    
    # Use production project
    firebase use tybeb-prod
    
    echo "✅ Firebase project set to tybeb-prod"
    
    # Option to deploy rules and indexes
    read -p "Do you want to deploy Firebase rules and indexes to production? (y/n): " deploy_firebase
    if [ "$deploy_firebase" = "y" ]; then
        firebase deploy --only firestore:rules,firestore:indexes
        firebase deploy --only storage:rules
        echo "✅ Firebase rules and indexes deployed"
    fi
}

# Setup EAS Build configuration
setup_eas_build() {
    echo ""
    echo "📱 Configuring EAS Build for production..."
    echo ""
    
    # Update eas.json for production
    read -p "Do you want to configure EAS Build secrets? (y/n): " configure_eas
    if [ "$configure_eas" = "y" ]; then
        echo "Setting EAS secrets for production builds..."
        
        # Read values from .env.production
        source .env.production
        
        # Set EAS secrets
        eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY_PROD --value "$EXPO_PUBLIC_FIREBASE_API_KEY_PROD" --force
        eas secret:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD --value "$EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD" --force
        eas secret:create --name EXPO_PUBLIC_FIREBASE_APP_ID_PROD --value "$EXPO_PUBLIC_FIREBASE_APP_ID_PROD" --force
        eas secret:create --name EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_IOS --value "$EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_IOS" --force
        eas secret:create --name EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_ANDROID --value "$EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY_ANDROID" --force
        
        if [ -n "$EXPO_PUBLIC_SENTRY_DSN" ]; then
            eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "$EXPO_PUBLIC_SENTRY_DSN" --force
        fi
        
        echo "✅ EAS secrets configured for production"
    fi
}

# Main menu
echo "What would you like to set up?"
echo "1. Create .env.production file"
echo "2. Setup Firebase project"
echo "3. Configure EAS Build"
echo "4. All of the above"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        create_production_env
        ;;
    2)
        setup_firebase_project
        ;;
    3)
        if [ ! -f .env.production ]; then
            echo "⚠️  .env.production not found. Creating it first..."
            create_production_env
        fi
        setup_eas_build
        ;;
    4)
        create_production_env
        setup_firebase_project
        setup_eas_build
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Production environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review the generated .env.production file"
echo "2. Test the production configuration locally:"
echo "   EXPO_PUBLIC_ENVIRONMENT=production npm start"
echo "3. Build for production:"
echo "   eas build --platform all --profile production"
echo ""
echo "⚠️  Remember: Never commit .env.production to version control!"
