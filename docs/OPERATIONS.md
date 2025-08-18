# TypeB Operations Guide

## Environment Setup

### Prerequisites
- Node.js 18+ and pnpm 8+
- Firebase CLI (`npm install -g firebase-tools`)
- EAS CLI (`npm install -g eas-cli`)
- Vercel CLI (`npm install -g vercel`)

### Initial Setup

```bash
# 1. Clone and install
git clone [repo]
cd tybeb_b
pnpm install

# 2. Firebase setup
firebase login
firebase projects:list
firebase use typeb-family-app-staging  # or production

# 3. Environment configuration
cp .env.example .env.local
cp .env.example .env.staging  
cp .env.example .env.production
# Edit each file with appropriate values

# 4. Build packages
pnpm build
```

## Environment Variables

### Required Variables
```bash
# Firebase (all environments)
FIREBASE_PROJECT_ID=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# RevenueCat (staging/production)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=
REVENUECAT_WEBHOOK_SECRET=

# Monitoring (production)
EXPO_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# App Configuration
EXPO_PUBLIC_ENVIRONMENT=development|staging|production
EXPO_PUBLIC_API_URL=
```

### Environment Files
```
.env.local         # Local development
.env.staging       # Staging environment
.env.production    # Production (DO NOT COMMIT)
```

## Deployment Procedures

### Web Deployment (Vercel)

```bash
# Staging deployment
vercel --env-file=.env.staging

# Production deployment
vercel --prod --env-file=.env.production

# Rollback
vercel rollback [deployment-url]
```

### Mobile Deployment (EAS)

```bash
cd typeb-family-app

# iOS Build
eas build --platform ios --profile production

# Android Build  
eas build --platform android --profile production

# Submit to TestFlight
eas submit --platform ios --latest

# Submit to Play Store
eas submit --platform android --latest
```

### Firebase Deployment

```bash
# Deploy everything
firebase deploy --project production

# Deploy specific services
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase deploy --only storage
```

## Daily Operations

### Health Checks

```bash
# Check service status
curl https://typebapp.com/api/health

# Check Firebase status
firebase functions:log --project production

# Check error rate
# Visit: https://sentry.io/organizations/typeb/issues/
```

### Monitoring Dashboard

| Service | URL | Key Metrics |
|---------|-----|-------------|
| Firebase Console | https://console.firebase.google.com | Users, requests, errors |
| Vercel Dashboard | https://vercel.com/dashboard | Deployments, functions |
| RevenueCat | https://app.revenuecat.com | Revenue, subscriptions |
| Sentry | https://sentry.io | Error rate, performance |

### Alert Thresholds

- **Error Rate**: >1% triggers PagerDuty
- **API Latency**: >500ms p95
- **Payment Failures**: >5% conversion drop
- **Storage**: >80% capacity

## Backup & Recovery

### Automated Backups

```bash
# Firestore backup (runs daily at 2 AM UTC)
gcloud firestore export gs://typeb-backups/$(date +%Y%m%d)

# Manual backup
npm run backup:firestore
```

### Recovery Procedures

```bash
# Restore from backup
gcloud firestore import gs://typeb-backups/20250101

# Restore specific collection
firebase firestore:delete families --project production
gcloud firestore import gs://typeb-backups/20250101/families
```

## Security Operations

### Secret Rotation

```bash
# 1. Generate new secrets
openssl rand -base64 32

# 2. Update in vault
# - Firebase Console
# - RevenueCat Dashboard
# - Vercel Environment Variables

# 3. Deploy with new secrets
pnpm deploy:all

# 4. Verify functionality
npm run test:production
```

### Security Checklist (Monthly)
- [ ] Rotate API keys
- [ ] Review Firebase rules
- [ ] Check dependency vulnerabilities
- [ ] Audit user permissions
- [ ] Review access logs

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 | Service down | Immediate | Payment system failure |
| P1 | Major degradation | 30 min | Login failures >10% |
| P2 | Minor issue | 2 hours | Slow photo uploads |
| P3 | Low impact | 24 hours | UI glitch |

### Response Procedures

```bash
# 1. Assess impact
firebase functions:log --limit 100

# 2. Rollback if needed
vercel rollback
git revert HEAD && git push

# 3. Communicate
# Update status page
# Notify affected users

# 4. Post-mortem
# Document in /docs/incidents/YYYY-MM-DD.md
```

## Performance Optimization

### Database Queries

```javascript
// Index required queries
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Image Optimization

```bash
# Compress images before upload
sharp input.jpg -resize 1920 -quality 80 -o output.jpg

# Clean old photos (>90 days)
npm run cleanup:photos
```

## Maintenance Windows

### Scheduled Maintenance
- **Time**: Tuesdays 2-4 AM UTC
- **Frequency**: Monthly
- **Duration**: <2 hours
- **Notification**: 48 hours advance

### Maintenance Checklist
```bash
# 1. Enable maintenance mode
firebase functions:config:set app.maintenance=true

# 2. Backup data
npm run backup:all

# 3. Run updates
pnpm update
firebase deploy

# 4. Test critical paths
npm run test:smoke

# 5. Disable maintenance mode
firebase functions:config:set app.maintenance=false
```

## Cost Management

### Current Costs (Monthly)
- Firebase: ~$200 (Blaze plan)
- Vercel: ~$20 (Pro plan)
- RevenueCat: ~$0 (Free <$10k revenue)
- Sentry: ~$0 (Free tier)
- **Total**: ~$220/month

### Cost Optimization
- Enable Firebase budget alerts
- Use Cloud CDN for images
- Implement query result caching
- Archive old data to cold storage

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Clear cache: `pnpm clean && pnpm install` |
| Firebase permission denied | Check security rules and auth |
| Payment webhook fails | Verify RevenueCat webhook URL |
| Push notifications not working | Check FCM certificates |

### Debug Commands

```bash
# Check Firebase project
firebase projects:list
firebase use --add

# Test functions locally
firebase emulators:start
npm run test:functions

# View logs
firebase functions:log --limit 50
vercel logs [deployment-url]
```

## Contact & Escalation

### Internal Contacts
- **On-call Engineer**: Check PagerDuty
- **Product Owner**: [email]
- **Security Team**: security@typebapp.com

### Vendor Support
- **Firebase**: https://firebase.google.com/support
- **Vercel**: https://vercel.com/support
- **RevenueCat**: support@revenuecat.com
- **Apple Developer**: https://developer.apple.com/contact

---

**Last Updated**: January 2025  
**Next Review**: February 2025
