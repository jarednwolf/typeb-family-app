# TypeB Production Launch Action Plan

**Current Status**: 70% Production Ready  
**Completed Tasks**: CI/CD, COPPA Compliance, Environment Configuration  
**Remaining Critical Tasks**: 7 tasks  
**Timeline**: 3-4 days for aggressive launch, 5-7 days for safe launch  

## 📊 Current State Assessment

### ✅ What's Complete (Day 1-2 Work Done)
1. **CI/CD Pipeline**: Full GitHub Actions workflows created
2. **COPPA Compliance**: Age gate, parental consent, data retention policies
3. **Environment Configuration**: Staging and production .env files ready

### 🔴 Critical Blockers Remaining

## 📋 Task-by-Task Action Plan

### Task 4: RevenueCat Payment Integration ⚡ PRIORITY 1
**Status**: Code complete at `typeb-family-app/src/services/revenueCat.ts`, needs configuration  
**Time Estimate**: 2 hours  

**Actions Required**:
1. **Create RevenueCat Account** (30 min)
   - Go to https://www.revenuecat.com
   - Sign up for account
   - Create new project "TypeB Family App"

2. **Configure Products** (30 min)
   - Create product: `typeb_premium_monthly` - $4.99/month
   - Create product: `typeb_premium_annual` - $39.99/year (save 33%)
   - Create entitlement: `premium`

3. **Get API Keys** (15 min)
   - Copy iOS API key (starts with `appl_`)
   - Copy Android API key (starts with `goog_`)
   - Copy webhook secret

4. **Add to GitHub Secrets** (15 min)
   ```
   PROD_REVENUECAT_API_KEY_IOS=appl_xxxxx
   PROD_REVENUECAT_API_KEY_ANDROID=goog_xxxxx
   PROD_REVENUECAT_WEBHOOK_SECRET=xxxxx
   ```

5. **Update Environment Files** (30 min)
   - Add to `typeb-family-app/.env.production`:
   ```
   EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxxxx
   EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xxxxx
   ```

6. **Test Purchase Flow** (30 min)
   - Use sandbox account to test purchase
   - Verify subscription status updates

---

### Task 5: Google SSO Implementation ⚡ PRIORITY 2
**Status**: Not started  
**Time Estimate**: 3-4 hours  

**Actions Required**:
1. **Firebase Console Setup** (1 hour)
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Google provider
   - Add authorized domains: `typebapp.com`, `localhost`
   - Get Web Client ID and iOS Client ID

2. **Code Implementation** (2 hours)
   - Update `typeb-family-app/src/screens/auth/LoginScreen.tsx`:
   ```typescript
   import { GoogleSignin } from '@react-native-google-signin/google-signin';
   
   // Add Google Sign-In button
   const handleGoogleSignIn = async () => {
     try {
       await GoogleSignin.hasPlayServices();
       const userInfo = await GoogleSignin.signIn();
       // Authenticate with Firebase
       const credential = auth.GoogleAuthProvider.credential(userInfo.idToken);
       await auth().signInWithCredential(credential);
     } catch (error) {
       console.error('Google Sign-In failed:', error);
     }
   };
   ```

3. **Configuration** (30 min)
   - Add to `typeb-family-app/app.json`:
   ```json
   "ios": {
     "googleServicesFile": "./GoogleService-Info.plist"
   },
   "android": {
     "googleServicesFile": "./google-services.json"
   }
   ```

4. **Testing** (30 min)
   - Test on iOS simulator
   - Test on Android emulator
   - Verify user creation in Firebase

---

### Task 6: Sentry Error Monitoring ⚡ PRIORITY 3
**Status**: Not configured  
**Time Estimate**: 2 hours  

**Actions Required**:
1. **Create Sentry Account** (30 min)
   - Go to https://sentry.io
   - Create organization "TypeB"
   - Create project "typeb-mobile" and "typeb-web"

2. **Get DSN and Auth Token** (15 min)
   - Copy DSN for each project
   - Generate auth token for releases

3. **Mobile App Integration** (45 min)
   - Install: `expo install sentry-expo`
   - Update `typeb-family-app/App.tsx`:
   ```typescript
   import * as Sentry from 'sentry-expo';
   
   Sentry.init({
     dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
     debug: __DEV__,
     environment: __DEV__ ? 'development' : 'production',
   });
   ```

4. **Web App Integration** (30 min)
   - Install: `npm install @sentry/nextjs`
   - Create `apps/web/sentry.client.config.js`:
   ```javascript
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.1,
     environment: process.env.NODE_ENV,
   });
   ```

5. **Configure CI/CD** (30 min)
   - Add to GitHub Secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_DSN`
   - Update `.github/workflows/main.yml` to upload source maps

---

### Task 7: Firebase Security Hardening 🔒
**Status**: Rules exist, need rate limiting  
**Time Estimate**: 2 hours  

**Actions Required**:
1. **Add Rate Limiting Rules** (1 hour)
   Update `apps/web/firestore.rules`:
   ```javascript
   // Add at top of rules
   function rateLimit() {
     let requestCount = get(/databases/$(database)/documents/rate_limits/$(request.auth.uid)).data.count;
     return requestCount == null || requestCount < 100;
   }
   
   // Apply to all write operations
   allow write: if request.auth != null && rateLimit() && ...existing conditions...;
   ```

2. **Add Cloud Function for Rate Limiting** (1 hour)
   Create `functions/src/rateLimit.ts`:
   ```typescript
   export const trackRateLimit = functions.firestore
     .onWrite(async (change, context) => {
       // Increment counter for user
       // Reset counter every minute
     });
   ```

3. **Test Security Rules** (30 min)
   ```bash
   firebase emulators:start
   npm run test:security
   ```

---

### Task 8: Load Testing Setup 📊
**Status**: Not started  
**Time Estimate**: 3 hours  

**Actions Required**:
1. **Create Load Test Script** (2 hours)
   Create `scripts/load-test.js`:
   ```javascript
   import http from 'k6/http';
   import { check, sleep } from 'k6';
   
   export let options = {
     stages: [
       { duration: '2m', target: 100 },
       { duration: '5m', target: 1000 },
       { duration: '2m', target: 0 },
     ],
     thresholds: {
       http_req_duration: ['p(95)<500'],
       http_req_failed: ['rate<0.01'],
     },
   };
   
   export default function() {
     // Test scenarios
     let responses = {
       login: http.post('https://api.typebapp.com/auth/login'),
       getTasks: http.get('https://api.typebapp.com/tasks'),
       createTask: http.post('https://api.typebapp.com/tasks'),
     };
     
     check(responses.login, { 'login successful': (r) => r.status === 200 });
     sleep(1);
   }
   ```

2. **Run Load Tests** (30 min)
   ```bash
   k6 run scripts/load-test.js
   ```

3. **Analyze Results** (30 min)
   - Check p95 latency < 500ms
   - Verify error rate < 1%
   - Monitor Firebase usage

---

### Task 9: E2E Test Verification ✅
**Status**: Tests may exist, need verification  
**Time Estimate**: 2 hours  

**Actions Required**:
1. **Check Existing Tests** (30 min)
   ```bash
   cd typeb-family-app
   ls -la e2e/
   npm run test:e2e
   ```

2. **Update/Fix Tests** (1 hour)
   - Update selectors if UI changed
   - Add COPPA flow tests
   - Add payment flow tests

3. **Add to CI/CD** (30 min)
   Update `.github/workflows/main.yml`:
   ```yaml
   - name: Run E2E Tests
     run: |
       cd typeb-family-app
       npm run test:e2e
   ```

---

### Task 10: Production Deployment 🚀
**Status**: Waiting on tasks 4-9  
**Time Estimate**: 4 hours  

**Prerequisites Checklist**:
- [ ] RevenueCat configured and tested
- [ ] Google SSO working
- [ ] Sentry capturing errors
- [ ] Security rules hardened
- [ ] Load tests passing
- [ ] E2E tests passing

**Deployment Steps**:
1. **Final Testing in Staging** (1 hour)
2. **Update Production Secrets** (30 min)
3. **Deploy Web App** (30 min)
   ```bash
   vercel --prod
   ```
4. **Deploy Firebase Functions** (30 min)
   ```bash
   firebase deploy --only functions,firestore:rules --project production
   ```
5. **Submit iOS App** (1 hour)
   - Build production IPA
   - Submit to App Store Connect
   - Request expedited review
6. **Monitor Metrics** (1 hour)
   - Watch Sentry for errors
   - Monitor Firebase usage
   - Check payment webhooks

---

## 🚨 External Dependencies (Need TODAY)

### Required Accounts
1. **RevenueCat Account**
   - URL: https://www.revenuecat.com
   - Action: Create account and products

2. **Sentry Account**
   - URL: https://sentry.io
   - Action: Create projects and get DSN

3. **Google Cloud Console**
   - URL: https://console.cloud.google.com
   - Action: Enable OAuth and get client IDs

### Required Information
- Firebase Production Project ID
- Support email credentials
- Apple Developer account access
- Domain DNS access (for email)

---

## 📅 Realistic Timeline

### Option 1: Aggressive (3-4 days) 🔥
**Day 1**: RevenueCat + Google SSO  
**Day 2**: Sentry + Security Rules  
**Day 3**: Load Testing + E2E  
**Day 4**: Deploy + Monitor  
**Risk**: High - no buffer for issues  

### Option 2: Safe (5-7 days) ✅ RECOMMENDED
**Day 1**: RevenueCat setup and testing  
**Day 2**: Google SSO implementation  
**Day 3**: Sentry + Security hardening  
**Day 4**: Load testing + optimization  
**Day 5**: E2E testing + fixes  
**Day 6**: Staging deployment + testing  
**Day 7**: Production deployment  
**Risk**: Low - time for fixes  

### Option 3: Phased Launch (7+ days) 🎯
**Week 1**: Core infrastructure (Tasks 4-7)  
**Week 2**: Testing and deployment (Tasks 8-10)  
**Benefit**: Can do soft launch with beta users  

---

## 🎯 Success Metrics

### Launch Criteria
- [ ] Zero P0 bugs
- [ ] <500ms API latency (p95)
- [ ] <1% error rate
- [ ] Payment flow working
- [ ] COPPA compliant
- [ ] Support channel active

### Post-Launch Monitoring (First 24 Hours)
- Error rate stays <1%
- No payment failures
- User signups working
- No security breaches
- App Store approval

---

## 📞 Escalation Contacts

| Role | Name | Contact | When to Contact |
|------|------|---------|-----------------|
| Tech Lead | TBD | email/slack | Code issues |
| Product Owner | TBD | email/slack | Feature decisions |
| Legal | TBD | email | COPPA questions |
| RevenueCat Support | Support | dashboard | Payment issues |
| Firebase Support | Support | console | Backend issues |

---

## 🔄 Rollback Plan

If critical issues occur post-deployment:

1. **Web App**: Revert Vercel deployment (1 min)
2. **Firebase Rules**: Deploy previous rules (2 min)
3. **Cloud Functions**: Deploy previous version (5 min)
4. **iOS App**: Cannot rollback, must submit fix
5. **Communications**: Email users about issue

---

## 📝 Final Notes

### Critical Success Factors
1. **Get external accounts TODAY** - This is the biggest blocker
2. **Test payments thoroughly** - Revenue critical
3. **Have rollback ready** - Minimize downtime
4. **Monitor actively** - First 24 hours crucial

### Recommended Approach
Given the current 70% completion and need for external accounts, I recommend:
- **5-7 day timeline** for safe launch
- **Focus on P0 items only**
- **Soft launch to 100 beta users first**
- **Defer Android to post-launch**

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: Daily at 9 AM