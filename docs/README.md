# TypeB Documentation Hub

> **Single source of truth for TypeB Family App documentation**

## 🚀 Quick Links

- [Getting Started](./GETTING-STARTED.md) - Set up your development environment
- [Architecture](./architecture.md) - System design and technical decisions
- [Deployment](./DEPLOYMENT.md) - Deploy to production environments
- [API Reference](./API.md) - Backend API documentation
- [Production Checklist](./PRODUCTION-CHECKLIST.md) - Launch readiness tracker

## 📊 Project Status (grounded)

| Component | Status | Notes |
|-----------|--------|-------|
| iOS App | 🟡 Beta-ready | Firebase env-only; Google Sign-In present; Sentry service present (needs DSN) |
| Android App | 🔴 Not Started | Planned post-launch |
| Web App | 🟡 Ready | Firebase env-only; Google SSO implemented; RevenueCat webhook; Sentry not wired |
| Backend | 🟡 Partial | Firestore/Storage rules present; COPPA functions implemented; functions duplication exists |

## 📚 Documentation Structure

### Core Documentation
- **[README.md](./README.md)** - This file, documentation hub
- **[architecture.md](./architecture.md)** - System design, tech stack, data models
- **[DATA-MODEL.md](./DATA-MODEL.md)** - Collections and core fields
- **[DESIGN-GUIDELINES.md](./DESIGN-GUIDELINES.md)** - UI/UX and accessibility
- **[GETTING-STARTED.md](./GETTING-STARTED.md)** - Development setup and quickstart
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - All deployment procedures (web, mobile, backend)
- **[SECURITY.md](./SECURITY.md)** - Security policies, COPPA compliance, best practices
- **[API.md](./API.md)** - API endpoints, authentication, data structures
- **[TESTING.md](./TESTING.md)** - Testing strategies, running tests, coverage
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)** - Production readiness tracker

### Planning & Progress
- **[ROADMAP.md](./ROADMAP.md)** - Product roadmap and milestones
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes

### Guides
- **[guides/app-store-submission.md](./guides/app-store-submission.md)** - iOS/Android store submission
- (coming soon) guides/firebase-setup.md — Firebase project configuration
- (coming soon) guides/payment-integration.md — RevenueCat setup
- (coming soon) guides/monitoring-setup.md — Sentry and analytics
- **[guides/ci-cd-setup.md](./guides/ci-cd-setup.md)** - GitHub Actions configuration
- **[guides/coppa-compliance.md](./guides/coppa-compliance.md)** - COPPA implementation guide

### Architecture Decision Records (ADRs)
- **[decisions/001-firebase-backend.md](./decisions/001-firebase-backend.md)** - Why Firebase
- **[decisions/002-monorepo-structure.md](./decisions/002-monorepo-structure.md)** - Monorepo architecture
- **[decisions/003-payment-provider.md](./decisions/003-payment-provider.md)** - Why RevenueCat
- **[decisions/004-state-management.md](./decisions/004-state-management.md)** - Redux Toolkit choice

## 🎯 For Different Audiences

### For Developers
1. Start with [Getting Started](./GETTING-STARTED.md)
2. Review [Architecture](./ARCHITECTURE.md)
3. Check [Development Standards](./CONTRIBUTING.md)
4. Run through [Testing](./TESTING.md)

### For DevOps/Infrastructure
1. Review [Deployment](./DEPLOYMENT.md)
2. Check [Security](./SECURITY.md)
3. Set up [CI/CD](./guides/ci-cd-setup.md)
4. Configure [Monitoring](./guides/monitoring-setup.md)

### For Product/Business
1. Review [Roadmap](./ROADMAP.md)
2. Check [Production Checklist](./PRODUCTION-CHECKLIST.md)
3. Understand [COPPA Compliance](./guides/coppa-compliance.md)
4. Review [Changelog](./CHANGELOG.md)

### For QA/Testing
1. Review [Testing](./TESTING.md)
2. Check [Troubleshooting](./TROUBLESHOOTING.md)
3. Understand [API](./API.md)

## 🚨 Production Readiness

### Critical Blockers (Must Fix)
- [ ] CI/CD deploy/EAS jobs added and verified
- [ ] COPPA policy content + end-to-end validation
- [ ] RevenueCat products + API keys configured
- [ ] Sentry (web + mobile) configured with DSNs
- [ ] Staging environment activated and used

### Current Gaps
- No automated deployments
- Missing parental consent flow
- External services not configured
- No production monitoring

See [Production Checklist](./PRODUCTION-CHECKLIST.md) for full details.

## 📞 Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **Slack**: #typeb-dev for development discussions
- **Email**: dev@typebapp.com for urgent issues

## 🔄 Keeping Docs Updated

All documentation should be:
- **Accurate**: Reflect current state of code
- **Complete**: Cover all necessary topics
- **Concise**: Get to the point quickly
- **Current**: Updated with each release

When making changes:
1. Update relevant documentation
2. Add entry to [CHANGELOG.md](./CHANGELOG.md)
3. Review related docs for consistency
4. Remove or archive outdated content

---

**Last Updated**: January 2025  
**Documentation Version**: 2.0.0  
**Maintained By**: TypeB Development Team