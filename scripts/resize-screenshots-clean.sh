#!/bin/bash

# Simple App Store Screenshot Resizer
# Resizes screenshots to exact App Store dimensions without any overlays

echo "📱 Clean Screenshot Resizer for App Store"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo -e "${YELLOW}ImageMagick is not installed. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    else
        echo -e "${RED}Please install ImageMagick manually${NC}"
        exit 1
    fi
fi

# Create output directory
OUTPUT_DIR="./app-store-screenshots-clean"
mkdir -p "$OUTPUT_DIR"

echo "📏 Target dimensions: 1290 × 2796 pixels"
echo ""

# Find all Simulator Screenshot PNG files
shopt -s nullglob
SCREENSHOTS=("Simulator Screenshot"*.png)

if [ ${#SCREENSHOTS[@]} -eq 0 ]; then
    echo -e "${RED}No Simulator Screenshots found in current directory${NC}"
    echo ""
    echo "Please ensure your screenshots are in the typeb-family-app directory."
    echo "They should be named like: 'Simulator Screenshot - iPhone 16 Pro - 2025-08-10 at 12.02.37.png'"
    exit 1
fi

echo -e "${GREEN}Found ${#SCREENSHOTS[@]} screenshot(s) to process${NC}"
echo ""

# Process each screenshot
for i in "${!SCREENSHOTS[@]}"; do
    screenshot="${SCREENSHOTS[$i]}"
    index=$((i + 1))
    
    # Output filename
    output_file="$OUTPUT_DIR/screenshot_${index}.png"
    
    echo "Processing screenshot $index:"
    echo "  Input: $screenshot"
    
    # Get original dimensions
    dimensions=$(magick identify -format "%wx%h" "$screenshot" 2>/dev/null)
    echo "  Original size: $dimensions"
    
    # Resize to exact App Store dimensions
    # This will:
    # 1. Resize the image to fill 1290x2796 (using ^)
    # 2. Center and crop to exact dimensions
    # 3. Remove any alpha channel (App Store requirement)
    magick "$screenshot" \
        -resize 1290x2796^ \
        -gravity center \
        -extent 1290x2796 \
        -background white \
        -alpha remove \
        -alpha off \
        "$output_file"
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Saved as: $output_file"
        echo "  Final size: 1290×2796"
    else
        echo -e "  ${RED}✗${NC} Failed to process $screenshot"
    fi
    echo ""
done

echo -e "${GREEN}✅ Processing complete!${NC}"
echo ""
echo "📁 Clean screenshots location: $OUTPUT_DIR"
echo ""
echo "📤 Next steps:"
echo "1. Review screenshots in: $OUTPUT_DIR"
echo "2. In App Store Connect, go to your app's version"
echo "3. Navigate to 'Media Manager' or 'Screenshots'"
echo "4. Select 'iPhone 6.7\" Display' or 'iPhone 6.9\" Display'"
echo "5. Upload files from $OUTPUT_DIR in order:"
echo "   - screenshot_1.png (Dashboard)"
echo "   - screenshot_2.png (Family screen)"
echo "   - screenshot_3.png (Settings/Dark mode)"
echo "   - screenshot_4.png (Task creation)"
echo "   - screenshot_5.png (Premium features)"
echo ""
echo "Note: Screenshots are clean without any text overlays."
echo "They show your actual app interface at the correct dimensions."