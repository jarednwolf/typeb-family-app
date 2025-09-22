# Deployment Guide

This guide covers all deployment procedures for TypeB applications across different environments and platforms.

## Environments

| Environment | Purpose | URL | Firebase Project |
|-------------|---------|-----|------------------|
| Development | Local development | localhost | Firebase Emulators |
| Staging | Pre-production testing | staging.typebapp.com | typeb-family-app-staging |
| Production | Live application | typebapp.com | typeb-family-app |

## Prerequisites

### Required Tools
- Firebase CLI: `npm install -g firebase-tools`
- EAS CLI: `npm install -g eas-cli`
- Vercel CLI: `npm install -g vercel`
- GitHub CLI: `gh` (optional but helpful)

### Required Access
- GitHub repository write access
- Firebase project access (Editor role)
- Vercel team access
- EAS/Expo account access
- Apple Developer account (for iOS)
- Google Play Console (for Android)

### Environment Variables
Ensure all `.env` files are configured:
- `.env.local` - Development
- `.env.staging` - Staging
- `.env.production` - Production (never commit!)

## Web Deployment (Next.js to Vercel)

### Development Deployment

```bash
cd apps/web

# Build and test locally
pnpm build
pnpm start

# Deploy to Vercel preview
vercel

# Follow prompts to link project
```

### Staging Deployment

```bash
cd apps/web

# Deploy to staging
vercel --env-file=.env.staging --prod=false

# Or using GitHub integration (automatic on push to staging branch)
git checkout staging
git merge develop
git push origin staging
```

### Production Deployment

```bash
cd apps/web

# IMPORTANT: Test in staging first!

# Option 1: CLI deployment
vercel --prod --env-file=.env.production

# Option 2: GitHub integration (automatic on push to main)
git checkout main
git merge staging
git push origin main

# Option 3: Promote from staging
vercel promote [staging-deployment-url]
```

### Rollback Procedures

```bash
# List recent deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or instant rollback via dashboard
# https://vercel.com/[team]/[project]/deployments
```

## Mobile Deployment (React Native)

### iOS Deployment

#### Development Build

```bash
cd typeb-family-app

# Local development
npx expo start --ios

# Development build for device
eas build --platform ios --profile development
```

#### TestFlight Deployment (Beta)

```bash
cd typeb-family-app

# 1. Update version in app.json
# Increment buildNumber

# 2. Build for TestFlight
eas build --platform ios --profile preview

# 3. Submit to TestFlight
eas submit --platform ios --latest

# Or specify build
eas submit --platform ios --id=[build-id]
```

#### App Store Deployment (Production)

```bash
cd typeb-family-app

# 1. Update version for production
# Edit app.json - increment version

# 2. Build production IPA
eas build --platform ios --profile production

# 3. Submit to App Store
eas submit --platform ios --latest --production

# 4. Complete submission in App Store Connect
# https://appstoreconnect.apple.com
```

### Android Deployment

#### Development Build

```bash
cd typeb-family-app

# Local development
npx expo start --android

# Development APK
eas build --platform android --profile development
```

#### Internal Testing (Beta)

```bash
cd typeb-family-app

# 1. Build for internal testing
eas build --platform android --profile preview

# 2. Submit to Play Console
eas submit --platform android --latest

# 3. Manage in Play Console
# https://play.google.com/console
```

#### Play Store Deployment (Production)

```bash
cd typeb-family-app

# 1. Build production AAB
eas build --platform android --profile production

# 2. Submit to production track
eas submit --platform android --latest --track=production

# 3. Complete rollout in Play Console
```

## Backend Deployment (Firebase)

### Firebase Services Overview

- **Firestore**: Database rules and indexes
- **Auth**: Authentication configuration
- **Storage**: Storage rules
- **Functions**: Serverless functions
- **Hosting**: Static hosting (if used)

### Consolidation Note (Sept 2025)

Cloud Functions have been consolidated into the root `functions/` package. Rules are sourced from `apps/web/*`.

- Root Firebase config: `firebase.json`
- Functions source: `functions/src/**`
- Firestore rules: `apps/web/firestore.rules`
- Firestore indexes: `apps/web/firestore.indexes.json`
- Storage rules: `apps/web/storage.rules`

### Development Environment

```bash
# Start all emulators from repo root
pnpm firebase:emulators

# Or selectively
firebase emulators:start --only firestore,auth,functions,storage
```

### Staging Deployment

```bash
# Switch to staging project
firebase use typeb-family-app-staging

# Deploy rules first (safer)
pnpm firebase:deploy:rules

# Deploy functions
pnpm --filter @typeb/functions run build
pnpm firebase:deploy:functions
```

### Production Deployment

```bash
# CRITICAL: Test in staging first!

# Switch to production project
firebase use typeb-family-app

# Deploy rules first
pnpm firebase:deploy:rules

# Deploy functions (build+deploy)
pnpm --filter @typeb/functions run build
pnpm firebase:deploy:functions

# Verify logs
firebase functions:log --limit=50
```

### Rollback Procedures

```bash
# Functions rollback to previous commit
git checkout [previous-commit]
pnpm --filter @typeb/functions run build
pnpm firebase:deploy:functions

# Rules rollback
git checkout [previous-commit] -- apps/web/firestore.rules apps/web/storage.rules apps/web/firestore.indexes.json
pnpm firebase:deploy:rules
```

## CI/CD Pipeline (GitHub Actions)

### Pipeline Overview

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, staging]

jobs:
  test:
    # Run tests
  
  deploy-web:
    # Deploy to Vercel
    
  deploy-firebase:
    # Deploy Firebase rules and functions from repo root
```

### Manual Trigger

```bash
# Trigger workflow manually
gh workflow run deploy.yml

# With inputs
gh workflow run deploy.yml -f environment=staging
```

## Environment Variables Reference

### Required Variables

```env
# Firebase (all environments)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# RevenueCat (staging/production)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=

# Sentry (staging/production)
EXPO_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Environment identifier
EXPO_PUBLIC_ENVIRONMENT=development|staging|production
```

### Environment-Specific URLs

```env
# Development
EXPO_PUBLIC_API_URL=http://localhost:5001

# Staging
EXPO_PUBLIC_API_URL=https://staging-api.typebapp.com

# Production
EXPO_PUBLIC_API_URL=https://api.typebapp.com
```

## Monitoring Post-Deployment

### Key Metrics to Watch

1. **Error Rate**
   - Target: <1%
   - Alert threshold: >2%
   - Check: Sentry dashboard

2. **API Latency**
   - Target: <500ms p95
   - Alert threshold: >1000ms
   - Check: Firebase Performance

3. **Crash Rate**
   - Target: <0.5%
   - Alert threshold: >1%
   - Check: Firebase Crashlytics

4. **User Sessions**
   - Monitor for drops
   - Check: Firebase Analytics

### Health Checks

```bash
# Web app health
curl https://typebapp.com/api/health

# Firebase functions
firebase functions:log --limit=100

# Check deployment status
vercel list
eas build:list
```

## Best Practices

1. **Always deploy to staging first**
2. **Use feature flags for gradual rollout**
3. **Monitor metrics for 30 minutes post-deployment**
4. **Keep rollback plan ready**
5. **Document deployment decisions**
6. **Tag releases in git**
7. **Update changelog**
8. **Notify team of deployments**

---

**Last Updated**: September 2025  
**Version**: 2.1.0  
**Next Review**: After each major deployment