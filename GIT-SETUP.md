# Git Repository Setup Guide

## Current Status
✅ Local repository initialized and committed
❌ No remote repository configured

## Setting Up Remote Repository

### Option 1: GitHub

1. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name: `typeb-family-app` (or your preferred name)
   - Keep it private if desired
   - Don't initialize with README (you already have files)

2. **Add the remote origin**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/typeb-family-app.git
```

3. **Push your code**:
```bash
git branch -M main
git push -u origin main
```

### Option 2: GitLab

1. **Create a new project on GitLab**:
   - Go to https://gitlab.com/projects/new
   - Name your project
   - Set visibility level

2. **Add the remote**:
```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/typeb-family-app.git
git push -u origin main
```

### Option 3: Bitbucket

1. **Create repository on Bitbucket**:
   - Go to https://bitbucket.org/repo/create
   - Name your repository
   - Choose access level

2. **Add remote and push**:
```bash
git remote add origin https://YOUR_USERNAME@bitbucket.org/YOUR_USERNAME/typeb-family-app.git
git push -u origin main
```

## Vercel Deployment (After Git Setup)

Once your repository is on GitHub/GitLab/Bitbucket:

### Automatic Deployment via Vercel Dashboard

1. **Go to Vercel**:
   - Visit https://vercel.com/new
   - Sign in with your GitHub/GitLab/Bitbucket account

2. **Import Project**:
   - Click "Import Git Repository"
   - Select your `typeb-family-app` repository
   - Configure:
     - Root Directory: `apps/web`
     - Framework Preset: Next.js (auto-detected)
     - Build Command: `cd ../.. && pnpm build --filter=web`
     - Install Command: `pnpm install`

3. **Add Environment Variables**:
   In Vercel dashboard, add these environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB7J0bv6LIADDlgCWj_ZkovFON-gaoGt5w
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=typeb-family-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=typeb-family-app
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=typeb-family-app.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1030430696382
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1030430696382:web:31fd0b7449fe8d9a098fef
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a URL like: `https://your-app.vercel.app`

### Manual Deployment via CLI (Alternative)

If you prefer CLI deployment without Git:

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy from web directory**:
```bash
cd apps/web
vercel
```

3. **Follow prompts**:
   - Set up and deploy? Yes
   - Which scope? (select your account)
   - Link to existing project? No
   - Project name? typeb-web
   - Directory? ./
   - Override settings? No

4. **Production deployment**:
```bash
vercel --prod
```

## Checking Remote Status

To see current remote configuration:
```bash
git remote -v
```

To change remote URL if needed:
```bash
git remote set-url origin NEW_URL
```

## Your Local Git Config

To set your git identity globally:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

To fix the last commit's author:
```bash
git commit --amend --reset-author
```

## Next Steps

1. ✅ Create a repository on GitHub/GitLab/Bitbucket
2. ✅ Add remote origin to your local repository
3. ✅ Push your code to the remote repository
4. ✅ Connect Vercel to your repository
5. ✅ Deploy to production

Your app will then be live and automatically redeploy on every push to main!