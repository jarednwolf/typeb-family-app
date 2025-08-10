#!/bin/bash

# TypeB Subscription Promotional Image Generator
# Creates 1024x1024 promotional images for App Store subscriptions

echo "🎨 TypeB Subscription Promotional Image Generator"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}ImageMagick is not installed. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    else
        echo -e "${RED}Please install ImageMagick manually${NC}"
        exit 1
    fi
fi

# Create output directory
OUTPUT_DIR="./subscription-promo-images"
mkdir -p "$OUTPUT_DIR"

echo "📐 Creating 1024x1024 promotional images..."
echo ""

# Function to create gradient background
create_gradient_background() {
    local output_file=$1
    local gradient_start=$2
    local gradient_end=$3
    
    convert -size 1024x1024 \
        gradient:"$gradient_start"-"$gradient_end" \
        "$output_file"
}

# Function to add centered text
add_centered_text() {
    local input_file=$1
    local output_file=$2
    local main_text=$3
    local sub_text=$4
    local price_text=$5
    
    convert "$input_file" \
        -gravity North \
        -pointsize 120 \
        -font "Helvetica-Bold" \
        -fill white \
        -annotate +0+180 "$main_text" \
        -pointsize 60 \
        -font "Helvetica" \
        -fill white \
        -annotate +0+340 "$sub_text" \
        -gravity Center \
        -pointsize 140 \
        -font "Helvetica-Bold" \
        -fill white \
        -annotate +0+0 "$price_text" \
        -gravity South \
        -pointsize 50 \
        -font "Helvetica" \
        -fill white \
        -annotate +0+180 "7-Day Free Trial" \
        -pointsize 40 \
        -annotate +0+120 "Then auto-renews" \
        "$output_file"
}

# Create Premium Monthly promotional image
echo "Creating Premium Monthly image..."
MONTHLY_BG="$OUTPUT_DIR/monthly_bg.png"
MONTHLY_FINAL="$OUTPUT_DIR/premium_monthly_promo.png"

# Create gradient background (purple to blue)
create_gradient_background "$MONTHLY_BG" "#6B46C1" "#2563EB"

# Add text and icons
convert "$MONTHLY_BG" \
    -gravity North \
    -pointsize 100 \
    -font "Helvetica-Bold" \
    -fill white \
    -annotate +0+120 "TypeB" \
    -pointsize 80 \
    -annotate +0+240 "Premium" \
    -gravity Center \
    -pointsize 160 \
    -font "Helvetica-Bold" \
    -fill white \
    -stroke '#1F2937' \
    -strokewidth 3 \
    -annotate +0+-50 "\$4.99" \
    -pointsize 60 \
    -font "Helvetica" \
    -fill white \
    -stroke none \
    -annotate +0+80 "per month" \
    -gravity South \
    -pointsize 55 \
    -font "Helvetica-Bold" \
    -fill "#FCD34D" \
    -annotate +0+200 "7-DAY FREE TRIAL" \
    -pointsize 40 \
    -font "Helvetica" \
    -fill white \
    -annotate +0+140 "Cancel anytime" \
    -pointsize 35 \
    -annotate +0+80 "Unlimited family • Analytics • No ads" \
    "$MONTHLY_FINAL"

echo -e "${GREEN}✓${NC} Created: $MONTHLY_FINAL"

# Create Premium Annual promotional image
echo "Creating Premium Annual image..."
ANNUAL_BG="$OUTPUT_DIR/annual_bg.png"
ANNUAL_FINAL="$OUTPUT_DIR/premium_annual_promo.png"

# Create gradient background (green to purple)
create_gradient_background "$ANNUAL_BG" "#059669" "#7C3AED"

# Add text with savings highlight
convert "$ANNUAL_BG" \
    -gravity North \
    -pointsize 100 \
    -font "Helvetica-Bold" \
    -fill white \
    -annotate +0+120 "TypeB" \
    -pointsize 80 \
    -annotate +0+240 "Premium" \
    -gravity Center \
    -pointsize 160 \
    -font "Helvetica-Bold" \
    -fill white \
    -stroke '#1F2937' \
    -strokewidth 3 \
    -annotate +0+-100 "\$39.99" \
    -pointsize 60 \
    -font "Helvetica" \
    -fill white \
    -stroke none \
    -annotate +0+30 "per year" \
    -pointsize 50 \
    -font "Helvetica-Bold" \
    -fill "#FCD34D" \
    -annotate +0+120 "SAVE 33%" \
    -gravity South \
    -pointsize 55 \
    -font "Helvetica-Bold" \
    -fill "#FCD34D" \
    -annotate +0+200 "7-DAY FREE TRIAL" \
    -pointsize 40 \
    -font "Helvetica" \
    -fill white \
    -annotate +0+140 "Best value • Cancel anytime" \
    -pointsize 35 \
    -annotate +0+80 "Unlimited family • Analytics • No ads" \
    "$ANNUAL_FINAL"

echo -e "${GREEN}✓${NC} Created: $ANNUAL_FINAL"

# Create a simple version with app icon style
echo "Creating simple promotional image..."
SIMPLE_FINAL="$OUTPUT_DIR/premium_simple_promo.png"

# Create clean gradient
convert -size 1024x1024 \
    gradient:'#4F46E5'-'#9333EA' \
    -gravity Center \
    -pointsize 200 \
    -font "Helvetica-Bold" \
    -fill white \
    -annotate +0+-200 "TypeB" \
    -pointsize 100 \
    -font "Helvetica" \
    -annotate +0+-50 "Premium" \
    -pointsize 80 \
    -font "Helvetica-Bold" \
    -fill "#FCD34D" \
    -annotate +0+100 "7 Days Free" \
    -pointsize 60 \
    -font "Helvetica" \
    -fill white \
    -annotate +0+200 "Then \$4.99/mo" \
    "$SIMPLE_FINAL"

echo -e "${GREEN}✓${NC} Created: $SIMPLE_FINAL"

# Clean up temporary files
rm -f "$MONTHLY_BG" "$ANNUAL_BG"

# Create HTML preview
cat > "$OUTPUT_DIR/preview.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TypeB Subscription Promotional Images</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            padding: 40px;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #1f2937;
            text-align: center;
            margin-bottom: 20px;
        }
        .info {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .info h2 {
            color: #4F46E5;
            margin-top: 0;
        }
        .info ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .info li {
            margin: 5px 0;
        }
        .images {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .image-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .image-card img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .image-card h3 {
            margin: 15px 0 5px 0;
            color: #1f2937;
        }
        .image-card p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
        }
        .requirements {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        .requirements h3 {
            margin-top: 0;
            color: #92400e;
        }
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 TypeB Subscription Promotional Images</h1>
        
        <div class="info">
            <h2>App Store Requirements</h2>
            <ul>
                <li>✅ Format: JPG or PNG</li>
                <li>✅ Dimensions: 1024 × 1024 pixels</li>
                <li>✅ Resolution: 72 dpi</li>
                <li>✅ Color space: RGB</li>
                <li>✅ No rounded corners</li>
                <li>✅ No transparency</li>
            </ul>
            
            <div class="requirements">
                <h3>⚠️ Where to Upload</h3>
                <p>In App Store Connect, for each subscription:</p>
                <ol>
                    <li>Go to <strong>Monetization → Subscriptions</strong></li>
                    <li>Select your subscription (Premium Monthly or Premium Annual)</li>
                    <li>Look for <strong>"Promotional Image"</strong> section</li>
                    <li>Click <strong>"Choose File"</strong> and upload the appropriate image</li>
                    <li>This image will be used for App Store promotion and offer codes</li>
                </ol>
            </div>
        </div>
        
        <div class="images">
            <div class="image-card">
                <img src="premium_monthly_promo.png" alt="Premium Monthly">
                <h3>Premium Monthly</h3>
                <p>Use for: premium_monthly subscription</p>
                <p>Price: $4.99/month with 7-day trial</p>
            </div>
            
            <div class="image-card">
                <img src="premium_annual_promo.png" alt="Premium Annual">
                <h3>Premium Annual</h3>
                <p>Use for: premium_annual subscription</p>
                <p>Price: $39.99/year with 7-day trial</p>
                <p>Highlights: 33% savings</p>
            </div>
            
            <div class="image-card">
                <img src="premium_simple_promo.png" alt="Simple Premium">
                <h3>Simple Version</h3>
                <p>Alternative clean design</p>
                <p>Can be used for either subscription</p>
            </div>
        </div>
    </div>
</body>
</html>
EOF

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Promotional images created successfully!${NC}"
echo "=================================================="
echo ""
echo "📁 Images saved to: $OUTPUT_DIR/"
echo ""
echo "Files created:"
echo "  • premium_monthly_promo.png (1024×1024)"
echo "  • premium_annual_promo.png (1024×1024)"
echo "  • premium_simple_promo.png (1024×1024)"
echo ""
echo "🌐 Preview your images:"
echo "   open $OUTPUT_DIR/preview.html"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review the images in the preview"
echo "2. In App Store Connect, go to Monetization → Subscriptions"
echo "3. For each subscription, upload the promotional image"
echo "4. This fixes the 'Missing Metadata' issue"
echo ""
echo -e "${YELLOW}Note:${NC} These promotional images are different from app screenshots."
echo "They're specifically for subscription promotion on the App Store."