# Git Repository Setup Instructions

## Creating a GitHub Repository

### Step 1: Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `typeb-family-app`
3. Description: "TypeB Family Task Management App - React Native + Firebase"
4. Set to **Private** (recommended for now)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### Step 2: Connect Local Repository to GitHub
After creating the repository on GitHub, run these commands:

```bash
cd typeb-family-app

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/typeb-family-app.git

# Push the code and tags
git push -u origin main
git push origin --tags
```

### Step 3: Verify Upload
1. Go to your repository: https://github.com/YOUR_USERNAME/typeb-family-app
2. Check that all files are uploaded
3. Verify the tag `v1.0.1` is visible under "Releases"

## Repository Settings (Recommended)

### Branch Protection
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews before merging
   - Dismiss stale pull request approvals
   - Require status checks to pass

### Secrets for GitHub Actions
Go to Settings → Secrets and variables → Actions, add:
- `EXPO_TOKEN`: Your Expo access token
- `FIREBASE_TOKEN`: Your Firebase CI token
- `SENTRY_AUTH_TOKEN`: Your Sentry auth token (when you have it)

### Collaborators
If working with a team:
1. Go to Settings → Manage access
2. Click "Invite a collaborator"
3. Add team members by username

## Important Files to Never Commit

The `.gitignore` is already configured to exclude:
- `.env` files (except examples)
- `node_modules/`
- Build artifacts
- API keys and secrets

## Current Repository Status

- **Latest Commit**: Production Launch Preparation - v1.0.1
- **Tag**: v1.0.1 (Production Ready)
- **Total Commits**: 2
- **Files**: 283+
- **Ready for**: GitHub upload

## Quick Commands Reference

```bash
# Check current status
git status

# View commit history
git log --oneline

# Create a new branch for features
git checkout -b feature/your-feature-name

# Push changes
git push origin main

# Pull latest changes
git pull origin main
```

## Next Steps After GitHub Setup

1. ✅ Repository created and code pushed
2. ✅ Tag v1.0.1 visible
3. 📋 Create RevenueCat and Sentry accounts
4. 📋 Update `.env.production` with API keys
5. 📋 Build and deploy with EAS

---

*Remember: Never commit sensitive data like API keys or passwords!*