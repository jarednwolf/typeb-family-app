#!/bin/bash

# TypeB Family App - Beta Deployment Script
# Deploy to TestFlight (iOS) and Google Play Internal Testing (Android)

set -e

echo "🚀 TypeB Family - Beta Deployment"
echo "=================================="
echo ""

# Configuration
BETA_VERSION="1.0.0-beta.1"
BETA_BUILD_NUMBER="100"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check for EAS CLI
    if ! command -v eas &> /dev/null; then
        echo -e "${RED}❌ EAS CLI not found${NC}"
        echo "Please install it: npm install -g eas-cli"
        exit 1
    fi
    
    # Check for logged in EAS account
    if ! eas whoami &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged into EAS${NC}"
        echo "Logging in..."
        eas login
    fi
    
    # Check for app.json
    if [ ! -f "app.json" ]; then
        echo -e "${RED}❌ app.json not found${NC}"
        echo "Please run this script from the project root"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Update version for beta
update_beta_version() {
    echo ""
    echo "📝 Updating version for beta..."
    
    # Backup app.json
    cp app.json app.json.backup
    
    # Update version in package.json
    npm version "$BETA_VERSION" --no-git-tag-version --allow-same-version
    
    # Update iOS build number
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"buildNumber\": \"[^\"]*\"/\"buildNumber\": \"$BETA_BUILD_NUMBER\"/" app.json
        sed -i '' "s/\"versionCode\": [0-9]*/\"versionCode\": $BETA_BUILD_NUMBER/" app.json
    else
        # Linux
        sed -i "s/\"buildNumber\": \"[^\"]*\"/\"buildNumber\": \"$BETA_BUILD_NUMBER\"/" app.json
        sed -i "s/\"versionCode\": [0-9]*/\"versionCode\": $BETA_BUILD_NUMBER/" app.json
    fi
    
    echo -e "${GREEN}✅ Version updated to $BETA_VERSION (build $BETA_BUILD_NUMBER)${NC}"
}

# iOS Beta Deployment
deploy_ios_beta() {
    echo ""
    echo "📱 Deploying iOS Beta to TestFlight..."
    echo ""
    
    # Check if production credentials are configured
    echo "Checking iOS credentials..."
    eas credentials
    
    # Build for TestFlight
    echo "Building iOS app for TestFlight..."
    eas build --platform ios --profile preview --non-interactive
    
    # Wait for build to complete
    echo "Waiting for build to complete..."
    echo "You can monitor the build at: https://expo.dev/accounts/wolfjn1/projects/typeb-family-app/builds"
    
    # Get the latest build
    read -p "Press Enter when the build is complete..."
    
    # Submit to TestFlight
    echo "Submitting to TestFlight..."
    eas submit --platform ios --latest
    
    echo -e "${GREEN}✅ iOS beta deployed to TestFlight${NC}"
    echo "Next steps for iOS:"
    echo "1. Go to App Store Connect"
    echo "2. Add external testers"
    echo "3. Submit for beta review if needed"
}

# Android Beta Deployment
deploy_android_beta() {
    echo ""
    echo "🤖 Deploying Android Beta to Play Console..."
    echo ""
    
    # Build for Google Play
    echo "Building Android app for internal testing..."
    eas build --platform android --profile preview --non-interactive
    
    # Wait for build to complete
    echo "Waiting for build to complete..."
    echo "You can monitor the build at: https://expo.dev/accounts/wolfjn1/projects/typeb-family-app/builds"
    
    # Get the latest build
    read -p "Press Enter when the build is complete..."
    
    # Submit to internal testing track
    echo "Submitting to Google Play internal testing..."
    eas submit --platform android --latest --track internal
    
    echo -e "${GREEN}✅ Android beta deployed to Play Console${NC}"
    echo "Next steps for Android:"
    echo "1. Go to Google Play Console"
    echo "2. Add internal testers"
    echo "3. Create testing link"
}

# Create beta testing documentation
create_beta_docs() {
    echo ""
    echo "📝 Creating beta testing documentation..."
    
    cat > BETA_TESTING_GUIDE.md << 'EOF'
# TypeB Family - Beta Testing Guide

## Version: 1.0.0-beta.1
## Build: 100

Thank you for helping test TypeB Family! Your feedback is invaluable in making this the best family task management app.

## 🍎 For iOS Testers (TestFlight)

### Installation Steps:
1. **Accept TestFlight invitation** - Check your email for the invitation
2. **Download TestFlight** - Get it from the App Store if you don't have it
3. **Install TypeB Family Beta** - Open the invitation link to install
4. **Allow notifications** - When prompted, allow notifications for the full experience

### TestFlight Features:
- **Automatic Updates** - You'll get new beta versions automatically
- **Feedback Button** - Use the screenshot feature to report issues
- **Crash Reports** - Automatically sent to help us fix problems

## 🤖 For Android Testers (Play Console)

### Installation Steps:
1. **Accept testing invitation** - Check your email for the invitation
2. **Join beta program** - Click the provided link to join
3. **Download from Play Store** - The app will appear in your Play Store
4. **Enable beta updates** - Go to app settings in Play Store

### Google Play Features:
- **Beta badge** - You'll see "Beta" on the app listing
- **Feedback option** - Leave private feedback for developers
- **Early access** - Get features before public release

## 🧪 What to Test

### Core Functionality
- [ ] **User Registration**
  - Sign up with email
  - Google Sign-In
  - Profile creation
  
- [ ] **Family Management**
  - Create a family
  - Invite family members
  - Accept invitations
  - Manage roles (Parent/Child)
  
- [ ] **Task Creation**
  - Create one-time tasks
  - Set up recurring tasks
  - Add photo requirements
  - Set priorities and due dates
  
- [ ] **Photo Validation**
  - Take photos for tasks
  - Upload from gallery
  - Parent approval flow
  - Photo quality and size
  
- [ ] **Premium Features**
  - Start free trial
  - View premium features
  - Subscription flow (DON'T complete purchase in beta)
  - Analytics dashboard

### Performance Testing
- [ ] **App Launch** - Should be under 3 seconds
- [ ] **Screen Transitions** - Should be smooth
- [ ] **Photo Upload** - Should handle large photos
- [ ] **Offline Mode** - Test without internet
- [ ] **Background Sync** - Leave app and return

### Device Compatibility
- [ ] **Different Screen Sizes** - Phones and tablets
- [ ] **OS Versions** - iOS 13+ / Android 6+
- [ ] **Orientation** - Portrait mode (primary)
- [ ] **Dark Mode** - If your device supports it

## 🐛 How to Report Issues

### What We Need:
1. **Screenshot** - Use TestFlight/Play Store feedback tools
2. **Description** - What were you trying to do?
3. **Steps to Reproduce** - How can we recreate the issue?
4. **Device Info** - Your device model and OS version
5. **Frequency** - Does it happen every time?

### Where to Report:

#### Quick Feedback:
- **iOS**: Shake device or screenshot to open TestFlight feedback
- **Android**: Use Play Store beta feedback option
- **In-App**: Settings > Help & Feedback

#### Detailed Reports:
- **Email**: beta@typebapp.com
- **Subject Format**: [Beta] Issue with [Feature]
- **Include**: Screenshots, device info, and steps

#### Critical Issues:
- **Crashes**: Automatically reported, but add context if possible
- **Data Loss**: Email immediately
- **Security Issues**: Email privately, don't post publicly

## 📊 Focus Areas for This Beta

### Priority Testing:
1. **Photo Validation Flow** - Our unique feature
2. **Family Invitations** - Must work flawlessly
3. **Task Completion** - Core functionality
4. **Points System** - Motivation feature
5. **Offline Sync** - Critical for reliability

### Known Issues:
- Minor UI glitches on iPad landscape mode
- Occasional delay in photo processing
- Push notifications may be delayed

## 🎁 Beta Tester Rewards

As a thank you for your help:
- **Early Access** - Get new features first
- **Founder Status** - Special badge in the app
- **Discount** - 50% off first 3 months of Premium
- **Direct Input** - Your feedback shapes the app

## 📅 Beta Timeline

- **Week 1-2**: Core functionality testing
- **Week 3**: Performance and stability
- **Week 4**: Final polish and fixes
- **Launch**: Planned for [Date]

## 💬 Join the Community

- **Discord**: [Coming Soon]
- **Feedback Calls**: Weekly optional calls
- **Feature Requests**: beta-features@typebapp.com

## ⚠️ Important Notes

1. **Data**: Beta data may be reset before launch
2. **Purchases**: Test subscriptions only - don't use real payment
3. **Privacy**: Your data is secure and encrypted
4. **Sharing**: Please don't share screenshots publicly yet

## 🙏 Thank You!

Your testing helps us build a better app for families everywhere. Every bug report, suggestion, and piece of feedback makes TypeB Family better.

If you have any questions, reach out to beta@typebapp.com

Happy Testing!
The TypeB Family Team
EOF
    
    echo -e "${GREEN}✅ Beta testing guide created${NC}"
}

# Generate beta announcement
create_beta_announcement() {
    echo ""
    echo "📧 Creating beta announcement template..."
    
    cat > BETA_ANNOUNCEMENT.md << 'EOF'
# 🎉 TypeB Family Beta Testing Program

Dear Beta Tester,

We're excited to invite you to test TypeB Family, the revolutionary task management app designed specifically for modern families!

## What is TypeB Family?

TypeB Family transforms how families manage daily tasks through:
- **Photo Validation**: Kids prove task completion with photos
- **Smart Rewards**: Points, streaks, and achievements
- **Family Collaboration**: Everyone stays in sync
- **Age-Appropriate Tasks**: Automated suggestions by age

## Why We Need You

Your feedback will help us:
- Identify and fix bugs before launch
- Improve user experience
- Add requested features
- Ensure compatibility across devices

## Beta Testing Details

**Duration**: 2-4 weeks
**Platforms**: iOS (TestFlight) and Android (Play Store)
**Requirements**: 
- Active family with kids (or willingness to test scenarios)
- iPhone (iOS 13+) or Android (6.0+)
- 15-30 minutes for initial testing
- Occasional feedback submissions

## How to Join

### iOS Users:
1. Accept the TestFlight invitation (check your email)
2. Download TestFlight from App Store
3. Install TypeB Family Beta

### Android Users:
1. Accept the internal testing invitation (check your email)
2. Join the beta program via the link
3. Download from Google Play Store

## What You Get

✅ Early access to all features
✅ Direct impact on app development
✅ 50% discount on Premium subscription at launch
✅ Founder badge in your profile

## Get Started

Once installed:
1. Create your family account
2. Add family members
3. Create some test tasks
4. Try the photo validation feature
5. Explore Premium features (free during beta)

## Need Help?

- **Email**: beta@typebapp.com
- **Quick Start Guide**: Included in TestFlight/Play Store
- **Feedback**: Use in-app feedback or email

Thank you for helping us build the future of family task management!

Best regards,
The TypeB Family Team

P.S. Feel free to invite other families to join the beta. The more testers, the better the app becomes!
EOF
    
    echo -e "${GREEN}✅ Beta announcement created${NC}"
}

# Main script execution
clear
echo "🚀 TypeB Family Beta Deployment Tool"
echo "===================================="
echo ""

# Check prerequisites
check_prerequisites

# Show menu
echo "What would you like to do?"
echo ""
echo "1) Deploy iOS Beta (TestFlight)"
echo "2) Deploy Android Beta (Play Console)"
echo "3) Deploy Both Platforms"
echo "4) Create Beta Documentation Only"
echo "5) Update Version Numbers Only"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        update_beta_version
        deploy_ios_beta
        create_beta_docs
        ;;
    2)
        update_beta_version
        deploy_android_beta
        create_beta_docs
        ;;
    3)
        update_beta_version
        deploy_ios_beta
        deploy_android_beta
        create_beta_docs
        create_beta_announcement
        ;;
    4)
        create_beta_docs
        create_beta_announcement
        ;;
    5)
        update_beta_version
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "🎉 Beta deployment process complete!"
echo ""
echo "Next steps:"
echo "1. Monitor build progress at https://expo.dev"
echo "2. Send BETA_ANNOUNCEMENT.md to testers"
echo "3. Share BETA_TESTING_GUIDE.md with accepted testers"
echo "4. Set up feedback monitoring"
echo "5. Plan weekly beta updates"
echo ""
echo "Remember to:"
echo "- Monitor crash reports daily"
echo "- Respond to tester feedback quickly"
echo "- Update testers on fixes and changes"
echo "- Thank testers for their help!"
