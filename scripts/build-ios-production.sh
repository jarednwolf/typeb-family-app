#!/bin/bash

# TypeB Family App - iOS Production Build Script
# This script helps automate the EAS build process with sensible defaults

echo "🚀 TypeB Family App - iOS Production Build Helper"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo -e "${RED}❌ Error: Not in the typeb-family-app directory${NC}"
    echo "Please run: cd typeb-family-app"
    exit 1
fi

# Check if user is logged in to EAS
echo -e "${BLUE}📋 Checking EAS login status...${NC}"
if ! eas whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Not logged in to EAS${NC}"
    echo "Please run: eas login"
    exit 1
fi

USERNAME=$(eas whoami)
echo -e "${GREEN}✅ Logged in as: $USERNAME${NC}"
echo ""

# Show current configuration
echo -e "${BLUE}📱 Build Configuration:${NC}"
echo "  Bundle ID: com.typeb.familyapp"
echo "  Version: 1.0.1"
echo "  Build Profile: production"
echo "  Version Source: remote (auto-increment)"
echo ""

# Explain what will happen
echo -e "${YELLOW}📝 What This Build Will Do:${NC}"
echo "  1. Create iOS distribution certificate (automatic)"
echo "  2. Create provisioning profile (automatic)"
echo "  3. Build the app on EAS servers"
echo "  4. Auto-increment build number"
echo "  5. Prepare for TestFlight submission"
echo ""

# Ask for confirmation
echo -e "${YELLOW}❓ Ready to start the build?${NC}"
echo "This will use automatic certificate management."
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Start the build with specific options
echo -e "${BLUE}🔨 Starting iOS production build...${NC}"
echo ""
echo -e "${YELLOW}📋 WHEN PROMPTED:${NC}"
echo ""
echo -e "${GREEN}For 'How would you like to upload your credentials?'${NC}"
echo "  → Select: ${BLUE}Expo handles your credentials${NC}"
echo ""
echo -e "${GREEN}For 'Distribution Certificate'${NC}"
echo "  → Select: ${BLUE}Let Expo handle the process${NC}"
echo ""
echo -e "${GREEN}For 'Push Notifications Key' (if asked)${NC}"
echo "  → Select: ${BLUE}Let Expo handle the process${NC}"
echo ""
echo -e "${GREEN}For 'Provisioning Profile'${NC}"
echo "  → Select: ${BLUE}Let Expo handle the process${NC}"
echo ""
echo -e "${YELLOW}Starting build now...${NC}"
echo ""

# Run the build command
eas build --platform ios --profile production

# Check if build started successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build started successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Next Steps:${NC}"
    echo "  1. Monitor build progress at the URL above"
    echo "  2. Wait for email notification (~15-30 minutes)"
    echo "  3. Once complete, run: eas submit --platform ios --latest"
    echo ""
    echo -e "${YELLOW}💡 Useful Commands:${NC}"
    echo "  Check status: eas build:list --platform ios --limit 1"
    echo "  Download IPA: eas build:download --platform ios --latest"
    echo "  Submit to TestFlight: eas submit --platform ios --latest"
else
    echo ""
    echo -e "${RED}❌ Build failed to start${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
    echo "  1. Make sure you have an Apple Developer account"
    echo "  2. Check that your bundle ID is registered"
    echo "  3. Try logging out and back in: eas logout && eas login"
    echo "  4. Check the error message above for details"
fi