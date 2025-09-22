# CI/CD Pipeline Setup Guide

**CRITICAL**: This is a P0 blocker for production. Must be implemented before launch.

## Overview

This guide sets up a complete CI/CD pipeline using GitHub Actions for automated testing, building, and deployment of TypeB applications.

## Pipeline Architecture

```
┌─────────────┐     ┌──────────┐     ┌───────────┐     ┌────────────┐
│   Commit    │────▶│   Test   │────▶│   Build   │────▶│   Deploy   │
└─────────────┘     └──────────┘     └───────────┘     └────────────┘
       │                  │                 │                  │
       ▼                  ▼                 ▼                  ▼
   GitHub Push      Run Jest Tests     Build Apps        Vercel/Firebase
                    Type Checking      Create Artifacts    EAS Build
                    Lint & Format      Docker Images      App Stores
```

## Step 1: GitHub Actions Setup

### Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### Main CI/CD Workflow

Create `.github/workflows/main.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  # Job 1: Code Quality Checks
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run TypeScript checks
        run: pnpm type-check
        
      - name: Run linter
        run: pnpm lint
        
      - name: Check formatting
        run: pnpm format:check

  # Job 2: Test Suite
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: quality
    strategy:
      matrix:
        test-suite: [unit, integration]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run ${{ matrix.test-suite }} tests
        run: pnpm test:${{ matrix.test-suite }}
        
      - name: Upload coverage
        if: matrix.test-suite == 'unit'
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info

  # Job 3: Security Scanning
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
          
      - name: Run npm audit
        run: pnpm audit --audit-level=high

  # Job 4: Build Applications
  build:
    name: Build Applications
    runs-on: ubuntu-latest
    needs: [quality, test]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    strategy:
      matrix:
        app: [web, mobile]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build packages
        run: pnpm build:packages
        
      - name: Build ${{ matrix.app }}
        run: pnpm build:${{ matrix.app }}
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-build
          path: |
            apps/web/.next/
            typeb-family-app/dist/
          retention-days: 7

  # Job 5: Deploy Web to Vercel
  deploy-web:
    name: Deploy Web to Vercel
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Deploy to Vercel
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          
      - name: Comment deployment URL
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Deployed to Vercel: ${{ steps.deploy.outputs.url }}'
            })

  # Job 6: Deploy Firebase
  deploy-firebase:
    name: Deploy Firebase Services
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
        
      - name: Select Firebase project
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            firebase use typeb-family-app --token ${{ secrets.FIREBASE_TOKEN }}
          else
            firebase use typeb-family-app-staging --token ${{ secrets.FIREBASE_TOKEN }}
          fi
          
      - name: Deploy Firestore rules
        run: firebase deploy --only firestore:rules --token ${{ secrets.FIREBASE_TOKEN }}
        
      - name: Deploy Storage rules
        run: firebase deploy --only storage:rules --token ${{ secrets.FIREBASE_TOKEN }}
        
      - name: Deploy Cloud Functions
        run: firebase deploy --only functions --token ${{ secrets.FIREBASE_TOKEN }}

  # Job 7: Mobile Build Trigger
  trigger-mobile-build:
    name: Trigger Mobile Build
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Trigger EAS Build
        run: |
          curl -X POST https://api.expo.dev/v2/projects/${{ secrets.EXPO_PROJECT_ID }}/builds \
            -H "Authorization: Bearer ${{ secrets.EXPO_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "platform": "ios",
              "profile": "production",
              "message": "Build triggered by GitHub Actions"
            }'

  # Job 8: E2E Tests (Optional)
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: deploy-web
    if: github.ref == 'refs/heads/staging'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ needs.deploy-web.outputs.url }}
```

## Step 2: Environment-Specific Workflows

### Production Deployment Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true
        type: string

jobs:
  pre-deployment:
    name: Pre-deployment Checks
    runs-on: ubuntu-latest
    steps:
      - name: Check staging health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://staging.typebapp.com/api/health)
          if [ $response != "200" ]; then
            echo "Staging is not healthy"
            exit 1
          fi
          
      - name: Run smoke tests on staging
        run: |
          # Run critical path tests
          pnpm test:smoke --url=https://staging.typebapp.com

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: pre-deployment
    environment:
      name: production
      url: https://typebapp.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}
          
      - name: Deploy to production
        # Production deployment steps
        
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ inputs.version }} completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Rollback Workflow

Create `.github/workflows/rollback.yml`:

```yaml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      deployment_id:
        description: 'Deployment ID to rollback to'
        required: true
        type: string

jobs:
  rollback:
    name: Rollback Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Rollback Vercel
        run: |
          vercel rollback ${{ inputs.deployment_id }} --token ${{ secrets.VERCEL_TOKEN }}
          
      - name: Rollback Firebase
        run: |
          # Implement Firebase rollback logic
          
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: 'custom'
          custom_payload: |
            {
              text: "⚠️ Production rollback to ${{ inputs.deployment_id }} completed"
            }
```

## Step 3: Repository Secrets Setup

### Required GitHub Secrets

Add these in Settings → Secrets and variables → Actions:

```bash
# Vercel
VERCEL_TOKEN          # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         # Get from Vercel project settings
VERCEL_PROJECT_ID     # Get from Vercel project settings

# Firebase
FIREBASE_TOKEN        # Run: firebase login:ci
FIREBASE_PROJECT_PROD # typeb-family-app
FIREBASE_PROJECT_STAG # typeb-family-app-staging

# Expo/EAS
EXPO_TOKEN           # Get from https://expo.dev/accounts/[account]/settings/access-tokens
EXPO_PROJECT_ID      # Get from app.json

# Monitoring
SENTRY_AUTH_TOKEN    # Get from Sentry settings
CODECOV_TOKEN        # Get from Codecov
SNYK_TOKEN          # Get from Snyk

# Notifications
SLACK_WEBHOOK        # Get from Slack app settings
```

### Setting Secrets via CLI

```bash
# Using GitHub CLI
gh secret set VERCEL_TOKEN --body "your-token-here"
gh secret set FIREBASE_TOKEN --body "$(firebase login:ci)"

# List all secrets
gh secret list
```

## Step 4: Branch Protection Rules

### Configure in GitHub Settings

1. Go to Settings → Branches
2. Add rule for `main` branch:

```yaml
Required status checks:
  - quality
  - test (unit)
  - test (integration)
  - security
  - build (web)
  - build (mobile)

Required reviews:
  - At least 1 approval
  - Dismiss stale reviews
  - Require review from CODEOWNERS

Other:
  - Require branches to be up to date
  - Include administrators
  - Restrict who can push (only CI)
```

## Step 5: Package.json Scripts

Update `package.json` with CI scripts:

```json
{
  "scripts": {
    "ci:install": "pnpm install --frozen-lockfile",
    "ci:test": "pnpm test --ci --coverage",
    "ci:build": "pnpm build",
    "ci:lint": "pnpm lint",
    "ci:type-check": "pnpm type-check",
    "ci:audit": "pnpm audit --audit-level=high",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:smoke": "jest --testPathPattern=smoke"
  }
}
```

## Step 6: Monitoring & Notifications

### Slack Integration

```yaml
# Add to any job for notifications
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      Workflow: ${{ github.workflow }}
      Job: ${{ github.job }}
      Status: ${{ job.status }}
      Branch: ${{ github.ref }}
      Commit: ${{ github.sha }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Status Badges

Add to README.md:

```markdown
![CI/CD](https://github.com/[org]/typeb/actions/workflows/main.yml/badge.svg)
![Coverage](https://codecov.io/gh/[org]/typeb/branch/main/graph/badge.svg)
![Security](https://snyk.io/test/github/[org]/typeb/badge.svg)
```

## Step 7: Local Testing

### Act for Local GitHub Actions Testing

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Test workflows locally
act -j quality
act -j test
act push -W .github/workflows/main.yml
```

## Deployment Strategy

### Environments

| Environment | Branch | Auto-Deploy | Approval | URL |
|-------------|--------|-------------|----------|-----|
| Development | develop | Yes | No | localhost |
| Staging | staging | Yes | No | staging.typebapp.com |
| Production | main | No | Yes | typebapp.com |

### Deployment Flow

```
develop → staging → main
   ↓         ↓        ↓
  Dev     Staging  Production
```

## Rollback Strategy

### Automatic Rollback Triggers
- Error rate >5%
- Response time >2000ms
- Health check failures
- Critical alerts

### Manual Rollback Process
1. Trigger rollback workflow
2. Specify deployment ID
3. Confirm in production environment
4. Monitor metrics
5. Notify team

## Cost Optimization

### GitHub Actions Minutes
- Free: 2,000 minutes/month
- Pro: 3,000 minutes/month

### Optimization Tips
1. Use matrix builds wisely
2. Cache dependencies
3. Skip unnecessary jobs
4. Use self-hosted runners for heavy tasks

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Workflow not triggering | Check branch protection and triggers |
| Secrets not available | Verify secret names and environment |
| Build failing | Check logs and dependencies |
| Deploy failing | Verify credentials and permissions |

## Monitoring Dashboard

### Key Metrics
- Build success rate
- Average build time
- Deployment frequency
- Lead time for changes
- Mean time to recovery

### Tools
- GitHub Actions insights
- Vercel Analytics
- Firebase Performance
- Custom dashboard (Grafana)

---

**Critical**: Complete this setup before attempting production deployment.

**Last Updated**: January 2025  
**Owner**: DevOps Team  
**Support**: #ci-cd-help on Slack