#!/bin/bash

# TypeB Review Information Screenshot Generator
# Creates screenshots for the Review Information section in App Store Connect

echo "📱 TypeB Review Information Screenshot Generator"
echo "================================================"
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
OUTPUT_DIR="./review-screenshots"
mkdir -p "$OUTPUT_DIR"

echo "📐 Creating Review Information screenshots..."
echo ""
echo -e "${YELLOW}Note: Review Information screenshots need to show the subscription"
echo -e "offer as it appears in your app, typically on iPhone dimensions.${NC}"
echo ""

# Common iPhone screen dimensions for Review Information
# iPhone 15 Pro Max: 1290 × 2796 (6.7")
# iPhone 15 Pro: 1179 × 2556 (6.1")
# iPhone SE: 750 × 1334 (4.7")

# Create Premium Monthly Review Screenshot (iPhone dimensions)
echo "Creating Premium Monthly review screenshot..."
MONTHLY_REVIEW="$OUTPUT_DIR/premium_monthly_review.png"

# Create iPhone-sized screenshot (1179 × 2556 for 6.1" display)
$CONVERT_CMD -size 1179x2556 \
    gradient:'#FFFFFF'-'#F3F4F6' \
    -gravity North \
    -pointsize 60 \
    -font "Helvetica-Bold" \
    -fill '#1F2937' \
    -annotate +0+200 "TypeB Premium" \
    -pointsize 40 \
    -font "Helvetica" \
    -fill '#6B7280' \
    -annotate +0+300 "Unlock all features" \
    \
    -gravity Center \
    -pointsize 50 \
    -font "Helvetica" \
    -fill '#1F2937' \
    -annotate +0+-400 "Monthly Subscription" \
    \
    \( -size 900x200 xc:white \
        -bordercolor '#E5E7EB' -border 2 \
        -fill '#4F46E5' \
        -pointsize 70 \
        -font "Helvetica-Bold" \
        -gravity Center \
        -annotate +0+0 "\$4.99/month" \) \
    -gravity Center \
    -geometry +0+-200 \
    -composite \
    \
    \( -size 900x150 xc:'#FEF3C7' \
        -bordercolor '#FCD34D' -border 2 \
        -fill '#92400E' \
        -pointsize 45 \
        -font "Helvetica-Bold" \
        -gravity Center \
        -annotate +0+0 "7-DAY FREE TRIAL" \) \
    -gravity Center \
    -geometry +0+0 \
    -composite \
    \
    -gravity Center \
    -pointsize 35 \
    -font "Helvetica" \
    -fill '#6B7280' \
    -annotate +0+200 "✓ Unlimited family members" \
    -annotate +0+260 "✓ Advanced analytics" \
    -annotate +0+320 "✓ Custom rewards" \
    -annotate +0+380 "✓ Priority support" \
    -annotate +0+440 "✓ No advertisements" \
    \
    -gravity South \
    -pointsize 30 \
    -fill '#9CA3AF' \
    -annotate +0+300 "Cancel anytime in Settings" \
    -annotate +0+250 "Renews automatically" \
    \
    \( -size 900x100 xc:'#4F46E5' \
        -fill white \
        -pointsize 40 \
        -font "Helvetica-Bold" \
        -gravity Center \
        -annotate +0+0 "Start Free Trial" \) \
    -gravity South \
    -geometry +0+100 \
    -composite \
    "$MONTHLY_REVIEW"

echo -e "${GREEN}✓${NC} Created: $MONTHLY_REVIEW"

# Create Premium Annual Review Screenshot
echo "Creating Premium Annual review screenshot..."
ANNUAL_REVIEW="$OUTPUT_DIR/premium_annual_review.png"

$CONVERT_CMD -size 1179x2556 \
    gradient:'#FFFFFF'-'#F3F4F6' \
    -gravity North \
    -pointsize 60 \
    -font "Helvetica-Bold" \
    -fill '#1F2937' \
    -annotate +0+200 "TypeB Premium" \
    -pointsize 40 \
    -font "Helvetica" \
    -fill '#6B7280' \
    -annotate +0+300 "Unlock all features" \
    \
    -gravity Center \
    -pointsize 50 \
    -font "Helvetica" \
    -fill '#1F2937' \
    -annotate +0+-400 "Annual Subscription" \
    \
    \( -size 900x200 xc:white \
        -bordercolor '#E5E7EB' -border 2 \
        -fill '#059669' \
        -pointsize 70 \
        -font "Helvetica-Bold" \
        -gravity Center \
        -annotate +0+-20 "\$39.99/year" \
        -pointsize 35 \
        -fill '#10B981' \
        -annotate +0+40 "Save 33%" \) \
    -gravity Center \
    -geometry +0+-200 \
    -composite \
    \
    \( -size 900x150 xc:'#FEF3C7' \
        -bordercolor '#FCD34D' -border 2 \
        -fill '#92400E' \
        -pointsize 45 \
        -font "Helvetica-Bold" \
        -gravity Center \
        -annotate +0+0 "7-DAY FREE TRIAL" \) \
    -gravity Center \
    -geometry +0+0 \
    -composite \
    \
    -gravity Center \
    -pointsize 35 \
    -font "Helvetica" \
    -fill '#6B7280' \
    -annotate +0+200 "✓ Unlimited family members" \
    -annotate +0+260 "✓ Advanced analytics" \
    -annotate +0+320 "✓ Custom rewards" \
    -annotate +0+380 "✓ Priority support" \
    -annotate +0+440 "✓ No advertisements" \
    \
    -gravity South \
    -pointsize 30 \
    -fill '#9CA3AF' \
    -annotate +0+300 "Best value • Cancel anytime" \
    -annotate +0+250 "Renews automatically" \
    \
    \( -size 900x100 xc:'#059669' \
        -fill white \
        -pointsize 40 \
        -font "Helvetica-Bold" \
        -gravity Center \
        -annotate +0+0 "Start Free Trial" \) \
    -gravity South \
    -geometry +0+100 \
    -composite \
    "$ANNUAL_REVIEW"

echo -e "${GREEN}✓${NC} Created: $ANNUAL_REVIEW"

# Create a simple subscription selection screen
echo "Creating subscription selection screen..."
SELECTION_SCREEN="$OUTPUT_DIR/subscription_selection_review.png"

$CONVERT_CMD -size 1179x2556 \
    xc:'#F9FAFB' \
    -gravity North \
    -pointsize 60 \
    -font "Helvetica-Bold" \
    -fill '#1F2937' \
    -annotate +0+150 "Choose Your Plan" \
    -pointsize 35 \
    -font "Helvetica" \
    -fill '#6B7280' \
    -annotate +0+250 "Start with a 7-day free trial" \
    \
    \( -size 1000x300 xc:white \
        -bordercolor '#4F46E5' -border 3 \
        -fill '#4F46E5' \
        -pointsize 45 \
        -font "Helvetica-Bold" \
        -gravity West \
        -annotate +50+0 "Monthly" \
        -gravity East \
        -annotate -50+-30 "\$4.99" \
        -pointsize 30 \
        -fill '#6B7280' \
        -annotate -50+20 "per month" \) \
    -gravity Center \
    -geometry +0+-300 \
    -composite \
    \
    \( -size 1000x300 xc:white \
        -bordercolor '#059669' -border 3 \
        -fill '#059669' \
        -pointsize 45 \
        -font "Helvetica-Bold" \
        -gravity West \
        -annotate +50+-30 "Annual" \
        -pointsize 30 \
        -fill '#10B981' \
        -annotate +50+20 "SAVE 33%" \
        -gravity East \
        -fill '#059669' \
        -pointsize 45 \
        -font "Helvetica-Bold" \
        -annotate -50+-30 "\$39.99" \
        -pointsize 30 \
        -fill '#6B7280' \
        -annotate -50+20 "per year" \) \
    -gravity Center \
    -geometry +0+100 \
    -composite \
    \
    -gravity South \
    -pointsize 28 \
    -font "Helvetica" \
    -fill '#9CA3AF' \
    -annotate +0+200 "• 7-day free trial included" \
    -annotate +0+160 "• Cancel anytime" \
    -annotate +0+120 "• Renews automatically" \
    "$SELECTION_SCREEN"

echo -e "${GREEN}✓${NC} Created: $SELECTION_SCREEN"

# Create HTML preview
cat > "$OUTPUT_DIR/preview.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TypeB Review Information Screenshots</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            padding: 40px;
            margin: 0;
        }
        .container {
            max-width: 1400px;
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
        .warning {
            background: #FEF3C7;
            border: 1px solid #FCD34D;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning h3 {
            margin-top: 0;
            color: #92400E;
        }
        .screenshots {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .screenshot-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
        }
        .screenshot-card img {
            max-width: 100%;
            height: auto;
            max-height: 600px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .screenshot-card h3 {
            margin: 15px 0 5px 0;
            color: #1f2937;
        }
        .screenshot-card p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
        }
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        .usage {
            background: #EFF6FF;
            border: 1px solid #3B82F6;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 TypeB Review Information Screenshots</h1>
        
        <div class="info">
            <h2>What are Review Information Screenshots?</h2>
            <p>These screenshots are specifically for the <strong>Review Information</strong> section of each subscription in App Store Connect. They help Apple reviewers understand how your subscription appears to users in your app.</p>
            
            <div class="warning">
                <h3>⚠️ Important Distinction</h3>
                <p><strong>Review Information Screenshot</strong> ≠ <strong>Promotional Image</strong></p>
                <ul>
                    <li><strong>Promotional Image:</strong> 1024×1024 square image for App Store promotion</li>
                    <li><strong>Review Screenshot:</strong> iPhone-sized screenshot showing the actual subscription UI in your app</li>
                </ul>
            </div>
            
            <div class="usage">
                <h3>📍 Where to Upload These</h3>
                <ol>
                    <li>Go to <strong>Monetization → Subscriptions</strong></li>
                    <li>Select your subscription (Premium Monthly or Premium Annual)</li>
                    <li>Scroll to <strong>"Review Information"</strong> section</li>
                    <li>Under <strong>"Screenshot"</strong>, click "Choose File"</li>
                    <li>Upload the appropriate review screenshot</li>
                    <li>Add Review Notes explaining the subscription</li>
                </ol>
            </div>
        </div>
        
        <div class="screenshots">
            <div class="screenshot-card">
                <img src="premium_monthly_review.png" alt="Premium Monthly Review">
                <h3>Premium Monthly Review</h3>
                <p>Use for: premium_monthly subscription</p>
                <p>Shows: $4.99/month with 7-day trial</p>
                <p>Dimensions: 1179×2556 (iPhone)</p>
            </div>
            
            <div class="screenshot-card">
                <img src="premium_annual_review.png" alt="Premium Annual Review">
                <h3>Premium Annual Review</h3>
                <p>Use for: premium_annual subscription</p>
                <p>Shows: $39.99/year with 7-day trial</p>
                <p>Highlights: 33% savings</p>
                <p>Dimensions: 1179×2556 (iPhone)</p>
            </div>
            
            <div class="screenshot-card">
                <img src="subscription_selection_review.png" alt="Subscription Selection">
                <h3>Subscription Selection Screen</h3>
                <p>Alternative: Shows both options</p>
                <p>Can be used for either subscription</p>
                <p>Dimensions: 1179×2556 (iPhone)</p>
            </div>
        </div>
        
        <div class="info" style="margin-top: 30px;">
            <h2>✅ Review Notes Template</h2>
            <p>Copy and paste this into the "Review Notes" field:</p>
            <code style="display: block; padding: 15px; white-space: pre-wrap;">This subscription unlocks premium features including:
- Unlimited family members (free tier limited to 5)
- Advanced analytics and insights
- Custom reward systems
- Priority support
- Ad-free experience

New users receive a 7-day free trial. The subscription auto-renews monthly at $4.99 (or annually at $39.99) unless cancelled 24 hours before the trial ends. Users can manage subscriptions in their Apple ID settings.</code>
        </div>
    </div>
</body>
</html>
EOF

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Review screenshots created successfully!${NC}"
echo "=================================================="
echo ""
echo "📁 Screenshots saved to: $OUTPUT_DIR/"
echo ""
echo "Files created:"
echo "  • premium_monthly_review.png (1179×2556)"
echo "  • premium_annual_review.png (1179×2556)"
echo "  • subscription_selection_review.png (1179×2556)"
echo ""
echo "🌐 Preview your screenshots:"
echo "   open $OUTPUT_DIR/preview.html"
echo ""
echo -e "${BLUE}These are for the Review Information section, NOT the Promotional Image section${NC}"
echo ""
echo "Next steps:"
echo "1. Upload to Review Information → Screenshot (not Promotional Image)"
echo "2. Add Review Notes explaining the subscription"
echo "3. Save the subscription"