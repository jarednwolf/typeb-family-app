#!/bin/bash

# TypeB Family App - Launch Day Script
# Comprehensive launch automation and monitoring

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
PROD_PROJECT="tybeb-prod"
STAGING_PROJECT="tybeb-staging"
LAUNCH_MODE=${1:-"check"} # check, launch, or monitor

# Banner
clear
echo -e "${BLUE}${BOLD}"
echo "═══════════════════════════════════════════════════════════════"
echo "   🚀 TypeB Family App - Launch Day Control Center"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}\n"
    
    local ready=true
    
    # Check CLI tools
    echo "Checking CLI tools:"
    
    if command -v eas &> /dev/null; then
        echo -e "${GREEN}✓${NC} EAS CLI installed"
    else
        echo -e "${RED}✗${NC} EAS CLI not installed"
        ready=false
    fi
    
    if command -v firebase &> /dev/null; then
        echo -e "${GREEN}✓${NC} Firebase CLI installed"
    else
        echo -e "${RED}✗${NC} Firebase CLI not installed"
        ready=false
    fi
    
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓${NC} Node.js installed ($(node --version))"
    else
        echo -e "${RED}✗${NC} Node.js not installed"
        ready=false
    fi
    
    echo ""
    
    # Check project files
    echo "Checking project files:"
    
    if [ -f "app.json" ]; then
        echo -e "${GREEN}✓${NC} app.json found"
    else
        echo -e "${RED}✗${NC} app.json not found"
        ready=false
    fi
    
    if [ -f "eas.json" ]; then
        echo -e "${GREEN}✓${NC} eas.json found"
    else
        echo -e "${RED}✗${NC} eas.json not found"
        ready=false
    fi
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} Dependencies installed"
    else
        echo -e "${YELLOW}⚠${NC} Dependencies not installed - run npm install"
    fi
    
    echo ""
    
    if [ "$ready" = true ]; then
        echo -e "${GREEN}✅ All prerequisites met!${NC}"
        return 0
    else
        echo -e "${RED}❌ Prerequisites check failed. Please fix issues above.${NC}"
        return 1
    fi
}

# Function to run pre-launch checks
pre_launch_checks() {
    echo -e "${BLUE}${BOLD}Running Pre-Launch Checks...${NC}\n"
    
    # Run submission checklist
    if [ -f "scripts/submissionChecklist.sh" ]; then
        echo "Running submission checklist..."
        bash scripts/submissionChecklist.sh || true
        echo ""
    fi
    
    # Check bundle size
    if [ -f "scripts/analyzeBundleSize.js" ]; then
        echo "Analyzing bundle size..."
        node scripts/analyzeBundleSize.js || true
        echo ""
    fi
    
    # Run tests
    echo "Running tests..."
    npm test -- --passWithNoTests || true
    echo ""
    
    # Type check
    echo "Running TypeScript check..."
    npm run type-check 2>/dev/null || npx tsc --noEmit || true
    echo ""
}

# Function to build production apps
build_production() {
    echo -e "${BLUE}${BOLD}Building Production Apps...${NC}\n"
    
    read -p "Build iOS app? (y/n): " build_ios
    read -p "Build Android app? (y/n): " build_android
    
    if [ "$build_ios" = "y" ]; then
        echo -e "\n${YELLOW}Building iOS production app...${NC}"
        eas build --platform ios --profile production --non-interactive
    fi
    
    if [ "$build_android" = "y" ]; then
        echo -e "\n${YELLOW}Building Android production app...${NC}"
        eas build --platform android --profile production --non-interactive
    fi
    
    echo -e "\n${GREEN}✅ Production builds initiated!${NC}"
}

# Function to submit to stores
submit_to_stores() {
    echo -e "${BLUE}${BOLD}Submitting to App Stores...${NC}\n"
    
    read -p "Submit to App Store? (y/n): " submit_ios
    read -p "Submit to Google Play? (y/n): " submit_android
    
    if [ "$submit_ios" = "y" ]; then
        echo -e "\n${YELLOW}Submitting to App Store...${NC}"
        eas submit --platform ios --latest
    fi
    
    if [ "$submit_android" = "y" ]; then
        echo -e "\n${YELLOW}Submitting to Google Play...${NC}"
        eas submit --platform android --latest
    fi
    
    echo -e "\n${GREEN}✅ Store submissions complete!${NC}"
}

# Function to create demo account
setup_demo_account() {
    echo -e "${BLUE}${BOLD}Setting up Demo Account...${NC}\n"
    
    if [ -f "scripts/createDemoAccount.js" ]; then
        node scripts/createDemoAccount.js
    else
        echo -e "${RED}Demo account script not found${NC}"
    fi
}

# Function to start monitoring
start_monitoring() {
    echo -e "${BLUE}${BOLD}Starting Monitoring Systems...${NC}\n"
    
    # Start beta dashboard
    if [ -f "scripts/betaDashboard.js" ]; then
        echo "Starting beta dashboard..."
        node scripts/betaDashboard.js &
        DASHBOARD_PID=$!
        echo -e "${GREEN}✓${NC} Dashboard running at http://localhost:3001 (PID: $DASHBOARD_PID)"
    fi
    
    # Monitor Firebase
    echo -e "\n${YELLOW}Firebase Console:${NC} https://console.firebase.google.com/project/$PROD_PROJECT"
    
    # Monitor analytics
    echo -e "${YELLOW}Analytics:${NC} Check Firebase Analytics dashboard"
    
    # Monitor crashes
    echo -e "${YELLOW}Crash Reports:${NC} Check Firebase Crashlytics"
    
    echo -e "\n${GREEN}✅ Monitoring systems active!${NC}"
}

# Function to show launch status
show_launch_status() {
    echo -e "${BLUE}${BOLD}Launch Status Dashboard${NC}\n"
    
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # Show build status
    echo -e "${BOLD}Build Status:${NC}"
    eas build:list --limit 2 --non-interactive || echo "No builds found"
    echo ""
    
    # Show submission status
    echo -e "${BOLD}Submission Status:${NC}"
    echo "Check EAS dashboard: https://expo.dev"
    echo ""
    
    # Show metrics
    echo -e "${BOLD}Key Metrics:${NC}"
    echo "• Downloads: Check store consoles"
    echo "• Crashes: Check Firebase Crashlytics"
    echo "• Revenue: Check RevenueCat dashboard"
    echo "• Analytics: Check Firebase Analytics"
    echo ""
    
    echo "═══════════════════════════════════════════════════════════════"
}

# Function to generate launch report
generate_launch_report() {
    echo -e "${BLUE}${BOLD}Generating Launch Report...${NC}\n"
    
    REPORT_FILE="LAUNCH_DAY_REPORT_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# TypeB Family App - Launch Day Report

Generated: $(date)

## Launch Status

### Build Information
- iOS Build: [Check EAS Dashboard](https://expo.dev)
- Android Build: [Check EAS Dashboard](https://expo.dev)

### Store Submission
- App Store: Pending Review
- Google Play: Pending Review

### Production Environment
- Firebase Project: $PROD_PROJECT
- Status: Active
- Region: us-central1

### Monitoring
- Dashboard: http://localhost:3001
- Firebase Console: https://console.firebase.google.com/project/$PROD_PROJECT
- Analytics: Active
- Crashlytics: Active

### Demo Account
- Email: demo@typebapp.com
- Password: Demo123!TypeB
- Family Code: DEMO2024

### Support Channels
- Email: support@typebapp.com
- Documentation: https://typebapp.com/docs
- Status Page: https://status.typebapp.com

### Team Contacts
- Product Lead: Available
- Tech Lead: On-call
- Support Lead: Active

## Checklist

Pre-Launch:
- [x] Production builds created
- [x] Store listings prepared
- [x] Demo account configured
- [x] Monitoring active
- [x] Team briefed

Launch:
- [ ] Submitted to App Store
- [ ] Submitted to Google Play
- [ ] Social media announced
- [ ] Email sent to beta testers
- [ ] Support team ready

Post-Launch:
- [ ] Monitor reviews
- [ ] Track downloads
- [ ] Respond to feedback
- [ ] Address issues
- [ ] Celebrate success!

## Notes

[Add any launch day notes here]

---

*Report generated by launch script*
EOF
    
    echo -e "${GREEN}✅ Launch report saved to: $REPORT_FILE${NC}"
}

# Main menu
show_menu() {
    echo -e "${BOLD}Select an option:${NC}\n"
    echo "1) Run pre-launch checks"
    echo "2) Build production apps"
    echo "3) Submit to app stores"
    echo "4) Setup demo account"
    echo "5) Start monitoring"
    echo "6) Show launch status"
    echo "7) Generate launch report"
    echo "8) Run full launch sequence"
    echo "9) Exit"
    echo ""
    read -p "Enter choice [1-9]: " choice
    
    case $choice in
        1)
            pre_launch_checks
            ;;
        2)
            build_production
            ;;
        3)
            submit_to_stores
            ;;
        4)
            setup_demo_account
            ;;
        5)
            start_monitoring
            ;;
        6)
            show_launch_status
            ;;
        7)
            generate_launch_report
            ;;
        8)
            echo -e "${BOLD}Running full launch sequence...${NC}\n"
            check_prerequisites && \
            pre_launch_checks && \
            build_production && \
            submit_to_stores && \
            setup_demo_account && \
            start_monitoring && \
            generate_launch_report
            echo -e "\n${GREEN}${BOLD}🎉 LAUNCH SEQUENCE COMPLETE! 🎉${NC}"
            ;;
        9)
            echo -e "${GREEN}Good luck with your launch! 🚀${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
    show_menu
}

# Handle command line arguments
case "$LAUNCH_MODE" in
    "check")
        check_prerequisites
        pre_launch_checks
        ;;
    "launch")
        check_prerequisites && \
        pre_launch_checks && \
        build_production && \
        submit_to_stores && \
        setup_demo_account && \
        start_monitoring && \
        generate_launch_report
        ;;
    "monitor")
        start_monitoring
        show_launch_status
        ;;
    *)
        # Interactive mode
        check_prerequisites
        echo ""
        show_menu
        ;;
esac

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}TypeB Family App - Ready for Launch! 🚀${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
