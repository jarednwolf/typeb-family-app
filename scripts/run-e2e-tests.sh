#!/bin/bash

# E2E Test Runner Script for TypeB Family App
# This script starts Firebase emulators, seeds test data, and runs E2E tests

set -e  # Exit on error

echo "🚀 Starting E2E Test Suite for TypeB Family App"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if applesimutils is installed (for iOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v applesimutils &> /dev/null; then
        echo -e "${YELLOW}⚠️  applesimutils is not installed${NC}"
        echo "Installing applesimutils..."
        brew tap wix/brew
        brew install applesimutils
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    # Kill emulators if running
    pkill -f "firebase emulators" || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Parse command line arguments
PLATFORM=${1:-ios}
TEST_SUITE=${2:-all}

echo -e "${GREEN}📱 Platform: $PLATFORM${NC}"
echo -e "${GREEN}🧪 Test Suite: $TEST_SUITE${NC}"
echo ""

# Start Firebase emulators in background
echo -e "${YELLOW}🔥 Starting Firebase emulators...${NC}"
firebase emulators:start --only auth,firestore,storage --project typeb-family-app &
EMULATOR_PID=$!

# Wait for emulators to be ready
echo "⏳ Waiting for emulators to start..."
sleep 10

# Check if emulators are running
if ! curl -s http://localhost:4000 > /dev/null; then
    echo -e "${RED}❌ Firebase emulators failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Firebase emulators are running${NC}"

# Seed test data
echo -e "${YELLOW}🌱 Seeding test data...${NC}"
node scripts/seed-emulator.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test data seeded successfully${NC}"
else
    echo -e "${RED}❌ Failed to seed test data${NC}"
    exit 1
fi

# Build the app for testing
echo -e "${YELLOW}🔨 Building app for E2E testing...${NC}"
if [ "$PLATFORM" == "ios" ]; then
    npm run e2e:build:ios
elif [ "$PLATFORM" == "android" ]; then
    npm run e2e:build:android
else
    echo -e "${RED}❌ Invalid platform: $PLATFORM${NC}"
    exit 1
fi

# Run the tests
echo -e "${YELLOW}🧪 Running E2E tests...${NC}"
echo "================================"

case $TEST_SUITE in
    auth)
        echo "Running Authentication tests..."
        npx detox test e2e/tests/auth.test.js --configuration ${PLATFORM}.sim.debug
        ;;
    family)
        echo "Running Family Management tests..."
        npx detox test e2e/tests/family.test.js --configuration ${PLATFORM}.sim.debug
        ;;
    tasks)
        echo "Running Task Management tests..."
        npx detox test e2e/tests/tasks.test.js --configuration ${PLATFORM}.sim.debug
        ;;
    all)
        echo "Running all E2E tests..."
        npm run e2e:test:${PLATFORM}
        ;;
    *)
        echo -e "${RED}❌ Invalid test suite: $TEST_SUITE${NC}"
        echo "Valid options: auth, family, tasks, all"
        exit 1
        ;;
esac

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ E2E tests completed successfully!${NC}"
    echo "================================"
else
    echo ""
    echo -e "${RED}❌ Some E2E tests failed${NC}"
    echo "Check the output above for details"
    echo "================================"
    exit 1
fi

# Summary
echo ""
echo "📊 Test Summary:"
echo "----------------"
echo "Platform: $PLATFORM"
echo "Test Suite: $TEST_SUITE"
echo "Firebase Emulators: Used"
echo "Test Data: Seeded"
echo ""
echo -e "${GREEN}🎉 E2E Testing Complete!${NC}"