#!/bin/bash

echo "🧹 Cleaning TypeB Family App..."

# Remove temporary files
echo "Removing temporary files..."
find . -name "*.log" -type f -delete 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null
find . -name "*.tmp" -type f -delete 2>/dev/null

# Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf artifacts/ 2>/dev/null
rm -rf coverage/ 2>/dev/null
rm -rf dist/ 2>/dev/null
rm -rf build/ 2>/dev/null

# Clean iOS
if [ -d "ios" ]; then
  echo "Cleaning iOS build..."
  cd ios
  xcodebuild clean -quiet 2>/dev/null || true
  rm -rf build/ 2>/dev/null
  cd ..
fi

# Clean Android
if [ -d "android" ]; then
  echo "Cleaning Android build..."
  cd android
  ./gradlew clean --quiet 2>/dev/null || true
  cd ..
fi

# Clear caches
echo "Clearing caches..."
npx expo start --clear 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# Remove test artifacts
echo "Removing test artifacts..."
rm -f test-ids-report.json 2>/dev/null
rm -rf e2e-results/ 2>/dev/null
rm -f firestore-debug.log 2>/dev/null
rm -f firebase-debug.log 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "To do a deep clean (including node_modules):"
echo "  rm -rf node_modules && npm install"
echo ""
echo "To reset iOS pods:"
echo "  cd ios && pod deintegrate && pod install"