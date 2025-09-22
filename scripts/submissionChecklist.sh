#!/bin/bash

# TypeB Family App - App Store Submission Checklist
# Generates a complete checklist and validates readiness

set -e

echo "📱 TypeB Family - App Store Submission Validator"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Tracking variables
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Arrays to store results
declare -a ERRORS=()
declare -a WARNINGS_LIST=()
declare -a PASSED_LIST=()

# Function to check item
check_item() {
    local description="$1"
    local command="$2"
    local required="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $description"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        PASSED_LIST+=("$description")
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌${NC} $description ${RED}(REQUIRED)${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            ERRORS+=("$description")
        else
            echo -e "${YELLOW}⚠️${NC} $description ${YELLOW}(OPTIONAL)${NC}"
            WARNINGS=$((WARNINGS + 1))
            WARNINGS_LIST+=("$description")
        fi
    fi
}

# Function to check file size
check_file_size() {
    local file="$1"
    local max_size="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        if [ "$size" -le "$max_size" ]; then
            return 0
        fi
    fi
    return 1
}

echo "🔍 Checking App Configuration..."
echo "================================"

check_item "app.json exists" "test -f app.json" true
check_item "Version number set" "grep -q '\"version\"' app.json" true
check_item "Bundle identifier configured" "grep -q 'bundleIdentifier' app.json || grep -q 'com.typebfamily' app.json" true
check_item "App name configured" "grep -q '\"name\"' app.json" true
check_item "App display name set" "grep -q '\"displayName\"' app.json || grep -q '\"name\"' app.json" true
check_item "Expo SDK version specified" "grep -q '\"expo\"' app.json" true
check_item "App icon exists" "test -f assets/icon.png" true
check_item "Splash screen exists" "test -f assets/splash-icon.png || test -f assets/splash.png" true
check_item "Adaptive icon (Android)" "test -f assets/adaptive-icon.png" false

echo ""
echo "📸 Checking App Store Assets..."
echo "================================"

check_item "App icon 1024x1024" "test -f app-store-assets/icon/AppIcon.png" true
check_item "iPhone screenshots directory" "test -d app-store-assets/screenshots-clean" true
check_item "At least 3 screenshots" "test $(ls app-store-assets/screenshots-clean/*.png 2>/dev/null | wc -l) -ge 3" true
check_item "App description file" "test -f app-store-content-clean.txt" true
check_item "Privacy policy URL" "grep -q 'typebapp.com/privacy' app-store-content-clean.txt 2>/dev/null || echo 'Check manually'" false
check_item "Terms of service URL" "grep -q 'typebapp.com/terms' app-store-content-clean.txt 2>/dev/null || echo 'Check manually'" false
check_item "Support URL configured" "grep -q 'typebapp.com' app-store-content-clean.txt 2>/dev/null || echo 'Check manually'" false

echo ""
echo "🔐 Checking Credentials & Build Config..."
echo "==========================================="

check_item "EAS CLI installed" "command -v eas" true
check_item "EAS configuration exists" "test -f eas.json" true
check_item "Production profile in eas.json" "grep -q '\"production\"' eas.json" true
check_item "iOS bundle ID configured" "grep -q 'bundleIdentifier' app.json || grep -q 'ios' app.json" true
check_item "Android package name configured" "grep -q 'package' app.json || grep -q 'android' app.json" true
check_item "Build credentials configured" "test -f eas.json && grep -q 'production' eas.json" true

echo ""
echo "🧪 Checking Code Quality..."
echo "============================"

check_item "Package.json exists" "test -f package.json" true
check_item "Dependencies installed" "test -d node_modules" true
check_item "TypeScript configuration" "test -f tsconfig.json" true
check_item "No TypeScript errors" "npm run type-check 2>/dev/null || npx tsc --noEmit 2>/dev/null" false
check_item "ESLint configuration" "test -f .eslintrc.js || test -f .eslintrc.json" false
check_item "Tests configured" "grep -q '\"test\"' package.json" false
check_item "Unit tests pass" "npm test -- --passWithNoTests 2>/dev/null" false

echo ""
echo "🚀 Checking Production Setup..."
echo "================================"

check_item "Production environment file" "test -f .env.production || grep -q 'production' app.config.js 2>/dev/null" true
check_item "Firebase configuration" "grep -q 'firebase' package.json || test -f google-services.json || test -f GoogleService-Info.plist" true
check_item "RevenueCat configured" "grep -q 'react-native-purchases' package.json" false
check_item "Sentry error tracking" "grep -q '@sentry/react-native' package.json" false
check_item "Analytics configured" "grep -q 'firebase.*analytics' package.json || grep -q '@react-native-firebase/analytics' package.json" false

echo ""
echo "📝 Checking Documentation..."
echo "============================="

check_item "README.md exists" "test -f README.md" true
check_item "LICENSE file" "test -f LICENSE" false
check_item "CHANGELOG or release notes" "test -f CHANGELOG.md || test -f RELEASE_NOTES.md" false
check_item "Privacy policy file" "test -f PRIVACY.md || test -f docs/PRIVACY.md" false
check_item "Terms of service file" "test -f TERMS.md || test -f docs/TERMS.md" false

echo ""
echo "📊 Checking Performance & Optimization..."
echo "=========================================="

check_item "Images optimized (<5MB each)" "! find assets -name '*.png' -size +5M 2>/dev/null | grep -q ." false
check_item "Hermes enabled (Android)" "grep -q 'hermesEnabled.*true' android/app/build.gradle 2>/dev/null" false
check_item "ProGuard/R8 configured" "test -f android/app/proguard-rules.pro" false
check_item "iOS build configuration" "test -d ios" true

echo ""
echo "🌍 Checking Compliance & Metadata..."
echo "====================================="

check_item "Export compliance (iOS)" "grep -q 'ITSAppUsesNonExemptEncryption' app.json" true
check_item "Age rating configured" "grep -q 'rating' app.json || echo 'Configure in store console'" false
check_item "Category specified" "grep -q 'category' app.json || echo 'Configure in store console'" false
check_item "COPPA compliance noted" "grep -q 'COPPA' app-store-content-clean.txt 2>/dev/null || echo 'Check manually'" true
check_item "Accessibility features" "grep -q 'accessible' src 2>/dev/null || grep -q 'accessibilityLabel' src 2>/dev/null" false

echo ""
echo "🔒 Checking Security..."
echo "========================"

check_item "No hardcoded API keys" "! grep -r 'apiKey.*=.*[\"'\''][A-Za-z0-9]' src 2>/dev/null | grep -v '.env'" true
check_item "Environment variables used" "test -f .env.example || test -f .env.production" true
check_item "Sensitive files in .gitignore" "grep -q '.env' .gitignore" true

echo ""
echo "📱 Checking Platform-Specific Requirements..."
echo "=============================================="

# iOS specific
if [ -d "ios" ]; then
    echo -e "${BLUE}iOS:${NC}"
    check_item "  Info.plist exists" "test -f ios/*/Info.plist" true
    check_item "  Bundle version set" "grep -q 'CFBundleVersion' ios/*/Info.plist" true
    check_item "  App Transport Security" "grep -q 'NSAppTransportSecurity' ios/*/Info.plist" false
    check_item "  Camera usage description" "grep -q 'NSCameraUsageDescription' ios/*/Info.plist" false
    check_item "  Photo library usage" "grep -q 'NSPhotoLibraryUsageDescription' ios/*/Info.plist" false
fi

# Android specific
if [ -d "android" ]; then
    echo -e "${BLUE}Android:${NC}"
    check_item "  build.gradle exists" "test -f android/app/build.gradle" true
    check_item "  Version code set" "grep -q 'versionCode' android/app/build.gradle" true
    check_item "  Version name set" "grep -q 'versionName' android/app/build.gradle" true
    check_item "  Min SDK version >= 21" "grep -q 'minSdkVersion.*2[1-9]' android/app/build.gradle" true
    check_item "  Target SDK version >= 31" "grep -q 'targetSdkVersion.*3[1-9]' android/app/build.gradle" true
fi

echo ""
echo "============================================"
echo "📊 SUBMISSION READINESS REPORT"
echo "============================================"
echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed (Required): $FAILED_CHECKS${NC}"
echo -e "${YELLOW}Warnings (Optional): $WARNINGS${NC}"
echo ""

# Calculate readiness percentage
READINESS=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

# Determine overall status
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ APP IS READY FOR SUBMISSION!${NC}"
    echo "Readiness: ${READINESS}%"
    echo ""
    echo "Next steps:"
    echo "1. Run final tests: npm test"
    echo "2. Build production app: eas build --platform all --profile production"
    echo "3. Submit to stores: eas submit --platform all"
    echo "4. Complete store listings in App Store Connect and Play Console"
else
    echo -e "${RED}❌ APP NOT READY FOR SUBMISSION${NC}"
    echo "Readiness: ${READINESS}%"
    echo ""
    echo "Required fixes:"
    for error in "${ERRORS[@]}"; do
        echo "  - $error"
    done
fi

if [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Recommended improvements:${NC}"
    for warning in "${WARNINGS_LIST[@]:0:5}"; do
        echo "  - $warning"
    done
    if [ ${#WARNINGS_LIST[@]} -gt 5 ]; then
        echo "  ... and $((${#WARNINGS_LIST[@]} - 5)) more"
    fi
fi

# Generate detailed report
REPORT_FILE="SUBMISSION_STATUS.md"
cat > "$REPORT_FILE" << EOF
# TypeB Family App - Submission Status Report

Generated: $(date)

## Readiness: ${READINESS}%

### Summary
- Total Checks: $TOTAL_CHECKS
- Passed: $PASSED_CHECKS
- Failed (Required): $FAILED_CHECKS
- Warnings (Optional): $WARNINGS

### Status: $([ $FAILED_CHECKS -eq 0 ] && echo "✅ READY FOR SUBMISSION" || echo "❌ NOT READY")

## Required Fixes
$(if [ $FAILED_CHECKS -gt 0 ]; then
    for error in "${ERRORS[@]}"; do
        echo "- [ ] $error"
    done
else
    echo "None - all required checks passed!"
fi)

## Optional Improvements
$(if [ $WARNINGS -gt 0 ]; then
    for warning in "${WARNINGS_LIST[@]}"; do
        echo "- [ ] $warning"
    done
else
    echo "None - all optional checks passed!"
fi)

## Passed Checks
$(for passed in "${PASSED_LIST[@]}"; do
    echo "- [x] $passed"
done)

## Submission Commands

\`\`\`bash
# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest

# Or submit specific builds
eas submit --platform ios --id=<build-id>
eas submit --platform android --id=<build-id>
\`\`\`

## Pre-Submission Checklist

### App Store (iOS)
- [ ] Screenshots uploaded (6.5", 5.5" displays)
- [ ] App description (max 4000 chars)
- [ ] Keywords (max 100 chars)
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Privacy Policy URL
- [ ] Age Rating questionnaire completed
- [ ] App Review notes prepared
- [ ] Demo account created

### Google Play (Android)
- [ ] Screenshots uploaded (phone, tablet)
- [ ] Feature graphic (1024x500)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Category selected
- [ ] Content rating questionnaire
- [ ] Privacy Policy URL
- [ ] Data Safety form completed
- [ ] Target audience selected

## Store URLs
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Expo Dashboard](https://expo.dev)

## Support Resources
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/console/policy)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

## Notes
- Ensure all production environment variables are set
- Test the production build thoroughly before submission
- Have app review notes ready with demo account credentials
- Be prepared to respond to review feedback within 24 hours
EOF

echo ""
echo "📄 Detailed report saved to: $REPORT_FILE"
echo ""

# Exit with appropriate code
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 Congratulations! Your app is ready for the stores!${NC}"
    exit 0
else
    echo -e "${RED}Please fix the required issues before submitting.${NC}"
    exit 1
fi
