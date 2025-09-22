# App Store Submission Guide

Complete checklist and guide for submitting TypeB to the Apple App Store and Google Play Store.

## Pre-Submission Requirements

### Legal & Compliance
- [ ] **Privacy Policy** published and accessible
- [ ] **Terms of Service** published and accessible
- [ ] **COPPA Compliance** fully implemented
- [ ] **Data Use Agreement** for minors
- [ ] **Copyright** and trademark documentation
- [ ] **Export Compliance** documentation (encryption)

### Accounts Required
- [ ] **Apple Developer Account** ($99/year)
  - Enrolled as organization (not individual)
  - Tax forms completed (W-9 or W-8BEN)
  - Banking information added
- [ ] **Google Play Developer Account** ($25 one-time)
  - Developer profile completed
  - Merchant account linked (for payments)

## iOS App Store Submission

### App Information

#### Basic Information
```
App Name: TypeB - Family Tasks
Subtitle: ADHD-Friendly Task Manager
Category: Primary: Productivity, Secondary: Education
Age Rating: 4+ (Children's Category)
```

#### App Description (Max 4000 characters)
```
TypeB transforms household chaos into organized success! Our ADHD-friendly task management app helps families build better habits through visual organization, photo validation, and positive reinforcement.

KEY FEATURES:
• Visual Task Cards - Color-coded tasks with icons for easy recognition
• Photo Validation - Kids snap photos to prove task completion
• Smart Reminders - Customizable notifications that escalate when needed
• Points & Rewards - Motivate with gamification and achievement tracking
• Family Dashboard - Parents see everything at a glance
• Real-time Sync - Updates instantly across all devices

PERFECT FOR:
• Families with ADHD or executive function challenges
• Parents wanting to teach responsibility
• Kids who need structure and routine
• Households seeking better organization

PREMIUM FEATURES ($4.99/month):
• Unlimited family members
• Advanced analytics dashboard
• Custom categories and rewards
• Priority photo validation
• Smart notification system
• Priority support

WHY TYPEB?
Developed with ADHD experts and tested by real families, TypeB uses proven strategies to help children develop executive function skills. Our simple, uncluttered interface reduces overwhelm while our reward system provides the dopamine boost ADHD brains need.

PRIVACY FIRST:
• COPPA compliant for children under 13
• Parental controls and consent required
• Photos auto-delete after 90 days
• No ads or data selling

Join thousands of families already using TypeB to bring calm to the chaos!

Subscription Terms: Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Manage subscriptions in Account Settings.

Privacy Policy: https://typebapp.com/privacy
Terms of Service: https://typebapp.com/terms
Support: support@typebapp.com
```

#### Keywords (100 characters max)
```
adhd,tasks,chores,family,kids,reward,routine,habit,organize,productivity,parenting,behavior,focus
```

### Screenshots & Media

#### Required Screenshots
- [ ] **6.5" Display** (iPhone 14 Pro Max, 15 Plus)
  - [ ] 1. Onboarding/Welcome screen
  - [ ] 2. Main task dashboard
  - [ ] 3. Task creation with photo
  - [ ] 4. Family member management
  - [ ] 5. Rewards and points screen
  - [ ] 6. Parent dashboard view

- [ ] **5.5" Display** (iPhone 8 Plus)
  - [ ] Same 6 screenshots as above

- [ ] **iPad Pro 12.9"** (3rd gen)
  - [ ] Same 6 screenshots, iPad layout

#### App Preview Video (Optional but Recommended)
- [ ] 15-30 seconds
- [ ] Show key features in action
- [ ] Include captions for accessibility
- [ ] Formats: 1080x1920 (portrait) or 1920x1080 (landscape)

### App Store Assets

#### App Icon
- [ ] **1024x1024px** without rounded corners
- [ ] No alpha channel
- [ ] RGB color space
- [ ] PNG format
- [ ] Matches in-app icon

#### What's New (Version Notes)
```
Version 1.1.0:
• Google Sign-In now available
• Improved photo validation speed
• Enhanced notification system
• Bug fixes and performance improvements
• COPPA compliance updates

We're constantly improving TypeB based on your feedback. Thank you for helping us help families!
```

### Technical Requirements

#### Build Configuration
```json
{
  "expo": {
    "name": "TypeB",
    "slug": "typeb-family-app",
    "version": "1.1.0",
    "ios": {
      "bundleIdentifier": "com.typebapp.family",
      "buildNumber": "25",
      "supportsTablet": true,
      "requireFullScreen": false,
      "infoPlist": {
        "NSCameraUsageDescription": "TypeB needs camera access to take photos for task validation",
        "NSPhotoLibraryUsageDescription": "TypeB needs photo library access to save task validation photos",
        "NSPhotoLibraryAddUsageDescription": "TypeB needs permission to save photos to your library"
      }
    }
  }
}
```

### App Review Information

#### Demo Account
```
Email: demo@typebapp.com
Password: Demo123!
Family Code: DEMO2025

Notes for Reviewer:
- This is a family task management app
- Parent account has full features
- Child accounts have restricted access
- Photo validation is core feature
- COPPA compliant for children
```

#### Contact Information
```
First Name: [Your First Name]
Last Name: [Your Last Name]
Phone: [Your Phone]
Email: appstore@typebapp.com
```

#### Review Notes
```
TypeB is a family task management app designed for families with ADHD children. 

Key features to test:
1. Create a family and add members
2. Create tasks and assign to children
3. Complete task with photo validation
4. Review points and rewards
5. Test notification system

The app is COPPA compliant and requires parental consent for users under 13.
All photos are automatically deleted after 90 days for privacy.

Premium features available via in-app purchase ($4.99/month).
```

### Submission Checklist

#### Pre-Submission Testing
- [ ] Test on real devices (not just simulator)
- [ ] Test all IAP flows
- [ ] Test with poor network connection
- [ ] Test accessibility features
- [ ] Verify deep links work
- [ ] Check crash-free rate >99%

#### App Store Connect Setup
- [ ] Create app record
- [ ] Fill in all app information
- [ ] Upload screenshots for all devices
- [ ] Set pricing (Free with IAP)
- [ ] Configure in-app purchases
- [ ] Set up App Store Optimization
- [ ] Enable TestFlight for beta

#### Final Checks
- [ ] Version number incremented
- [ ] Build number incremented
- [ ] Production environment configured
- [ ] Analytics enabled
- [ ] Crash reporting enabled
- [ ] All debug code removed
- [ ] ProGuard/minification enabled

## Google Play Store Submission

### Store Listing

#### App Details
```
Title: TypeB - Family Task Manager
Short Description (80 chars): ADHD-friendly family task app with photo validation & rewards
Full Description: [Similar to iOS, adapted for Play Store format]
```

#### Categorization
```
Category: Productivity
Content Rating: Everyone
Tags: Family, ADHD, Tasks, Organization, Kids
```

#### Graphics Assets
- [ ] **App Icon**: 512x512 PNG
- [ ] **Feature Graphic**: 1024x500 PNG
- [ ] **Screenshots**: Min 2, max 8 per device type
  - Phone: 16:9 or 9:16 aspect ratio
  - 7" tablet: Screenshots
  - 10" tablet: Screenshots

### Content Rating

#### Questionnaire Responses
- Violence: None
- Sexuality: None
- Language: None
- Controlled Substance: None
- User Interaction: Yes (family sharing)
- Personal Info Sharing: Yes (within family only)
- Location Sharing: No
- Children's Interest: Yes (designed for families)

### Target Audience

#### Age Groups
- [x] 5-8 years (with parental guidance)
- [x] 9-12 years  
- [x] 13-15 years
- [x] 16-17 years
- [x] 18+ years

#### Target Audience Settings
- Primarily Child-Directed: No
- Mixed Audience: Yes
- Appeals to Children: Yes
- COPPA Compliance: Yes

### Privacy & Security

#### Data Safety Section
```yaml
Data Collection:
  Personal Info:
    - Name: Yes, Required, Not Shared, Encrypted
    - Email: Yes, Required, Not Shared, Encrypted
  Photos:
    - Photos: Yes, Optional, Not Shared, Auto-deleted
  App Activity:
    - App interactions: Yes, Analytics only
  
Data Usage:
  - App functionality
  - Analytics
  - Account management

Data Security:
  - Data encrypted in transit
  - Data encrypted at rest
  - Data deletion available
  - COPPA compliant
```

#### Permissions
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Release Management

#### Release Types
1. **Internal Testing** (Recommended first)
   - 100 testers max
   - Quick approval
   - Test payment flows

2. **Closed Testing**
   - Limited beta users
   - Invite via email/link
   - Gather feedback

3. **Open Testing**
   - Public beta
   - Anyone can join
   - Limited features

4. **Production**
   - Staged rollout (5% → 10% → 50% → 100%)
   - Monitor metrics
   - Quick rollback if issues

### Android App Bundle

#### Build Configuration
```json
{
  "expo": {
    "android": {
      "package": "com.typebapp.family",
      "versionCode": 25,
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

## Common Rejection Reasons & Solutions

### iOS Rejections

| Reason | Solution |
|--------|----------|
| Guideline 1.3 - Kids Category | Ensure COPPA compliance, parental gates |
| Guideline 2.1 - App Completeness | Fix all crashes, test thoroughly |
| Guideline 2.3.3 - Accurate Screenshots | Update screenshots to match current UI |
| Guideline 3.1.1 - In-App Purchase | Clear IAP descriptions, test purchase flow |
| Guideline 4.1 - Copycats | Ensure unique branding and features |
| Guideline 5.1.1 - Data Collection | Clear privacy policy, minimize data collection |

### Android Rejections

| Reason | Solution |
|--------|----------|
| Policy: Families | Complete Families declaration, add parental controls |
| Policy: Privacy | Update Data Safety section accurately |
| Crashes & ANRs | Test on multiple devices, fix stability issues |
| Metadata Issues | Accurate descriptions, appropriate graphics |
| Permission Issues | Justify all permissions in description |

## Timeline

### iOS App Store
- **Initial Review**: 24-48 hours typically
- **Rejection Response**: 24 hours after fix
- **Expedited Review**: Available for critical issues

### Google Play Store  
- **Initial Review**: 2-3 hours typically
- **Update Review**: <2 hours usually
- **Policy Review**: Up to 7 days if flagged

## Post-Submission

### Monitor & Respond
- [ ] Watch for review team messages
- [ ] Monitor crash reports
- [ ] Track download metrics
- [ ] Respond to user reviews
- [ ] Plan regular updates

### Marketing Preparation
- [ ] App Store Optimization (ASO)
- [ ] Press release ready
- [ ] Social media announcements
- [ ] Email to beta users
- [ ] Website updated

### Success Metrics
- [ ] Day 1: 100+ downloads
- [ ] Week 1: 1,000+ downloads
- [ ] Month 1: 4.0+ star rating
- [ ] Month 1: <2% crash rate

## Support Resources

### Apple
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Google
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Policy Center](https://play.google.com/console/policy)
- [Material Design](https://material.io/design)

### Contact
- **Apple Developer Support**: https://developer.apple.com/contact/
- **Google Play Support**: https://support.google.com/googleplay/android-developer/
- **Internal**: appstore@typebapp.com

---

**Critical**: Complete all legal requirements before submission. Rejection delays launch by days or weeks.

**Last Updated**: January 2025  
**Owner**: Product Team  
**Review**: Before each submission