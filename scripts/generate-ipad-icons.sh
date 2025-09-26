#!/bin/bash

# Generate iPad icon sizes for iOS app
# This script creates the required 152x152 and 167x167 icons for iPad

echo "🎨 Generating iPad icon sizes..."

# Check if the source icon exists
if [ ! -f "assets/icon.png" ]; then
    echo "❌ Error: assets/icon.png not found!"
    exit 1
fi

# Check if sips is available (macOS built-in tool)
if ! command -v sips &> /dev/null; then
    echo "❌ Error: sips command not found. This script requires macOS."
    exit 1
fi

# Create the AppIcon.appiconset directory if it doesn't exist
ICON_DIR="ios/TypeBFamily/Images.xcassets/AppIcon.appiconset"
mkdir -p "$ICON_DIR"

echo "📱 Generating iPad icons..."

# Generate iPad 76x76 @2x (152x152)
sips -z 152 152 assets/icon.png --out "$ICON_DIR/Icon-76@2x.png" > /dev/null 2>&1
echo "✅ Created Icon-76@2x.png (152x152)"

# Generate iPad Pro 83.5x83.5 @2x (167x167)
sips -z 167 167 assets/icon.png --out "$ICON_DIR/Icon-83.5@2x.png" > /dev/null 2>&1
echo "✅ Created Icon-83.5@2x.png (167x167)"

# Also generate other common iOS icon sizes if they don't exist
echo ""
echo "📱 Generating other iOS icon sizes..."

# iPhone icons
sips -z 40 40 assets/icon.png --out "$ICON_DIR/Icon-20@2x.png" > /dev/null 2>&1
echo "✅ Created Icon-20@2x.png (40x40)"

sips -z 60 60 assets/icon.png --out "$ICON_DIR/Icon-20@3x.png" > /dev/null 2>&1
echo "✅ Created Icon-20@3x.png (60x60)"

sips -z 58 58 assets/icon.png --out "$ICON_DIR/Icon-29@2x.png" > /dev/null 2>&1
echo "✅ Created Icon-29@2x.png (58x58)"

sips -z 87 87 assets/icon.png --out "$ICON_DIR/Icon-29@3x.png" > /dev/null 2>&1
echo "✅ Created Icon-29@3x.png (87x87)"

sips -z 80 80 assets/icon.png --out "$ICON_DIR/Icon-40@2x.png" > /dev/null 2>&1
echo "✅ Created Icon-40@2x.png (80x80)"

sips -z 120 120 assets/icon.png --out "$ICON_DIR/Icon-40@3x.png" > /dev/null 2>&1
echo "✅ Created Icon-40@3x.png (120x120)"

sips -z 120 120 assets/icon.png --out "$ICON_DIR/Icon-60@2x.png" > /dev/null 2>&1
echo "✅ Created Icon-60@2x.png (120x120)"

sips -z 180 180 assets/icon.png --out "$ICON_DIR/Icon-60@3x.png" > /dev/null 2>&1
echo "✅ Created Icon-60@3x.png (180x180)"

# App Store icon
sips -z 1024 1024 assets/icon.png --out "$ICON_DIR/Icon-1024.png" > /dev/null 2>&1
echo "✅ Created Icon-1024.png (1024x1024)"

# iPad specific icons
sips -z 20 20 assets/icon.png --out "$ICON_DIR/Icon-20.png" > /dev/null 2>&1
echo "✅ Created Icon-20.png (20x20)"

sips -z 29 29 assets/icon.png --out "$ICON_DIR/Icon-29.png" > /dev/null 2>&1
echo "✅ Created Icon-29.png (29x29)"

sips -z 40 40 assets/icon.png --out "$ICON_DIR/Icon-40.png" > /dev/null 2>&1
echo "✅ Created Icon-40.png (40x40)"

sips -z 76 76 assets/icon.png --out "$ICON_DIR/Icon-76.png" > /dev/null 2>&1
echo "✅ Created Icon-76.png (76x76)"

echo ""
echo "✅ All iPad icons generated successfully!"
echo ""
echo "The icons have been placed in:"
echo "  $ICON_DIR"
echo ""
echo "Next steps:"
echo "1. The icons are now ready for the build"
echo "2. Run: eas build --platform ios --profile production"
echo "3. Submit to TestFlight: eas submit --platform ios --latest"