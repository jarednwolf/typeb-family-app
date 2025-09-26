#!/bin/bash

# Deploy Firestore Rules and Indexes
# This script deploys the updated Firestore configuration to Firebase

echo "========================================"
echo "TypeB Family App - Firestore Deployment"
echo "========================================"
echo ""

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Error: Firebase CLI is not installed."
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project directory
cd "$PROJECT_DIR"

# Check if we're logged in to Firebase
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase first:"
    firebase login
fi

# Get current project
CURRENT_PROJECT=$(firebase use 2>/dev/null | grep "Active Project:" | cut -d ":" -f 2 | xargs)
if [ -z "$CURRENT_PROJECT" ]; then
    echo "No Firebase project selected."
    echo "Available projects:"
    firebase projects:list
    echo ""
    read -p "Enter project ID to use: " PROJECT_ID
    firebase use "$PROJECT_ID"
else
    echo "Current Firebase project: $CURRENT_PROJECT"
    read -p "Is this correct? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        firebase projects:list
        read -p "Enter project ID to use: " PROJECT_ID
        firebase use "$PROJECT_ID"
    fi
fi

echo ""
echo "Deployment Plan:"
echo "1. Deploy Firestore Security Rules"
echo "2. Deploy Firestore Indexes"
echo ""

# Deploy rules with --dry-run first
echo "Running dry-run for Firestore rules..."
firebase deploy --only firestore:rules --dry-run

if [ $? -eq 0 ]; then
    echo ""
    read -p "Dry-run successful. Deploy Firestore rules? (y/n): " DEPLOY_RULES
    if [ "$DEPLOY_RULES" = "y" ]; then
        echo "Deploying Firestore rules..."
        firebase deploy --only firestore:rules
        if [ $? -eq 0 ]; then
            echo "✅ Firestore rules deployed successfully!"
        else
            echo "❌ Failed to deploy Firestore rules"
            exit 1
        fi
    else
        echo "Skipping Firestore rules deployment."
    fi
else
    echo "❌ Dry-run failed for Firestore rules"
    exit 1
fi

echo ""

# Deploy indexes
echo "Checking Firestore indexes..."
firebase deploy --only firestore:indexes --dry-run

if [ $? -eq 0 ]; then
    echo ""
    read -p "Deploy Firestore indexes? (y/n): " DEPLOY_INDEXES
    if [ "$DEPLOY_INDEXES" = "y" ]; then
        echo "Deploying Firestore indexes..."
        firebase deploy --only firestore:indexes
        if [ $? -eq 0 ]; then
            echo "✅ Firestore indexes deployed successfully!"
            echo ""
            echo "Note: Index creation may take several minutes to complete."
            echo "You can monitor progress in the Firebase Console:"
            echo "https://console.firebase.google.com/project/$CURRENT_PROJECT/firestore/indexes"
        else
            echo "❌ Failed to deploy Firestore indexes"
            exit 1
        fi
    else
        echo "Skipping Firestore indexes deployment."
    fi
else
    echo "❌ Dry-run failed for Firestore indexes"
    exit 1
fi

echo ""
echo "========================================"
echo "Deployment Summary:"
echo ""

if [ "$DEPLOY_RULES" = "y" ]; then
    echo "✅ Firestore rules: Deployed"
else
    echo "⏭️  Firestore rules: Skipped"
fi

if [ "$DEPLOY_INDEXES" = "y" ]; then
    echo "✅ Firestore indexes: Deployed (building...)"
else
    echo "⏭️  Firestore indexes: Skipped"
fi

echo ""
echo "Next steps:"
echo "1. Wait for indexes to finish building (check Firebase Console)"
echo "2. Run data healing script: node scripts/heal-family-data.js --dry-run"
echo "3. Test the application with updated rules"
echo ""
echo "========================================"