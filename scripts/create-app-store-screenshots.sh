#!/bin/bash

# TypeB App Store Screenshot Generator
# This script helps create professional screenshots for App Store submission

echo "🎨 TypeB App Store Screenshot Generator"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Create screenshots directory
SCREENSHOT_DIR="./app-store-screenshots"
mkdir -p "$SCREENSHOT_DIR"

echo "📱 Screenshot Requirements:"
echo "  - Size: 1290 × 2796 pixels (6.7\" display)"
echo "  - Format: PNG or JPEG"
echo "  - No alpha channel"
echo ""

# Function to add text overlay to screenshot
add_text_overlay() {
    local input_file=$1
    local output_file=$2
    local text=$3
    local subtitle=$4
    
    convert "$input_file" \
        -gravity North \
        -pointsize 72 \
        -font "Helvetica-Bold" \
        -fill white \
        -stroke black \
        -strokewidth 2 \
        -annotate +0+100 "$text" \
        -pointsize 48 \
        -font "Helvetica" \
        -annotate +0+200 "$subtitle" \
        "$output_file"
}

# Function to create gradient background
create_gradient_background() {
    local output_file=$1
    convert -size 1290x2796 \
        gradient:'#4F46E5'-'#7C3AED' \
        "$output_file"
}

# Function to composite screenshot onto background
composite_screenshot() {
    local screenshot=$1
    local background=$2
    local output=$3
    
    # Add device frame and composite
    convert "$background" \
        \( "$screenshot" -resize 1100x2400 \) \
        -gravity center \
        -composite \
        "$output"
}

echo "📸 Screenshot Templates:"
echo ""
echo "1. Dashboard Screenshot"
echo "   Title: 'Manage Family Tasks Effortlessly'"
echo "   Subtitle: 'Track everything in one place'"
echo ""
echo "2. Task Creation Screenshot"
echo "   Title: 'Photo Validation Ensures Completion'"
echo "   Subtitle: 'Verify tasks with photos'"
echo ""
echo "3. Family Management Screenshot"
echo "   Title: 'Organize Your Entire Family'"
echo "   Subtitle: 'Roles, permissions, and more'"
echo ""
echo "4. Premium Features Screenshot"
echo "   Title: 'Unlock Premium Analytics'"
echo "   Subtitle: '7-day free trial included'"
echo ""
echo "5. Rewards System Screenshot"
echo "   Title: 'Motivate with Rewards & Points'"
echo "   Subtitle: 'Gamify family tasks'"
echo ""

# Check for existing screenshots
echo -e "${YELLOW}Looking for screenshots in current directory...${NC}"
SCREENSHOTS=($(find . -maxdepth 1 -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" 2>/dev/null))

if [ ${#SCREENSHOTS[@]} -eq 0 ]; then
    echo -e "${RED}No screenshots found in current directory${NC}"
    echo ""
    echo "📱 How to take screenshots from TestFlight:"
    echo "1. Open TestFlight on your iPhone"
    echo "2. Navigate to each screen"
    echo "3. Press Volume Up + Side Button"
    echo "4. AirDrop to your Mac"
    echo "5. Run this script again"
else
    echo -e "${GREEN}Found ${#SCREENSHOTS[@]} screenshot(s)${NC}"
    echo ""
    echo "Processing screenshots..."
    
    # Process each screenshot
    for i in "${!SCREENSHOTS[@]}"; do
        screenshot="${SCREENSHOTS[$i]}"
        index=$((i + 1))
        
        # Create gradient background
        background="$SCREENSHOT_DIR/background_$index.png"
        create_gradient_background "$background"
        
        # Define text based on index
        case $index in
            1)
                title="Manage Family Tasks Effortlessly"
                subtitle="Track everything in one place"
                ;;
            2)
                title="Photo Validation Ensures Completion"
                subtitle="Verify tasks with photos"
                ;;
            3)
                title="Organize Your Entire Family"
                subtitle="Roles, permissions, and more"
                ;;
            4)
                title="Unlock Premium Analytics"
                subtitle="7-day free trial included"
                ;;
            5)
                title="Motivate with Rewards & Points"
                subtitle="Gamify family tasks"
                ;;
            *)
                title="TypeB Family"
                subtitle="Task management made simple"
                ;;
        esac
        
        # Create final screenshot
        output="$SCREENSHOT_DIR/app_store_screenshot_$index.png"
        
        # Resize to exact dimensions and add text
        convert "$screenshot" \
            -resize 1290x2796^ \
            -gravity center \
            -extent 1290x2796 \
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
        
        echo -e "${GREEN}✓${NC} Created: $output"
    done
    
    echo ""
    echo -e "${GREEN}✅ Screenshots created successfully!${NC}"
    echo "📁 Location: $SCREENSHOT_DIR"
    echo ""
    echo "Next steps:"
    echo "1. Review screenshots in $SCREENSHOT_DIR"
    echo "2. Upload to App Store Connect"
    echo "3. Submit Build #16 for review"
fi

# Create a sample HTML preview
cat > "$SCREENSHOT_DIR/preview.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TypeB App Store Screenshots Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
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
        .screenshot p {
            margin: 0;
            color: #666;
            font-size: 14px;
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
        .checklist li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
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
        <h1>📱 TypeB App Store Screenshots Preview</h1>
        
        <div class="info">
            <h2>Submission Checklist</h2>
            <ul class="checklist">
                <li>Screenshots are 1290 × 2796 pixels</li>
                <li>All text is readable and professional</li>
                <li>Brand colors are consistent</li>
                <li>Key features are highlighted</li>
                <li>Free trial is mentioned</li>
            </ul>
        </div>
        
        <div class="screenshots">
            <div class="screenshot">
                <img src="app_store_screenshot_1.png" alt="Screenshot 1">
                <h3>Dashboard</h3>
                <p>Main task management view</p>
            </div>
            <div class="screenshot">
                <img src="app_store_screenshot_2.png" alt="Screenshot 2">
                <h3>Task Creation</h3>
                <p>Photo validation feature</p>
            </div>
            <div class="screenshot">
                <img src="app_store_screenshot_3.png" alt="Screenshot 3">
                <h3>Family Management</h3>
                <p>Member roles and permissions</p>
            </div>
            <div class="screenshot">
                <img src="app_store_screenshot_4.png" alt="Screenshot 4">
                <h3>Premium Features</h3>
                <p>Analytics and insights</p>
            </div>
            <div class="screenshot">
                <img src="app_store_screenshot_5.png" alt="Screenshot 5">
                <h3>Rewards System</h3>
                <p>Points and achievements</p>
            </div>
        </div>
    </div>
</body>
</html>
EOF

echo ""
echo "🌐 Preview your screenshots:"
echo "   open $SCREENSHOT_DIR/preview.html"
echo ""
echo -e "${GREEN}Ready to submit to App Store! 🚀${NC}"