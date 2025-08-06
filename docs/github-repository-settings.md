# GitHub Repository Settings Guide

**Repository**: https://github.com/jarednwolf/typeb-family-app

## 🔒 Recommended Security Settings

### 1. Branch Protection Rules
Navigate to: Settings → Branches → Add rule

**For `main` branch:**
- ✅ Require a pull request before merging (once you have collaborators)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Include administrators
- ✅ Do not allow bypassing the above settings

### 2. Secrets Management
Navigate to: Settings → Secrets and variables → Actions

**Add these secrets:**
- `EXPO_TOKEN` - For EAS Build automation (get from Expo dashboard)
- `FIREBASE_SERVICE_ACCOUNT` - For CI/CD Firebase deployments
- `APP_STORE_CONNECT_API_KEY` - For automated TestFlight uploads

**Never commit:**
- `.env` files (already in .gitignore)
- Firebase service account keys
- Apple certificates or provisioning profiles

### 3. Security Tab
Navigate to: Settings → Security

- ✅ Enable Dependabot security updates
- ✅ Enable secret scanning
- ✅ Enable push protection for secrets

## 📝 Repository Information

### Description
Add this description to your repo:
```
TypeB Family App - Smart task management for families. More than checking the box.
```

### Topics
Add these topics for discoverability:
- `react-native`
- `expo`
- `firebase`
- `typescript`
- `family`
- `task-management`
- `ios`

### Website
Add when available: `https://typeb.app`

## 🚀 GitHub Actions (Future)

### Recommended Workflows
Create `.github/workflows/` directory for:

1. **CI Pipeline** (`ci.yml`)
   - Run on every push and PR
   - Install dependencies
   - Run TypeScript checks
   - Run ESLint
   - Run tests (when added)

2. **EAS Build** (`eas-build.yml`)
   - Trigger on release tags
   - Build iOS app
   - Submit to TestFlight

## 📋 Issue Templates

### Create `.github/ISSUE_TEMPLATE/`

1. **Bug Report** (`bug_report.md`)
2. **Feature Request** (`feature_request.md`)
3. **Task** (`task.md`)

## 🏷️ Labels

Recommended labels to create:
- `phase-1` through `phase-7` - Track development phases
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `firebase` - Firebase related
- `ios` - iOS specific
- `auth` - Authentication related
- `ui` - User interface
- `critical` - P0 priority
- `high` - P1 priority
- `medium` - P2 priority
- `low` - P3 priority

## 👥 Collaborator Settings

When adding collaborators:
- Start with `Triage` permission
- Upgrade to `Write` for active developers
- Keep `Admin` limited to project owners

## 📊 Insights Configuration

### Enable these in Insights:
- Dependency graph
- Code frequency
- Commit activity
- Contributors

## 🔄 Integrations

### Recommended integrations:
1. **Slack/Discord** - For commit notifications
2. **Linear/Jira** - For issue tracking
3. **Sentry** - For error tracking (Phase 6)
4. **Firebase** - For deployment notifications

## ⚙️ General Settings

Navigate to: Settings → General

- **Features:**
  - ✅ Issues
  - ✅ Projects (for kanban board)
  - ❌ Wiki (use docs folder instead)
  - ✅ Discussions (for community feedback)

- **Pull Requests:**
  - ✅ Allow squash merging
  - ✅ Allow rebase merging
  - ❌ Allow merge commits
  - ✅ Automatically delete head branches

## 🚫 Files to Never Commit

Already in `.gitignore`:
- `.env`
- `node_modules/`
- `.expo/`
- `dist/`
- `*.log`
- `.DS_Store`
- `*.pem`
- `*.p8`
- `*.p12`
- `*.key`
- `*.mobileprovision`
- `*.orig.*`

## 📱 Mobile App Specific

### iOS Build Artifacts
Never commit:
- `ios/build/`
- `ios/Pods/`
- `*.xcworkspace` (except the one in ios/)
- `*.ipa`

### Android Build Artifacts (Future)
Never commit:
- `android/build/`
- `android/app/build/`
- `*.apk`
- `*.aab`

## 🔐 Security Best Practices

1. **API Keys**: Always use environment variables
2. **Sensitive Data**: Never log user passwords or tokens
3. **Dependencies**: Review and update regularly
4. **Code Reviews**: Implement for all PRs (when team grows)
5. **Secrets Rotation**: Rotate API keys quarterly

## 📈 Repository Maintenance

### Weekly Tasks:
- Review and merge Dependabot PRs
- Check for security alerts
- Update dependencies if needed

### Monthly Tasks:
- Review and close stale issues
- Update documentation
- Check Firebase usage and costs

### Per Phase:
- Tag releases (e.g., `v1.0.0-phase1`)
- Create GitHub release notes
- Update README with latest features

## 🎯 Current Status

- **Phase 1**: ✅ Complete - Authentication implemented
- **Repository**: Public (consider private until launch)
- **Default Branch**: `main`
- **License**: Not yet added (add MIT or proprietary)
- **README**: Basic version exists (enhance over time)

## 📞 Support

For repository issues or questions:
- Create an issue in the repo
- Tag with appropriate labels
- Assign to @jarednwolf

---

**Last Updated**: January 6, 2025
**Next Review**: After Phase 2 completion