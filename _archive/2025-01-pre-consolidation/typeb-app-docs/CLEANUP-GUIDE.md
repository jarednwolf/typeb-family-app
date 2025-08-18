# TypeB Family App - Cleanup Guide

## Files & Directories to Clean/Remove

### Temporary Files to Remove
```bash
# Remove these temporary/test files if they exist
rm -rf typeb-family-app/artifacts/           # E2E test artifacts
rm -f typeb-family-app/firestore-debug.log   # Firestore debug logs
rm -f typeb-family-app/test-ids-report.json  # Test ID reports
rm -rf typeb-family-app/.expo/               # Expo cache (if exists)
```

### Files to Keep But Not Commit
These should be in .gitignore:
- `.env`
- `.env.production`
- `firebase-service-account.json`
- `*.log`
- `.DS_Store`
- `node_modules/`
- `ios/Pods/`
- `ios/build/`
- `android/build/`

### Old Documentation to Archive
Move these to `/docs/archive/` if they're outdated:
- Old build guides
- Previous submission attempts
- Deprecated feature docs

### Build Artifacts to Clean
```bash
# iOS
cd ios && xcodebuild clean && cd ..

# Android (when ready)
cd android && ./gradlew clean && cd ..

# Metro bundler cache
npx expo start --clear

# Watchman cache
watchman watch-del-all

# NPM cache
npm cache clean --force
```

## Recommended .gitignore Updates

Add these entries if not already present:

```gitignore
# Environment files
.env
.env.*
!.env.example
!.env.production.example

# Firebase
firebase-service-account.json
firestore-debug.log
firebase-debug.log
ui-debug.log
firestore-*.log

# Test artifacts
artifacts/
coverage/
test-ids-report.json
e2e-results/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build files
dist/
build/
*.ipa
*.apk
*.aab

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
*.tmp
*.temp
.cache/

# iOS
ios/Pods/
ios/build/
ios/*.xcworkspace/xcuserdata/
ios/*.xcodeproj/xcuserdata/

# Android
android/build/
android/app/build/
android/.gradle/
android/local.properties

# Expo
.expo/
.expo-shared/
web-build/

# Node
node_modules/
npm-debug.log
yarn-error.log

# Testing
coverage/
.nyc_output/

# Misc
.firebase/
.firebaserc
```

## Clean Commands Script

Create this as `/scripts/clean-project.sh`:

```bash
#!/bin/bash

echo "🧹 Cleaning TypeB Family App..."

# Remove temporary files
echo "Removing temporary files..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
find . -name "*.tmp" -type f -delete

# Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf artifacts/
rm -rf coverage/
rm -rf dist/
rm -rf build/

# Clean iOS
if [ -d "ios" ]; then
  echo "Cleaning iOS build..."
  cd ios
  xcodebuild clean -quiet
  rm -rf build/
  cd ..
fi

# Clean Android
if [ -d "android" ]; then
  echo "Cleaning Android build..."
  cd android
  ./gradlew clean --quiet 2>/dev/null || true
  cd ..
fi

# Clean node modules (optional - uncomment if needed)
# echo "Cleaning node_modules..."
# rm -rf node_modules/
# npm install

# Clear caches
echo "Clearing caches..."
npx expo start --clear 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# Remove test artifacts
echo "Removing test artifacts..."
rm -f test-ids-report.json
rm -rf e2e-results/

echo "✅ Cleanup complete!"
echo ""
echo "To do a deep clean (including node_modules):"
echo "  rm -rf node_modules && npm install"
echo ""
echo "To reset iOS pods:"
echo "  cd ios && pod deintegrate && pod install"
```

## Regular Maintenance Schedule

### Daily (During Development)
- Clear Metro cache if experiencing issues
- Remove .log files

### Weekly
- Run cleanup script
- Clear build artifacts
- Review and archive old documents

### Before Each Release
- Full cleanup including node_modules
- Reset iOS pods
- Clear all caches
- Archive old documentation
- Update .gitignore if needed

### Monthly
- Review disk usage
- Clean old simulator builds
- Archive old test results
- Clean npm/yarn cache

## Disk Space Recovery

If running low on disk space:

```bash
# Check project size
du -sh typeb-family-app/

# Find large files
find . -type f -size +10M

# Clean everything
rm -rf node_modules ios/Pods android/build
npm install
cd ios && pod install && cd ..

# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean simulator caches
xcrun simctl delete unavailable
```

## Git Cleanup

```bash
# Remove untracked files (careful!)
git clean -fd

# Remove ignored files
git clean -fX

# Optimize repository
git gc --aggressive --prune=now

# Check repository size
git count-objects -vH
```

---

**Note**: Always commit important changes before running cleanup commands!