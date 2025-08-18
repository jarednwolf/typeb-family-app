# TypeB Family App

**Transform household chaos into organized success** - A task management platform for families with photo validation and rewards.

🌐 **Production Web**: https://typebapp.com  
📱 **Mobile**: iOS TestFlight (Beta) | Android (Coming Soon)  
📊 **Status**: Beta Testing → Production Launch (1 week)  

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm 8+
- Firebase project (with Blaze plan)
- Apple Developer account (for iOS)
- RevenueCat account (for payments)

### Installation

```bash
# Clone repository
git clone [repository-url]
cd tybeb_b

# Install dependencies
pnpm install

# Build shared packages
pnpm build

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values
```

### Development

```bash
# Run everything in dev mode
pnpm dev

# Run specific apps
pnpm dev:web    # Next.js web app
pnpm dev:mobile # React Native app

# Run tests
pnpm test

# Type checking
pnpm type-check
```

### Deployment

```bash
# Deploy web to production
pnpm deploy:web:prod

# Build mobile for TestFlight
cd typeb-family-app
eas build --platform ios --profile production

# Deploy Firebase rules
firebase deploy --only firestore:rules
```

## Architecture

```
tybeb_b/
├── apps/
│   └── web/              # Next.js web application
├── typeb-family-app/     # React Native mobile app (to be moved)
├── packages/
│   ├── core/             # Business logic & validators  
│   ├── store/            # Redux configuration
│   └── types/            # TypeScript definitions
└── docs/                 # Documentation
```

### Tech Stack
- **Frontend**: React Native (Expo SDK 50), Next.js 15.4
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Payments**: RevenueCat
- **State**: Redux Toolkit
- **Deployment**: Vercel (web), EAS Build (mobile)

## Features

### Core (Free)
- ✅ Family management (up to 5 members)
- ✅ Task creation and assignment
- ✅ Photo validation
- ✅ Points and basic rewards
- ✅ Push notifications

### Premium ($4.99/mo or $39.99/yr)
- 📸 Priority photo validation queue
- 🏷️ Unlimited custom categories
- 📊 Advanced analytics dashboard
- 🔔 Smart notifications with escalation
- 👥 Unlimited family members
- 🎯 Priority support (2-hour response)

## Documentation

| Document | Purpose |
|----------|---------|
| [Architecture](./docs/ARCHITECTURE.md) | System design and technical decisions |
| [Operations](./docs/OPERATIONS.md) | Deployment, monitoring, and maintenance |
| [Security](./docs/SECURITY.md) | Security policies and compliance (COPPA) |
| [Contributing](./docs/CONTRIBUTING.md) | Development workflow and guidelines |
| [Roadmap](./docs/ROADMAP.md) | Product timeline and milestones |

### Quick Links
- [Production Checklist](./docs/PRODUCTION-READINESS-TRACKER.md)
- [API Documentation](./docs/API.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Environment Configuration

### Required Environment Variables

```bash
# Firebase
FIREBASE_PROJECT_ID=typeb-family-app
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxxxx
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xxxxx

# Monitoring
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Environment
EXPO_PUBLIC_ENVIRONMENT=development|staging|production
```

See [Operations Guide](./docs/OPERATIONS.md) for complete configuration.

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (mobile)
cd typeb-family-app
pnpm e2e:ios

# E2E tests (web)
cd apps/web
pnpm test:e2e
```

## Production Launch Status

### ✅ Completed
- Feature development (100%)
- Firebase configuration
- Payment integration
- Web deployment

### 🚧 In Progress (Week 1 Sprint)
- CI/CD pipeline setup
- COPPA compliance implementation
- Staging environment configuration
- Google SSO integration

### 📋 Pending
- Android app build
- App Store submission
- Load testing
- Customer support setup

See [Production Tracker](./docs/PRODUCTION-READINESS-TRACKER.md) for detailed status.

## Support

### Development
- GitHub Issues: [Link to issues]
- Discord: [Development channel]

### Production
- Email: support@typebapp.com
- Premium: 2-hour response SLA
- Status Page: https://status.typebapp.com (coming soon)

## License

Copyright © 2025 TypeB. All rights reserved.

---

**Version**: 1.0.1-beta  
**Last Updated**: January 2025  
**Maintainers**: TypeB Team  

For detailed setup instructions, see [Operations Guide](./docs/OPERATIONS.md).  
For contribution guidelines, see [Contributing](./docs/CONTRIBUTING.md).