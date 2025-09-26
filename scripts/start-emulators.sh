#!/bin/bash

# TypeB Family App - Firebase Emulator Start Script
# This script starts the Firebase emulators and optionally seeds test data

echo "🚀 Starting Firebase Emulators for TypeB Family App..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed!${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ Not in the typeb-family-app directory!${NC}"
    echo "Please run this script from the typeb-family-app directory"
    exit 1
fi

# Parse command line arguments
SEED_DATA=false
EXPORT_ON_EXIT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --seed)
            SEED_DATA=true
            shift
            ;;
        --export)
            EXPORT_ON_EXIT=true
            shift
            ;;
        --help)
            echo "Usage: ./scripts/start-emulators.sh [options]"
            echo ""
            echo "Options:"
            echo "  --seed     Seed test data after starting emulators"
            echo "  --export   Export emulator data on exit"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down emulators...${NC}"
    
    if [ "$EXPORT_ON_EXIT" = true ]; then
        echo -e "${YELLOW}Exporting emulator data...${NC}"
        firebase emulators:export ./emulator-data --force
    fi
    
    # Kill any remaining Firebase processes
    pkill -f "firebase emulators:start" || true
    
    echo -e "${GREEN}✅ Emulators stopped${NC}"
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start emulators
echo -e "${GREEN}Starting emulators...${NC}"
echo "  Auth:      http://localhost:9099"
echo "  Firestore: http://localhost:8080"
echo "  Storage:   http://localhost:9199"
echo "  Functions: http://localhost:5001"
echo "  UI:        http://localhost:4000"
echo ""

# Check if we should import existing data
if [ -d "./emulator-data" ]; then
    echo -e "${YELLOW}Found existing emulator data. Importing...${NC}"
    firebase emulators:start --import=./emulator-data &
else
    firebase emulators:start &
fi

EMULATOR_PID=$!

# Wait for emulators to start
echo -e "${YELLOW}Waiting for emulators to start...${NC}"
sleep 5

# Check if emulators are running
if ! curl -s http://localhost:4000 > /dev/null; then
    echo -e "${RED}❌ Emulators failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Emulators started successfully!${NC}"

# Seed data if requested
if [ "$SEED_DATA" = true ]; then
    echo -e "\n${YELLOW}Seeding test data...${NC}"
    npm run seed:data
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test data seeded successfully!${NC}"
        echo ""
        echo "Test accounts created:"
        echo "  📧 demo@typebapp.com (Demo123!)"
        echo "  📧 john.smith@test.com (Parent123!)"
        echo "  📧 jane.smith@test.com (Parent123!)"
        echo "  📧 emma.smith@test.com (Child123!)"
        echo "  📧 liam.smith@test.com (Child123!)"
        echo "  📧 mike.johnson@test.com (Parent123!)"
        echo "  📧 sarah.johnson@test.com (Child123!)"
    else
        echo -e "${RED}❌ Failed to seed test data${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Firebase Emulators are ready!${NC}"
echo ""
echo "Open the Emulator UI at: http://localhost:4000"
echo "Press Ctrl+C to stop the emulators"
echo ""

# Wait for the emulator process
wait $EMULATOR_PID