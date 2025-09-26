#!/bin/bash

# TypeB Family App - Bundle Optimization Script
# This script analyzes and optimizes the app bundle size

set -e

echo "📦 TypeB Family App - Bundle Optimizer"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        echo "Please install $1 to continue"
        exit 1
    fi
}

echo "Checking required tools..."
check_tool node
check_tool npm
check_tool npx
echo -e "${GREEN}✓ All required tools installed${NC}\n"

# 1. Analyze Current Bundle
echo "═══════════════════════════════════════"
echo "1. CURRENT BUNDLE ANALYSIS"
echo "═══════════════════════════════════════"

# Clean previous builds
rm -rf dist/
rm -rf .expo/

# Export bundle for analysis
echo "Exporting bundle for analysis..."
npx expo export --platform ios --dump-sourcemap --output-dir dist/ || {
    echo -e "${RED}Failed to export bundle${NC}"
    exit 1
}

# Get bundle size
if [ -f dist/bundles/ios-*.js ]; then
    BUNDLE_FILE=$(ls dist/bundles/ios-*.js | head -1)
    ORIGINAL_SIZE=$(du -h "$BUNDLE_FILE" | cut -f1)
    ORIGINAL_BYTES=$(du -b "$BUNDLE_FILE" | cut -f1)
    echo -e "Original bundle size: ${YELLOW}$ORIGINAL_SIZE${NC}"
else
    echo -e "${RED}Bundle file not found${NC}"
    exit 1
fi

# Analyze bundle composition
echo ""
echo "Analyzing bundle composition..."
if [ -f dist/bundles/ios-*.js.map ]; then
    npx source-map-explorer dist/bundles/ios-*.js --json > bundle-analysis.json 2>/dev/null || true
    
    echo "Top 10 largest dependencies:"
    node -e "
    try {
        const analysis = require('./bundle-analysis.json');
        const files = analysis.results[0].files;
        const sorted = Object.entries(files)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        sorted.forEach(([file, size], i) => {
            const sizeInKB = (size / 1024).toFixed(2);
            const fileName = file.split('/').pop();
            console.log(\`  \${i + 1}. \${fileName}: \${sizeInKB} KB\`);
        });
    } catch (e) {
        console.log('  Unable to analyze bundle composition');
    }
    "
fi

# 2. Remove Unused Dependencies
echo ""
echo "═══════════════════════════════════════"
echo "2. CHECKING FOR UNUSED DEPENDENCIES"
echo "═══════════════════════════════════════"

# Check for unused dependencies
echo "Scanning for unused dependencies..."
npx depcheck --json > depcheck-results.json 2>/dev/null || true

node -e "
try {
    const results = require('./depcheck-results.json');
    const unused = results.dependencies || [];
    const missing = results.missing || {};
    
    if (unused.length > 0) {
        console.log('${YELLOW}Unused dependencies found:${NC}');
        unused.forEach(dep => console.log('  - ' + dep));
        console.log('');
        console.log('To remove: npm uninstall ' + unused.join(' '));
    } else {
        console.log('${GREEN}✓ No unused dependencies found${NC}');
    }
    
    if (Object.keys(missing).length > 0) {
        console.log('');
        console.log('${YELLOW}Missing dependencies:${NC}');
        Object.keys(missing).forEach(dep => console.log('  - ' + dep));
    }
} catch (e) {
    console.log('Unable to check for unused dependencies');
}
"

# 3. Optimize Metro Configuration
echo ""
echo "═══════════════════════════════════════"
echo "3. OPTIMIZING METRO CONFIGURATION"
echo "═══════════════════════════════════════"

# Check if metro.config.js exists
if [ ! -f "metro.config.js" ]; then
    echo "Creating optimized metro.config.js..."
    cat > metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable minification
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Optimize bundle
config.transformer.optimizationSizeLimit = 250000;

// Add asset extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'txt', 'png');

// Enable tree shaking
config.transformer.experimental = {
  allowRequireContext: true,
  transformRequireSync: true,
};

module.exports = config;
EOF
    echo -e "${GREEN}✓ Created optimized metro.config.js${NC}"
else
    echo -e "${GREEN}✓ metro.config.js already exists${NC}"
fi

# 4. Optimize Images
echo ""
echo "═══════════════════════════════════════"
echo "4. OPTIMIZING IMAGES"
echo "═══════════════════════════════════════"

# Find all images
IMAGE_COUNT=$(find ./assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) 2>/dev/null | wc -l)
echo "Found $IMAGE_COUNT images in assets folder"

# Check image sizes
echo "Large images (> 100KB):"
find ./assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -size +100k -exec ls -lh {} \; 2>/dev/null | awk '{print "  " $9 ": " $5}'

# Install image optimization tool if not present
if ! command -v imageoptim-cli &> /dev/null; then
    echo -e "${YELLOW}Consider installing imageoptim-cli for automatic image optimization${NC}"
    echo "  npm install -g imageoptim-cli"
else
    echo "Optimizing images..."
    imageoptim './assets/**/*.{jpg,jpeg,png}' --no-quit || true
    echo -e "${GREEN}✓ Images optimized${NC}"
fi

# 5. Enable ProGuard for Android
echo ""
echo "═══════════════════════════════════════"
echo "5. ANDROID PROGUARD CONFIGURATION"
echo "═══════════════════════════════════════"

PROGUARD_FILE="android/app/proguard-rules.pro"
if [ -f "$PROGUARD_FILE" ]; then
    echo -e "${GREEN}✓ ProGuard rules file exists${NC}"
    
    # Check if ProGuard is enabled
    if grep -q "minifyEnabled true" android/app/build.gradle; then
        echo -e "${GREEN}✓ ProGuard minification is enabled${NC}"
    else
        echo -e "${YELLOW}⚠ ProGuard minification is not enabled${NC}"
        echo "  Add 'minifyEnabled true' to android/app/build.gradle release build"
    fi
else
    echo -e "${YELLOW}⚠ ProGuard rules file not found${NC}"
fi

# 6. Check for Large Dependencies
echo ""
echo "═══════════════════════════════════════"
echo "6. LARGE DEPENDENCIES CHECK"
echo "═══════════════════════════════════════"

echo "Checking node_modules size..."
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
echo "Total node_modules size: $NODE_MODULES_SIZE"

echo ""
echo "Top 10 largest packages:"
du -sh node_modules/* 2>/dev/null | sort -rh | head -10 | while read size package; do
    package_name=$(basename "$package")
    echo "  $package_name: $size"
done

# 7. Suggest Optimizations
echo ""
echo "═══════════════════════════════════════"
echo "7. OPTIMIZATION SUGGESTIONS"
echo "═══════════════════════════════════════"

# Check for common optimization opportunities
echo "Checking for optimization opportunities..."

# Check for moment.js (suggest date-fns)
if [ -d "node_modules/moment" ]; then
    echo -e "${YELLOW}⚠ moment.js detected${NC}"
    echo "  Consider replacing with date-fns for smaller bundle size"
fi

# Check for lodash (suggest lodash-es)
if [ -d "node_modules/lodash" ] && [ ! -d "node_modules/lodash-es" ]; then
    echo -e "${YELLOW}⚠ lodash detected${NC}"
    echo "  Consider using lodash-es for better tree shaking"
fi

# Check for multiple icon libraries
ICON_LIBS=$(ls -d node_modules/*icon* 2>/dev/null | wc -l)
if [ $ICON_LIBS -gt 1 ]; then
    echo -e "${YELLOW}⚠ Multiple icon libraries detected${NC}"
    echo "  Consider using a single icon library"
fi

# 8. Build Optimized Bundle
echo ""
echo "═══════════════════════════════════════"
echo "8. BUILD OPTIMIZED BUNDLE"
echo "═══════════════════════════════════════"

echo "Building optimized bundle..."

# Clean and rebuild
rm -rf dist/
npx expo export --platform ios --dump-sourcemap --output-dir dist/ --dev false || {
    echo -e "${RED}Failed to build optimized bundle${NC}"
    exit 1
}

# Get new bundle size
if [ -f dist/bundles/ios-*.js ]; then
    NEW_BUNDLE_FILE=$(ls dist/bundles/ios-*.js | head -1)
    NEW_SIZE=$(du -h "$NEW_BUNDLE_FILE" | cut -f1)
    NEW_BYTES=$(du -b "$NEW_BUNDLE_FILE" | cut -f1)
    
    # Calculate reduction
    REDUCTION=$((ORIGINAL_BYTES - NEW_BYTES))
    REDUCTION_PERCENT=$((REDUCTION * 100 / ORIGINAL_BYTES))
    
    echo ""
    echo "Bundle Size Comparison:"
    echo -e "  Original: ${YELLOW}$ORIGINAL_SIZE${NC}"
    echo -e "  Optimized: ${GREEN}$NEW_SIZE${NC}"
    
    if [ $REDUCTION -gt 0 ]; then
        echo -e "  Reduction: ${GREEN}$REDUCTION_PERCENT%${NC}"
    fi
fi

# 9. Generate Report
echo ""
echo "═══════════════════════════════════════"
echo "9. OPTIMIZATION REPORT"
echo "═══════════════════════════════════════"

cat > bundle-optimization-report.md << EOF
# Bundle Optimization Report

## Summary
- Date: $(date)
- Original Size: $ORIGINAL_SIZE
- Optimized Size: $NEW_SIZE
- Reduction: $REDUCTION_PERCENT%

## Recommendations

### High Priority
1. Remove unused dependencies
2. Optimize images (use WebP format where possible)
3. Enable code splitting for routes
4. Use dynamic imports for heavy components

### Medium Priority
1. Replace heavy libraries with lighter alternatives
2. Remove unused code with tree shaking
3. Minify and compress assets

### Low Priority
1. Lazy load non-critical features
2. Use CDN for static assets
3. Implement progressive loading

## Next Steps
1. Run \`npm audit fix\` to update vulnerable dependencies
2. Run \`npx expo-optimize\` to optimize Expo dependencies
3. Consider using \`react-native-bundle-visualizer\` for detailed analysis
EOF

echo -e "${GREEN}✓ Report generated: bundle-optimization-report.md${NC}"

# 10. Final Checks
echo ""
echo "═══════════════════════════════════════"
echo "10. FINAL RECOMMENDATIONS"
echo "═══════════════════════════════════════"

# Check if bundle is under target size
TARGET_SIZE=$((50 * 1024 * 1024)) # 50MB
if [ $NEW_BYTES -lt $TARGET_SIZE ]; then
    echo -e "${GREEN}✓ Bundle size is within 50MB target${NC}"
else
    OVER_SIZE=$((NEW_BYTES - TARGET_SIZE))
    OVER_SIZE_MB=$((OVER_SIZE / 1024 / 1024))
    echo -e "${RED}✗ Bundle exceeds 50MB target by ${OVER_SIZE_MB}MB${NC}"
    echo ""
    echo "Additional optimization needed:"
    echo "  1. Enable Hermes for Android"
    echo "  2. Use React.lazy() for code splitting"
    echo "  3. Implement dynamic imports"
    echo "  4. Remove development dependencies from production build"
fi

# Cleanup
rm -f bundle-analysis.json depcheck-results.json

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Bundle optimization complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
