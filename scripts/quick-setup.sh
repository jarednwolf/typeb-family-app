#!/bin/bash

# TypeB Quick Setup Script - Day 1 Production Sprint
# This script helps you quickly set up the critical infrastructure

echo "🚀 TypeB Production Sprint - Quick Setup"
echo "========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Creating .env.local from template..."
    cp env.example .env.local
fi

echo "📝 Please update .env.local with these values:"
echo ""
echo "FIREBASE_PROJECT_ID=tybeb-staging"
echo "FIREBASE_AUTH_DOMAIN=tybeb-staging.firebaseapp.com"
echo "FIREBASE_STORAGE_BUCKET=tybeb-staging.appspot.com"
echo ""
echo "✅ Firebase staging is already set up at:"
echo "   https://console.firebase.google.com/u/0/project/tybeb-staging/overview"
echo ""

# Create staging and production env files if they don't exist
if [ ! -f .env.staging ]; then
    echo "Creating .env.staging..."
    cp env.example .env.staging
    echo "EXPO_PUBLIC_ENVIRONMENT=staging" >> .env.staging
fi

if [ ! -f .env.production ]; then
    echo "Creating .env.production..."
    cp env.example .env.production
    echo "EXPO_PUBLIC_ENVIRONMENT=production" >> .env.production
fi

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔧 Setting up pre-commit hooks..."
if command -v pre-commit &> /dev/null; then
    pre-commit install
else
    echo "⚠️  pre-commit not installed. Run: pip install pre-commit"
fi

echo ""
echo "📊 GitHub Setup Status:"
git remote -v
echo ""
echo "Current branch: $(git branch --show-current)"
echo "Uncommitted changes: $(git status --porcelain | wc -l) files"

echo ""
echo "🎯 Day 1 Critical Tasks:"
echo "  1. ✅ Environment files created"
echo "  2. ⏳ Update .env.local with Firebase staging credentials"
echo "  3. ⏳ Configure RevenueCat API keys in .env files"
echo "  4. ⏳ Set up GitHub secrets for CI/CD"
echo "  5. ⏳ Implement COPPA consent flow"
echo ""

echo "🔑 GitHub Secrets needed (add via CLI or web):"
echo "  gh secret set VERCEL_TOKEN --body 'your-token'"
echo "  gh secret set FIREBASE_TOKEN --body 'your-token'"
echo "  gh secret set EXPO_TOKEN --body 'your-token'"
echo "  gh secret set VERCEL_ORG_ID --body 'your-org-id'"
echo "  gh secret set VERCEL_PROJECT_ID --body 'your-project-id'"
echo ""

echo "📱 To test Firebase connection:"
echo "  cd typeb-family-app"
echo "  npm start"
echo ""

echo "🌐 To test web app:"
echo "  cd apps/web"
echo "  npm run dev"
echo ""

echo "📋 View full tracker: docs/PRODUCTION-READINESS-TRACKER.md"
echo "📅 View roadmap: docs/ROADMAP.md"
echo ""

echo "Ready to start the sprint? Let's ship! 🚀"
