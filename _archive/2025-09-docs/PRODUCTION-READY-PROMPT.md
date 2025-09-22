# Production Launch Implementation Prompt

Use this prompt with Claude Opus 4.1 in Kilo Code to implement all production requirements.

---

## PROMPT FOR CLAUDE:

I need you to help me implement critical production requirements for TypeB, a family task management app. The app is feature-complete but missing crucial infrastructure and compliance features. We have 7 days to reach production readiness.

## Current State
- **Codebase Location**: `/Users/jared.wolf/Library/CloudStorage/Dropbox/projects/personal/tybeb_b`
- **Tech Stack**: React Native (Expo), Next.js, Firebase, Redux Toolkit
- **Status**: 52% production ready - features complete, infrastructure missing
- **Documentation**: Consolidated in `/docs` folder with comprehensive guides

## Critical Blockers to Fix (Priority Order)

### DAY 1-2: Infrastructure & Compliance

#### Task 1: Create CI/CD Pipeline
Create `.github/workflows/main.yml` following the guide in `/docs/guides/ci-cd-setup.md`. The pipeline must:
- Run tests on every push
- Build web and mobile apps
- Deploy to staging automatically
- Deploy to production with manual approval
- Include these jobs: quality checks, testing, security scan, build, deploy

Required secrets to add to GitHub:
```
VERCEL_TOKEN
VERCEL_ORG_ID  
VERCEL_PROJECT_ID
FIREBASE_TOKEN
EXPO_TOKEN
SENTRY_DSN
REVENUECAT_API_KEY_IOS
REVENUECAT_API_KEY_ANDROID
```

#### Task 2: Implement COPPA Compliance
Following `/docs/guides/coppa-compliance.md`, implement:

1. Create age gate component at `typeb-family-app/src/screens/auth/AgeGateScreen.tsx`
2. Create parental consent flow at `typeb-family-app/src/screens/auth/ParentalConsentScreen.tsx`
3. Update Firebase security rules in `firestore.rules` to restrict data for users under 13
4. Create COPPA service at `typeb-family-app/src/services/coppa/CoppaService.ts`
5. Add Cloud Function for photo auto-deletion after 90 days
6. Update privacy policy with COPPA section

#### Task 3: Environment Configuration
1. Create `.env.staging` and `.env.production` from `env.example`
2. Add production Firebase configuration
3. Configure staging Firebase project `typeb-family-app-staging`
4. Set up environment-specific builds in `app.config.js`

### DAY 3-4: External Services & Authentication

#### Task 4: RevenueCat Payment Integration
In `typeb-family-app/src/services/payments/`:
1. Create `RevenueCatService.ts` with initialization
2. Add products: monthly ($4.99) and annual ($39.99) subscriptions
3. Implement purchase flow with proper error handling
4. Add webhook endpoint for subscription events
5. Update Redux store with subscription state

#### Task 5: Google SSO Implementation
1. Configure Google OAuth in Firebase Console
2. Add Google Sign-In button to `typeb-family-app/src/screens/auth/LoginScreen.tsx`
3. Implement authentication flow in `typeb-family-app/src/services/auth/AuthService.ts`
4. Update user profile creation to handle OAuth data
5. Test on both iOS and Android

#### Task 6: Sentry Error Monitoring
1. Install Sentry packages: `@sentry/react-native`
2. Initialize in `typeb-family-app/App.tsx` and `apps/web/src/app/layout.tsx`
3. Configure source maps upload in build process
4. Set up error boundaries
5. Create alerts for error rate >1%

### DAY 5-6: Security & Testing

#### Task 7: Firebase Security Hardening
Update `firestore.rules` with:
1. Rate limiting (max 100 requests/minute per user)
2. Input validation for all write operations
3. Family data isolation (users can only see their family's data)
4. Role-based access (parents vs children)
5. COPPA restrictions for users under 13

#### Task 8: Load Testing Setup
Create load testing script in `scripts/load-test.js`:
1. Simulate 1,000 concurrent users
2. Test critical paths: login, task creation, photo upload
3. Measure API response times (target <500ms p95)
4. Generate performance report

#### Task 9: E2E Test Implementation
Fix and run E2E tests in `typeb-family-app/e2e/`:
1. Update test configuration for current app version
2. Test critical user journeys
3. Add tests for COPPA flow
4. Add tests for payment flow
5. Ensure all tests pass before deployment

### DAY 7: Production Deployment

#### Task 10: Production Deployment
1. Run final test suite
2. Deploy web app to Vercel production
3. Deploy Firebase rules and functions
4. Build and submit iOS app to TestFlight
5. Monitor metrics for first hour

## File Structure to Create/Modify

```
.github/
└── workflows/
    ├── main.yml                 # CREATE: Main CI/CD pipeline
    ├── deploy-production.yml    # CREATE: Production deployment
    └── rollback.yml            # CREATE: Rollback workflow

typeb-family-app/
├── src/
│   ├── screens/
│   │   └── auth/
│   │       ├── AgeGateScreen.tsx           # CREATE
│   │       └── ParentalConsentScreen.tsx   # CREATE
│   └── services/
│       ├── coppa/
│       │   └── CoppaService.ts            # CREATE
│       └── payments/
│           └── RevenueCatService.ts       # CREATE
├── .env.staging                            # CREATE
├── .env.production                         # CREATE
└── firestore.rules                         # MODIFY

apps/web/
└── .env.production                         # CREATE

functions/
└── src/
    └── coppa.ts                           # CREATE: Auto-delete photos

scripts/
└── load-test.js                          # CREATE
```

## Testing Checklist
After each implementation, verify:
- [ ] Unit tests pass
- [ ] Integration tests pass  
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Feature works in development
- [ ] Feature works in staging

## Resources
- Full documentation: `/docs/` folder
- CI/CD Guide: `/docs/guides/ci-cd-setup.md`
- COPPA Guide: `/docs/guides/coppa-compliance.md`
- Deployment Guide: `/docs/DEPLOYMENT.md`
- Production Checklist: `/docs/PRODUCTION-CHECKLIST.md`

## Success Criteria
- All P0 items in `/docs/PRODUCTION-CHECKLIST.md` completed
- CI/CD pipeline running and passing
- COPPA compliance fully implemented
- Payment processing working
- Error monitoring active
- Load test passing (1000 users, <500ms latency)
- Security audit passed

## Important Notes
1. Focus ONLY on P0 (critical) items - everything else can wait
2. Test each feature thoroughly before moving to the next
3. Use staging environment for all testing before production
4. Keep rollback plan ready at each step
5. Document any deviations or issues encountered

Start with Task 1 (CI/CD Pipeline) and work through sequentially. Each task builds on the previous one. Ask for clarification if any requirement is unclear, but aim to complete all 10 tasks within the timeline.

---

## HOW TO USE THIS PROMPT:

1. Copy everything between "PROMPT FOR CLAUDE" and this section
2. Paste into Kilo Code with Claude Opus 4.1
3. Claude will work through each task systematically
4. Monitor progress and provide feedback as needed
5. Use `/docs/PRODUCTION-CHECKLIST.md` to track completion

## EXPECTED TIMELINE:
- Day 1-2: Tasks 1-3 (Infrastructure)
- Day 3-4: Tasks 4-6 (Services)
- Day 5-6: Tasks 7-9 (Testing)
- Day 7: Task 10 (Deployment)

This prompt will guide Claude to implement all critical production requirements in the correct order with proper testing at each step.