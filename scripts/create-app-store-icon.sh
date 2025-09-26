#!/bin/bash

# TypeB App Store Icon Generator
# Creates a 1024x1024 app icon for App Store Connect

echo "🎨 TypeB App Store Icon Generator"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    if ! command -v convert &> /dev/null; then
        echo -e "${YELLOW}ImageMagick is not installed. Installing...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install imagemagick
        else
            echo -e "${RED}Please install ImageMagick manually${NC}"
            exit 1
        fi
    fi
fi

# Use magick if available, otherwise fall back to convert
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

# Create output directory
OUTPUT_DIR="./app-store-icon"
mkdir -p "$OUTPUT_DIR"

echo "📐 Creating 1024x1024 App Store icon..."
echo ""

# Check if source logo exists
SOURCE_LOGO="../assets/type_b_logo.png"
if [ ! -f "$SOURCE_LOGO" ]; then
    echo -e "${YELLOW}Source logo not found. Creating from scratch...${NC}"
    
    # Create TypeB icon from scratch
    ICON_PATH="$OUTPUT_DIR/AppIcon-1024x1024.png"
    
    # Create gradient background with TypeB brand colors
    $CONVERT_CMD -size 1024x1024 \
        gradient:'#4F46E5'-'#7C3AED' \
        -gravity center \
        -font "Helvetica-Bold" \
        -pointsize 420 \
        -fill white \
        -annotate +0+-50 "B" \
        -pointsize 120 \
        -font "Helvetica" \
        -fill white \
        -annotate +0+200 "TypeB" \
        "$ICON_PATH"
    
    echo -e "${GREEN}✓${NC} Created: $ICON_PATH"
else
    echo "Found source logo. Processing..."
    
    # Create icon from existing logo
    ICON_PATH="$OUTPUT_DIR/AppIcon-1024x1024.png"
    
    # Create gradient background
    $CONVERT_CMD -size 1024x1024 \
        gradient:'#4F46E5'-'#7C3AED' \
        \( "$SOURCE_LOGO" -resize 600x600 \) \
        -gravity center \
        -composite \
        "$ICON_PATH"
    
    echo -e "${GREEN}✓${NC} Created: $ICON_PATH"
fi

# Create alternative solid background version
ICON_SOLID="$OUTPUT_DIR/AppIcon-1024x1024-solid.png"
$CONVERT_CMD -size 1024x1024 \
    xc:'#4F46E5' \
    -gravity center \
    -font "Helvetica-Bold" \
    -pointsize 420 \
    -fill white \
    -annotate +0+-50 "B" \
    -pointsize 120 \
    -font "Helvetica" \
    -fill white \
    -annotate +0+200 "TypeB" \
    "$ICON_SOLID"

echo -e "${GREEN}✓${NC} Created: $ICON_SOLID (alternative)"

# Create a clean minimal version
ICON_MINIMAL="$OUTPUT_DIR/AppIcon-1024x1024-minimal.png"
$CONVERT_CMD -size 1024x1024 \
    xc:white \
    -gravity center \
    -font "Helvetica-Bold" \
    -pointsize 500 \
    -fill '#4F46E5' \
    -annotate +0+0 "B" \
    "$ICON_MINIMAL"

echo -e "${GREEN}✓${NC} Created: $ICON_MINIMAL (minimal version)"

# Verify dimensions and format
echo ""
echo "Verifying icon requirements..."
for icon in "$OUTPUT_DIR"/*.png; do
    if [ -f "$icon" ]; then
        dimensions=$($CONVERT_CMD identify -format "%wx%h" "$icon")
        if [ "$dimensions" = "1024x1024" ]; then
            echo -e "${GREEN}✓${NC} $(basename "$icon"): $dimensions - Valid"
        else
            echo -e "${RED}✗${NC} $(basename "$icon"): $dimensions - Invalid dimensions"
        fi
    fi
done

echo ""
echo "=================================================="
echo -e "${GREEN}✅ App Store icon created successfully!${NC}"
echo "=================================================="
echo ""
echo "📁 Icon saved to: $OUTPUT_DIR/"
echo ""
echo "Available icons:"
echo "  • AppIcon-1024x1024.png (gradient background)"
echo "  • AppIcon-1024x1024-solid.png (solid background)"
echo "  • AppIcon-1024x1024-minimal.png (minimal white)"
echo ""
echo -e "${BLUE}App Store Requirements:${NC}"
echo "  ✓ 1024 × 1024 pixels"
echo "  ✓ 72 dpi, RGB"
echo "  ✓ No transparency"
echo "  ✓ No rounded corners"
echo ""
echo -e "${YELLOW}Where to upload in App Store Connect:${NC}"
echo "1. Go to your app → App Store → iOS App"
echo "2. Select version 1.1.0"
echo "3. Scroll to 'App Icon' section"
echo "4. Click 'Choose File'"
echo "5. Upload AppIcon-1024x1024.png"
echo ""
echo "The icon must match the one in your app binary."