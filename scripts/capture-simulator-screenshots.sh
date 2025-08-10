#!/bin/bash

# TypeB Simulator Screenshot Capture Script
# Takes screenshots from iOS Simulator and prepares them for App Store

echo "📱 TypeB Simulator Screenshot Capture"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories
RAW_DIR="./simulator-screenshots-raw"
FINAL_DIR="./app-store-screenshots"
mkdir -p "$RAW_DIR"
mkdir -p "$FINAL_DIR"

# Check if simulator is running
if ! pgrep -x "Simulator" > /dev/null; then
    echo -e "${YELLOW}Starting iOS Simulator...${NC}"
    open -a Simulator
    sleep 5
fi

# Get the active simulator device ID
DEVICE_ID=$(xcrun simctl list devices booted -j | python3 -c "
import sys, json
data = json.load(sys.stdin)
devices = data.get('devices', {})
for device_list in devices.values():
    for device in device_list:
        if device.get('state') == 'Booted':
            print(device.get('udid', ''))
            sys.exit(0)
")

if [ -z "$DEVICE_ID" ]; then
    echo -e "${RED}No booted simulator found!${NC}"
    echo "Please start an iPhone simulator (preferably iPhone 15 Pro Max)"
    exit 1
fi

# Get device name for display
DEVICE_NAME=$(xcrun simctl list devices booted | grep Booted | head -1 | sed 's/.*(\(.*\)).*/\1/' | cut -d' ' -f1-3)
echo -e "${GREEN}Found simulator: $DEVICE_NAME (ID: $DEVICE_ID)${NC}"
echo ""

# Function to take a screenshot
take_screenshot() {
    local name=$1
    local filename="$RAW_DIR/${name}.png"
    
    echo "📸 Taking screenshot: $name"
    xcrun simctl io "$DEVICE_ID" screenshot "$filename"
    
    if [ -f "$filename" ]; then
        echo -e "${GREEN}✓${NC} Saved: $filename"
    else
        echo -e "${RED}✗${NC} Failed to capture $name"
    fi
}

# Function to wait for user
wait_for_user() {
    echo -e "${YELLOW}$1${NC}"
    echo "Press Enter when ready..."
    read -r
}

echo "================================================"
echo -e "${BLUE}SCREENSHOT CAPTURE INSTRUCTIONS${NC}"
echo "================================================"
echo ""
echo "I'll guide you through taking 5 screenshots."
echo "Make sure the app is running in the simulator."
echo ""

# Screenshot 1: Dashboard
wait_for_user "1. Navigate to the DASHBOARD with multiple tasks visible"
take_screenshot "01_dashboard"

# Screenshot 2: Task Creation
wait_for_user "2. Open the CREATE TASK screen and enable photo requirement"
take_screenshot "02_create_task"

# Screenshot 3: Family Screen
wait_for_user "3. Navigate to the FAMILY screen showing family members"
take_screenshot "03_family"

# Screenshot 4: Premium/Analytics
wait_for_user "4. Navigate to PREMIUM features or Analytics screen"
take_screenshot "04_premium"

# Screenshot 5: Rewards/Points
wait_for_user "5. Navigate to REWARDS or points/leaderboard screen"
take_screenshot "05_rewards"

echo ""
echo "================================================"
echo -e "${BLUE}Processing screenshots for App Store...${NC}"
echo "================================================"
echo ""

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    if ! command -v convert &> /dev/null; then
        echo -e "${YELLOW}Installing ImageMagick...${NC}"
        brew install imagemagick
    fi
fi

# Use magick if available, otherwise fall back to convert
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

# Process each screenshot
COUNTER=1
for screenshot in "$RAW_DIR"/*.png; do
    if [ -f "$screenshot" ]; then
        filename=$(basename "$screenshot" .png)
        output="$FINAL_DIR/app_store_screenshot_${COUNTER}.png"
        
        echo "Processing: $filename"
        
        # Get image dimensions
        dimensions=$($CONVERT_CMD identify -format "%wx%h" "$screenshot")
        width=$(echo $dimensions | cut -d'x' -f1)
        height=$(echo $dimensions | cut -d'x' -f2)
        
        # Determine the title based on screenshot name
        case $filename in
            *dashboard*)
                title="Manage Family Tasks"
                subtitle="Track everything in one place"
                ;;
            *create*)
                title="Photo Validation"
                subtitle="Verify task completion"
                ;;
            *family*)
                title="Family Organization"
                subtitle="Manage roles and members"
                ;;
            *premium*)
                title="Premium Analytics"
                subtitle="7-day free trial included"
                ;;
            *rewards*)
                title="Rewards & Points"
                subtitle="Motivate with gamification"
                ;;
            *)
                title="TypeB Family"
                subtitle="Task management made simple"
                ;;
        esac
        
        # Check if we need to resize (target: 1290x2796)
        if [ "$width" -ne 1290 ] || [ "$height" -ne 2796 ]; then
            echo "  Resizing from ${width}x${height} to 1290x2796..."
            
            # Create gradient background
            $CONVERT_CMD -size 1290x2796 \
                gradient:'#4F46E5'-'#7C3AED' \
                "$FINAL_DIR/temp_bg.png"
            
            # Resize screenshot to fit
            $CONVERT_CMD "$screenshot" \
                -resize 1100x2400 \
                "$FINAL_DIR/temp_screen.png"
            
            # Composite and add text
            $CONVERT_CMD "$FINAL_DIR/temp_bg.png" \
                "$FINAL_DIR/temp_screen.png" \
                -gravity center \
                -geometry +0+100 \
                -composite \
                -gravity North \
                -pointsize 80 \
                -font "Helvetica-Bold" \
                -fill white \
                -stroke '#1F2937' \
                -strokewidth 2 \
                -annotate +0+120 "$title" \
                -pointsize 50 \
                -font "Helvetica" \
                -fill white \
                -annotate +0+230 "$subtitle" \
                "$output"
            
            # Clean up temp files
            rm -f "$FINAL_DIR/temp_bg.png" "$FINAL_DIR/temp_screen.png"
        else
            # Already correct size, just add text overlay
            $CONVERT_CMD "$screenshot" \
                -gravity North \
                -pointsize 80 \
                -font "Helvetica-Bold" \
                -fill white \
                -stroke '#4F46E5' \
                -strokewidth 3 \
                -annotate +0+150 "$title" \
                -pointsize 50 \
                -font "Helvetica" \
                -fill white \
                -stroke '#4F46E5' \
                -strokewidth 2 \
                -annotate +0+280 "$subtitle" \
                "$output"
        fi
        
        echo -e "${GREEN}✓${NC} Created: $output"
        ((COUNTER++))
    fi
done

# Create preview HTML
cat > "$FINAL_DIR/preview.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TypeB App Store Screenshots</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            margin: 0;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 40px;
        }
        .screenshots {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
        }
        .screenshot {
            background: white;
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .screenshot img {
            width: 100%;
            height: auto;
            border-radius: 10px;
        }
        .screenshot h3 {
            margin: 15px 0 5px 0;
            color: #333;
        }
        .info {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .info h2 {
            color: #4F46E5;
            margin-top: 0;
        }
        .checklist {
            list-style: none;
            padding: 0;
        }
        .checklist li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 TypeB App Store Screenshots</h1>
        
        <div class="info">
            <h2>Ready for Upload!</h2>
            <ul class="checklist">
                <li>Screenshots are 1290 × 2796 pixels</li>
                <li>Professional text overlays added</li>
                <li>Brand colors applied</li>
                <li>Ready for App Store Connect</li>
            </ul>
        </div>
        
        <div class="screenshots">
EOF

# Add screenshot entries to HTML
for i in {1..5}; do
    if [ -f "$FINAL_DIR/app_store_screenshot_${i}.png" ]; then
        cat >> "$FINAL_DIR/preview.html" << EOF
            <div class="screenshot">
                <img src="app_store_screenshot_${i}.png" alt="Screenshot ${i}">
                <h3>Screenshot ${i}</h3>
            </div>
EOF
    fi
done

cat >> "$FINAL_DIR/preview.html" << 'EOF'
        </div>
    </div>
</body>
</html>
EOF

echo ""
echo "================================================"
echo -e "${GREEN}✅ Screenshots captured and processed!${NC}"
echo "================================================"
echo ""
echo "📁 Raw screenshots: $RAW_DIR/"
echo "📁 Final screenshots: $FINAL_DIR/"
echo ""
echo "🌐 Preview your screenshots:"
echo "   open $FINAL_DIR/preview.html"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review the screenshots in the preview"
echo "2. In App Store Connect, upload from $FINAL_DIR/"
echo "3. Upload at least 2-3 screenshots (or all 5)"
echo ""
echo "The screenshots are ready for App Store submission!"