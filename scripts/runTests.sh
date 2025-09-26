#!/bin/bash

# TypeB Family App - Comprehensive Test Runner
# This script runs all test suites and generates coverage reports

set -e

echo "🧪 TypeB Family App - Test Suite Runner"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running $suite_name...${NC}"
    
    if eval $test_command; then
        echo -e "${GREEN}✓ $suite_name passed${NC}\n"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ $suite_name failed${NC}\n"
        ((TESTS_FAILED++))
    fi
}

# Check Node version
echo "Checking environment..."
node_version=$(node -v)
echo "Node version: $node_version"
npm_version=$(npm -v)
echo "NPM version: $npm_version"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Clean previous test results
echo "Cleaning previous test results..."
rm -rf coverage/
rm -rf test-results/
mkdir -p test-results
echo ""

# Run Unit Tests
echo "═══════════════════════════════════════"
echo "1. UNIT TESTS"
echo "═══════════════════════════════════════"
run_test_suite "Photo Validation Tests" "npm test -- src/__tests__/unit/photoValidation.test.ts --coverage"
run_test_suite "Premium Features Tests" "npm test -- src/__tests__/unit/premiumFeatures.test.ts --coverage"
run_test_suite "Real-time Sync Tests" "npm test -- src/__tests__/unit/realtimeSync.test.ts --coverage"
run_test_suite "Family Service Tests" "npm test -- src/__tests__/unit/family.test.ts --coverage"
run_test_suite "Task Service Tests" "npm test -- src/__tests__/unit/tasks.test.ts --coverage"

# Run Integration Tests
echo "═══════════════════════════════════════"
echo "2. INTEGRATION TESTS"
echo "═══════════════════════════════════════"

# Start Firebase emulators for integration tests
echo "Starting Firebase emulators..."
firebase emulators:start --only auth,firestore,storage --project test-project &
EMULATOR_PID=$!
sleep 10 # Wait for emulators to start

run_test_suite "Premium Features Integration" "npm test -- src/__tests__/integration/premiumFeatures.integration.test.ts"
run_test_suite "Family Service Integration" "npm test -- src/__tests__/integration/family.emulator.test.ts"
run_test_suite "Auth Service Integration" "npm test -- src/__tests__/integration/auth.integration.test.ts"

# Stop Firebase emulators
echo "Stopping Firebase emulators..."
kill $EMULATOR_PID 2>/dev/null || true
echo ""

# Run E2E Tests (if Detox is configured)
echo "═══════════════════════════════════════"
echo "3. E2E TESTS"
echo "═══════════════════════════════════════"

if command -v detox &> /dev/null; then
    # Build app for testing
    echo "Building app for E2E tests..."
    detox build --configuration ios.sim.debug
    
    run_test_suite "Critical User Flows E2E" "detox test e2e/tests/criticalFlows.e2e.js --configuration ios.sim.debug"
    run_test_suite "Photo Validation E2E" "detox test e2e/tests/photoValidation.e2e.js --configuration ios.sim.debug"
    run_test_suite "Offline Mode E2E" "detox test e2e/tests/offlineMode.e2e.js --configuration ios.sim.debug"
else
    echo -e "${YELLOW}Detox not installed. Skipping E2E tests.${NC}"
    echo "To run E2E tests, install Detox: npm install -g detox-cli"
    echo ""
fi

# Generate Coverage Report
echo "═══════════════════════════════════════"
echo "4. COVERAGE REPORT"
echo "═══════════════════════════════════════"
echo "Generating coverage report..."
npm test -- --coverage --coverageReporters=text-summary --coverageReporters=html

# Display coverage summary
echo ""
echo "Coverage Summary:"
if [ -f "coverage/coverage-summary.json" ]; then
    node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const total = coverage.total;
    console.log('  Lines:', total.lines.pct + '%');
    console.log('  Statements:', total.statements.pct + '%');
    console.log('  Functions:', total.functions.pct + '%');
    console.log('  Branches:', total.branches.pct + '%');
    "
fi

# Check coverage thresholds
echo ""
echo "Checking coverage thresholds..."
COVERAGE_PASSED=true

check_coverage() {
    local metric=$1
    local threshold=$2
    local actual=$(node -e "const c=require('./coverage/coverage-summary.json');console.log(c.total['$metric'].pct)")
    
    if (( $(echo "$actual < $threshold" | bc -l) )); then
        echo -e "${RED}✗ $metric coverage ($actual%) is below threshold ($threshold%)${NC}"
        COVERAGE_PASSED=false
    else
        echo -e "${GREEN}✓ $metric coverage ($actual%) meets threshold ($threshold%)${NC}"
    fi
}

check_coverage "lines" 80
check_coverage "functions" 80
check_coverage "branches" 70
check_coverage "statements" 80

# TypeScript Check
echo ""
echo "═══════════════════════════════════════"
echo "5. TYPESCRIPT CHECK"
echo "═══════════════════════════════════════"
echo "Running TypeScript compiler..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✓ TypeScript check passed${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ TypeScript check failed${NC}"
    ((TESTS_FAILED++))
fi

# Linting Check
echo ""
echo "═══════════════════════════════════════"
echo "6. LINTING CHECK"
echo "═══════════════════════════════════════"
echo "Running ESLint..."
if npm run lint; then
    echo -e "${GREEN}✓ Linting check passed${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Linting check failed${NC}"
    ((TESTS_FAILED++))
fi

# Performance Check
echo ""
echo "═══════════════════════════════════════"
echo "7. BUNDLE SIZE CHECK"
echo "═══════════════════════════════════════"
echo "Checking bundle size..."

# Export bundle for analysis
npx expo export --platform ios --dump-sourcemap --output-dir dist/ 2>/dev/null || true

if [ -f "dist/bundles/ios-*.js" ]; then
    BUNDLE_SIZE=$(du -h dist/bundles/ios-*.js | cut -f1)
    echo "Bundle size: $BUNDLE_SIZE"
    
    # Check if bundle is under 50MB
    SIZE_IN_BYTES=$(du -b dist/bundles/ios-*.js | cut -f1)
    MAX_SIZE=$((50 * 1024 * 1024)) # 50MB in bytes
    
    if [ $SIZE_IN_BYTES -lt $MAX_SIZE ]; then
        echo -e "${GREEN}✓ Bundle size is within limit${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ Bundle size exceeds 50MB limit${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}Could not measure bundle size${NC}"
fi

# Final Summary
echo ""
echo "═══════════════════════════════════════"
echo "TEST SUMMARY"
echo "═══════════════════════════════════════"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ] && [ "$COVERAGE_PASSED" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please fix issues before deployment.${NC}"
    exit 1
fi
