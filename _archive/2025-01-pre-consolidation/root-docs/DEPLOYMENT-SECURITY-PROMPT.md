# TypeB Family App - Production Deployment & Security Configuration

## Project Context
You are working on the TypeB Family App, a monorepo project with a React Native mobile app and a Next.js web application. The web app has been built and is ready for production deployment. The repository is hosted at: https://github.com/jarednwolf/typeb-family-app

## Current State
- ✅ Monorepo structure with pnpm workspaces
- ✅ Next.js web app in `apps/web/` 
- ✅ Firebase integration configured
- ✅ Authentication system implemented
- ✅ Dashboard and task management features
- ✅ API keys removed from documentation
- ⚠️ Firebase API keys need restrictions
- ⚠️ Firebase Security Rules need configuration
- ⚠️ Vercel deployment pending

## Objectives
Complete the production deployment with proper security configurations using CLI/SDK tools where possible for efficiency.

## Task List

### Phase 1: Firebase Security Configuration

#### 1.1 Configure API Key Restrictions
Using Google Cloud SDK (`gcloud`) or Firebase CLI:
- List current API keys for project `typeb-family-app`
- Add HTTP referrer restrictions for:
  - `https://typebapp.com/*`
  - `https://*.typebapp.com/*`
  - `https://*.vercel.app/*`
  - `http://localhost:3000/*` (for development)
- Verify restrictions are applied

Reference: The Firebase project ID is `typeb-family-app`

#### 1.2 Configure Firebase Security Rules
Create and deploy production-ready security rules for Firestore and Storage.

**Firestore Rules Requirements:**
- Users can only read/write their own user document
- Family members can read/write shared family data
- Task validation based on user roles (parent/child)
- Protect sensitive fields like subscription status

**Storage Rules Requirements:**
- Users can only upload to their family's folder
- Size limits for photo uploads (max 10MB)
- Only image files allowed for task photos
- Read access limited to family members

Reference files:
- Current test rules may be in Firebase Console
- App structure in `typeb-family-app/src/services/`

### Phase 2: Vercel Deployment

#### 2.1 Install and Configure Vercel CLI
```bash
npm i -g vercel
vercel login
```

#### 2.2 Deploy Web Application
From the monorepo root:
```bash
cd apps/web
vercel --prod
```

Configuration needed:
- Root Directory: `apps/web`
- Framework: Next.js
- Build Command: `cd ../.. && pnpm build --filter=web`
- Install Command: `pnpm install`
- Output Directory: `.next`

#### 2.3 Configure Environment Variables
Set these environment variables in Vercel (use values from `apps/web/.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

#### 2.4 Configure Custom Domain (if available)
- Add `typebapp.com` or subdomain to Vercel project
- Configure DNS settings

### Phase 3: Post-Deployment Verification

#### 3.1 Security Verification
- Test API key restrictions by attempting unauthorized access
- Verify Firebase Security Rules are enforcing properly
- Check browser console for any exposed sensitive data

#### 3.2 Functionality Testing
- Test user registration and login
- Verify dashboard loads with proper data
- Test task creation and management
- Verify image upload functionality

#### 3.3 Performance Optimization
- Enable Vercel Analytics
- Configure caching headers
- Verify Next.js optimizations are working

## File References

### Key Configuration Files:
- `apps/web/vercel.json` - Vercel configuration
- `apps/web/.env.local` - Environment variables (DO NOT COMMIT)
- `apps/web/.env.example` - Environment variable template
- `apps/web/src/lib/firebase/config.ts` - Firebase initialization

### Documentation to Reference:
- `GIT-SETUP.md` - Contains Vercel deployment section
- `docs/firebase-setup-guide.md` - Firebase configuration details
- `DEPLOYMENT.md` - General deployment guidelines

## Security Checklist
- [ ] API keys have HTTP referrer restrictions
- [ ] Firebase Security Rules deployed for Firestore
- [ ] Firebase Security Rules deployed for Storage  
- [ ] Environment variables configured in Vercel
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced on all domains
- [ ] Firebase App Check enabled (optional but recommended)

## CLI Commands Reference

### Google Cloud SDK
```bash
# Install gcloud CLI if not present
curl https://sdk.cloud.google.com | bash

# Authenticate
gcloud auth login

# Set project
gcloud config set project typeb-family-app

# List API keys
gcloud services api-keys list

# Add restrictions to API key
gcloud services api-keys update KEY_ID \
  --allowed-referrers="https://typebapp.com/*,https://*.vercel.app/*"
```

### Firebase CLI
```bash
# Install Firebase CLI if not present
npm install -g firebase-tools

# Login
firebase login

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy with environment variables
vercel --prod --env-file=.env.local

# Link to existing project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
```

## Expected Outcomes
1. Web app deployed and accessible at Vercel URL
2. Firebase API keys protected with referrer restrictions
3. Database and storage protected with security rules
4. All features working in production environment
5. No security warnings from Google

## Notes
- The GitHub PAT for pushing changes: Use when needed for git operations
- Firebase project: `typeb-family-app`
- Current local dev server may be running on port 3000
- The monorepo uses pnpm workspaces

## Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Google Cloud API Keys](https://cloud.google.com/docs/authentication/api-keys)

---

Use this prompt to guide the deployment and security configuration process. Focus on CLI/SDK automation where possible to maintain efficiency.