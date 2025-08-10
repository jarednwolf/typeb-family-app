#!/bin/bash

# TypeB Family App - Build Monitor Script
# This script monitors the EAS build status and notifies when complete

echo "🚀 TypeB Family App - Build Monitor"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build information
BUILD_ID="ff9f6ac8-f48a-4991-b1fa-942030ff28e6"
BUILD_URL="https://expo.dev/accounts/wolfjn1/projects/typeb-family-app/builds/${BUILD_ID}"

echo "📱 Monitoring iOS Build #12"
echo "🔗 Build URL: ${BUILD_URL}"
echo ""
echo "⏰ Started at: $(date)"
echo ""

# Function to check build status
check_build_status() {
    # Get the latest build status
    STATUS=$(eas build:view --id="${BUILD_ID}" --json 2>/dev/null | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$STATUS" ]; then
        # If we can't get status, try listing builds
        STATUS=$(eas build:list --platform ios --limit 1 --json 2>/dev/null | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
    fi
    
    echo "$STATUS"
}

# Monitor loop
COUNTER=0
while true; do
    STATUS=$(check_build_status)
    COUNTER=$((COUNTER + 1))
    
    # Clear previous line and show status
    printf "\r⏳ Check #${COUNTER}: Build status: ${YELLOW}${STATUS}${NC}    "
    
    case "$STATUS" in
        "finished")
            echo ""
            echo ""
            echo "${GREEN}✅ BUILD SUCCESSFUL!${NC}"
            echo ""
            echo "🎯 Next Steps:"
            echo "1. Submit to TestFlight:"
            echo "   ${GREEN}eas submit --platform ios --latest${NC}"
            echo ""
            echo "2. You'll need an app-specific password:"
            echo "   - Go to: https://appleid.apple.com/account/manage"
            echo "   - Generate app-specific password"
            echo "   - Use it when prompted"
            echo ""
            echo "📱 Build completed at: $(date)"
            
            # Play a sound notification (macOS)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                say "Your iOS build is complete and ready for TestFlight submission"
                osascript -e 'display notification "iOS Build #12 completed successfully!" with title "TypeB Family App" sound name "Glass"'
            fi
            
            exit 0
            ;;
        "error"|"errored")
            echo ""
            echo ""
            echo "${RED}❌ BUILD FAILED!${NC}"
            echo ""
            echo "Please check the build logs at:"
            echo "${BUILD_URL}"
            echo ""
            echo "Common fixes:"
            echo "1. Check the error logs"
            echo "2. Clear cache and rebuild"
            echo "3. Verify credentials"
            echo ""
            
            # Play error sound (macOS)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                say "Build failed. Please check the logs."
                osascript -e 'display notification "Build failed - check logs" with title "TypeB Family App" sound name "Basso"'
            fi
            
            exit 1
            ;;
        "in-queue"|"in-progress"|"pending")
            # Build is still running, continue monitoring
            ;;
        *)
            # Unknown status, continue monitoring
            ;;
    esac
    
    # Wait 30 seconds before next check
    sleep 30
done