# TypeB Family App - Production Deployment Guide

## 🚀 Current Production Status

**Live URL:** https://typebapp.com  
**Status:** ✅ Deployed and Operational  
**Last Deployment:** August 16, 2025  

## 📋 Deployment Configuration

### Vercel Settings
- **Framework:** Next.js 15.4.6
- **Root Directory:** `apps/web`
- **Build Command:** `pnpm build`
- **Output Directory:** `.next`
- **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`

### Environment Variables (Configured in Vercel)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

## 🔒 Security Configuration

### Firebase API Key Restrictions
- **HTTP Referrers:** 
  - https://typebapp.com/*
  - https://www.typebapp.com/*
  - https://*.vercel.app/*
  - http://localhost:3000/*
  - http://localhost:3001/*

### Firestore Security Rules
- User authentication required
- Family-based access control
- Role-based permissions (parent/child)
- Data validation rules

### Storage Security Rules
- File size limits (10MB general, 5MB profiles)
- File type validation
- User authentication required

## 🌐 Domain Configuration

### Primary Domain
- **Domain:** typebapp.com
- **DNS Provider:** Porkbun
- **A Record:** 76.76.21.21
- **SSL:** Active via Vercel

### Subdomain (Pending)
- **Domain:** www.typebapp.com
- **Required:** CNAME → cname.vercel-dns.com

## 📦 Deployment Commands

### Local Development
```bash
# Web development
pnpm dev:web

# Mobile development
pnpm dev:mobile

# All services
pnpm dev
```

### Production Deployment
```bash
# Deploy to production
vercel --prod --archive=tgz

# Deploy from apps/web directory
cd apps/web && vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

## 🔧 Troubleshooting

### Common Issues

1. **404 on Custom Domain**
   - Check DNS propagation: `nslookup typebapp.com`
   - Verify domain in Vercel Dashboard
   - Run diagnostic: `./fix-domain-issue.sh`

2. **Build Failures**
   - Ensure Node.js >=18.0.0
   - Clear cache: `rm -rf .next node_modules`
   - Reinstall: `pnpm install --frozen-lockfile`

3. **Environment Variables**
   - Verify in Vercel Dashboard → Settings → Environment Variables
   - Ensure all NEXT_PUBLIC_ variables are set

## 📊 Monitoring

### Vercel Dashboard
- **URL:** https://vercel.com/jareds-projects-247fc15d/tybeb_b
- **Analytics:** Real-time performance metrics
- **Logs:** Deployment and runtime logs

### Firebase Console
- **URL:** https://console.firebase.google.com
- **Firestore:** Database usage and rules
- **Storage:** File storage metrics
- **Authentication:** User management

## 🚦 Health Checks

```bash
# Check main domain
curl -I https://typebapp.com

# Check deployment URL
curl -I https://tybeb-cxvo2aflm-jareds-projects-247fc15d.vercel.app

# Check API health
curl https://typebapp.com/api/health
```

## 📝 Deployment Checklist

- [ ] Run tests: `pnpm test`
- [ ] Build locally: `pnpm build:web`
- [ ] Check environment variables
- [ ] Deploy to production: `vercel --prod --archive=tgz`
- [ ] Verify deployment: Check live URL
- [ ] Monitor logs: Check for errors
- [ ] Test critical paths: Login, signup, core features

## 🔄 Rollback Procedure

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]

# Or redeploy from specific commit
git checkout [commit-hash]
vercel --prod --archive=tgz
```

## 📞 Support Contacts

- **Vercel Support:** https://vercel.com/support
- **Firebase Support:** https://firebase.google.com/support
- **DNS (Porkbun):** https://porkbun.com/support

---

Last Updated: August 16, 2025