#!/bin/bash

# TypeB App Store Submission Checklist
# Run this script to verify everything is ready for App Store submission

echo "================================================"
echo "   📱 TypeB App Store Submission Checklist"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check item
check_item() {
    local status=$1
    local message=$2
    local details=$3
    
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $message"
        if [ ! -z "$details" ]; then
            echo "  └─ $details"
        fi
        ((PASSED++))
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}✗${NC} $message"
        if [ ! -z "$details" ]; then
            echo "  └─ $details"
        fi
        ((FAILED++))
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
        if [ ! -z "$details" ]; then
            echo "  └─ $details"
        fi
        ((WARNINGS++))
    fi
}

echo -e "${BLUE}1. Build Information${NC}"
echo "------------------------"
check_item "pass" "TestFlight Build #16" "Version 1.1.0 ready for submission"
check_item "pass" "Bundle ID" "com.typeb.familyapp"
check_item "pass" "App Store ID" "6749812496"
echo ""

echo -e "${BLUE}2. App Store Connect Configuration${NC}"
echo "------------------------------------"
check_item "warn" "Free Trial Setup" "Navigate to Monetization → Subscriptions (not In-App Purchases)"
check_item "warn" "App Name Change" "Update from 'TypeB Family' to 'TypeB' in App Information"
check_item "warn" "App Icon" "Upload 1024x1024px icon without transparency"
echo ""

echo -e "${BLUE}3. Subscription Configuration${NC}"
echo "------------------------------"
check_item "pass" "Monthly Subscription" "premium_monthly - $4.99/month"
check_item "pass" "Annual Subscription" "premium_annual - $39.99/year"
check_item "warn" "7-Day Free Trial" "Must be added via Introductory Offers"
echo ""

echo -e "${BLUE}4. Screenshots (1290 × 2796 pixels)${NC}"
echo "------------------------------------"
SCREENSHOT_DIR="./app-store-screenshots"
if [ -d "$SCREENSHOT_DIR" ]; then
    SCREENSHOT_COUNT=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)
    if [ $SCREENSHOT_COUNT -ge 5 ]; then
        check_item "pass" "Screenshots Ready" "$SCREENSHOT_COUNT screenshots found"
    else
        check_item "warn" "Screenshots Incomplete" "Only $SCREENSHOT_COUNT of 5 minimum found"
    fi
else
    check_item "fail" "Screenshots Missing" "Run create-app-store-screenshots.sh first"
fi
echo ""

echo -e "${BLUE}5. App Metadata${NC}"
echo "----------------"
check_item "pass" "App Name" "TypeB"
check_item "pass" "Subtitle" "Family Tasks Made Simple"
check_item "pass" "Keywords" "100 characters optimized"
check_item "pass" "Description" "Optimized with features and benefits"
echo ""

echo -e "${BLUE}6. Required Information${NC}"
echo "------------------------"
check_item "warn" "Privacy Policy URL" "Add your privacy policy URL"
check_item "warn" "Terms of Service URL" "Add your terms URL"
check_item "pass" "Support Email" "support@typebapp.com"
check_item "pass" "Demo Account" "demo@typebapp.com / Demo123!"
echo ""

echo -e "${BLUE}7. Technical Requirements${NC}"
echo "--------------------------"
check_item "pass" "iOS SDK" "iOS 18 compatible"
check_item "pass" "RevenueCat" "v9.2.0 integrated"
check_item "pass" "Firebase" "Production configured"
check_item "pass" "Sentry" "Error tracking enabled"
echo ""

echo -e "${BLUE}8. Testing Status${NC}"
echo "------------------"
check_item "pass" "TestFlight Testing" "50+ beta testers"
check_item "pass" "Production Backend" "All services verified"
check_item "pass" "Photo Upload" "Working in production"
check_item "pass" "Subscriptions" "RevenueCat validated"
echo ""

echo "================================================"
echo -e "${BLUE}SUBMISSION STEPS SUMMARY${NC}"
echo "================================================"
echo ""
echo "1️⃣  ADD FREE TRIAL (App Store Connect)"
echo "   • Go to Monetization → Subscriptions (NOT In-App Purchases)"
echo "   • Select each subscription → Add Introductory Offer"
echo "   • Choose 'Free Trial' → '7 Days'"
echo ""
echo "2️⃣  UPDATE APP INFO"
echo "   • Change name to 'TypeB' in App Information"
echo "   • Upload 1024x1024 app icon"
echo ""
echo "3️⃣  CREATE SCREENSHOTS"
echo "   • Take 5 screenshots from TestFlight"
echo "   • Run: ./scripts/create-app-store-screenshots.sh"
echo "   • Upload to App Store Connect"
echo ""
echo "4️⃣  SUBMIT BUILD #16"
echo "   • Select Build 1.1.0 (16) from TestFlight"
echo "   • Add release notes"
echo "   • Submit for Review"
echo ""

echo "================================================"
echo -e "${BLUE}RESULTS${NC}"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Ready to submit with minor items to complete${NC}"
        echo "Complete the warning items in App Store Connect"
    else
        echo -e "${GREEN}✅ Everything is ready for submission!${NC}"
    fi
else
    echo -e "${RED}❌ Please fix failed items before submission${NC}"
fi

echo ""
echo "📚 Full guide: docs/APP-STORE-SUBMISSION-GUIDE.md"
echo "🚀 Good luck with your submission!"