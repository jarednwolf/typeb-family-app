# TypeB Web App Deployment Guide

## Deploying to Vercel

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

### Step 1: Push to Git Repository
```bash
git add .
git commit -m "Initial TypeB web app"
git push origin main
```

### Step 2: Import to Vercel

#### Option A: Using Vercel CLI
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy from the web app directory:
```bash
cd apps/web
vercel
```

3. Follow the prompts:
   - Link to existing project or create new
   - Select the `apps/web` directory
   - Use the detected Next.js framework settings

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure the project:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js
   - **Build Command**: `cd ../.. && pnpm build --filter=web`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables

In Vercel Dashboard, go to Settings → Environment Variables and add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 4: Deploy
- Vercel will automatically deploy on every push to main branch
- Preview deployments are created for pull requests

## Custom Domain Setup

1. In Vercel Dashboard, go to Settings → Domains
2. Add your domain (e.g., `typebapp.com`)
3. Configure DNS records as instructed by Vercel

## Production Considerations

### Security
- [ ] Enable Firebase App Check
- [ ] Configure Firebase Security Rules
- [ ] Set up proper CORS policies
- [ ] Enable rate limiting

### Performance
- [ ] Enable Next.js Image Optimization
- [ ] Configure caching headers
- [ ] Set up CDN for static assets
- [ ] Enable Vercel Analytics

### Monitoring
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure Firebase Performance Monitoring

## Build Commands

### Local Build Test
```bash
# Build all packages
pnpm build

# Build only web app
pnpm build --filter=web

# Build with type checking
pnpm type-check && pnpm build
```

### Production Build
```bash
# Clean build
pnpm clean && pnpm install && pnpm build

# Build and analyze bundle
cd apps/web && pnpm build && pnpm analyze
```

## Troubleshooting

### Build Failures
1. Check Node.js version (should be 18.x or higher)
2. Clear cache: `pnpm store prune`
3. Delete node_modules and reinstall: `rm -rf node_modules && pnpm install`

### Environment Variables Not Working
1. Ensure variables start with `NEXT_PUBLIC_` for client-side access
2. Rebuild after adding new variables
3. Check Vercel dashboard for correct values

### Monorepo Issues
1. Ensure `pnpm-workspace.yaml` is in root
2. Check that Turborepo is configured correctly
3. Verify package dependencies use workspace protocol

## CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
          
      - run: pnpm install
      - run: pnpm build --filter=web
      - run: pnpm test --filter=web
      
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/web
```

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Review Next.js deployment guide: https://nextjs.org/docs/deployment
- Check monorepo setup: https://turbo.build/repo/docs