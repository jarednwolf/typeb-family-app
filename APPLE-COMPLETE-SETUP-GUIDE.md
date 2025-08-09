# 🍎 Complete Apple App Store Setup Guide - From Zero to RevenueCat Ready

This guide walks you through EVERYTHING needed to set up your app in Apple's ecosystem before connecting to RevenueCat.

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Apple Developer Account ($99/year) - https://developer.apple.com/programs/
- [ ] Mac computer with Xcode installed
- [ ] Your app's bundle ID ready: `com.typeb.familyapp`

---

## Part 1: Apple Developer Account Setup

### Step 1.1: Enroll in Apple Developer Program
1. Go to https://developer.apple.com/enroll/
2. Sign in with your Apple ID
3. Choose enrollment type:
   - **Individual** (if personal)
   - **Organization** (if company - requires D-U-N-S number)
4. Pay $99 annual fee
5. Wait for activation (instant for individual, 24-48 hours for organization)

### Step 1.2: Accept Agreements
1. Go to https://developer.apple.com/account
2. Click "Agreements, Tax, and Banking"
3. Accept all required agreements
4. Fill in tax forms (W-9 for US, W-8 for international)
5. Add banking information for payments

---

## Part 2: App Store Connect Initial Setup

### Step 2.1: Access App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. First time? Accept the App Store Connect agreement

### Step 2.2: Request API Access (Required for RevenueCat)
1. Go to **Users and Access** → **Integrations** → **App Store Connect API**
2. Click **"Request Access"**
3. Read and accept the terms
4. **WAIT**: Apple takes 24-48 hours to approve API access
5. You'll receive an email when approved

⚠️ **IMPORTANT**: You cannot proceed with RevenueCat until this is approved!

---

## Part 3: Create Your App

### Step 3.1: Register App ID
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **"+"** button
3. Select **"App IDs"** → Continue
4. Select **"App"** → Continue
5. Fill in:
   - **Description**: TypeB Family
   - **Bundle ID**: Explicit
   - **Bundle ID String**: `com.typeb.familyapp`
6. Capabilities - Enable:
   - [ ] In-App Purchase
   - [ ] Push Notifications
   - [ ] Sign in with Apple (optional)
7. Click **"Continue"** → **"Register"**

### Step 3.2: Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"**
3. Click **"+"** → **"New App"**
4. Fill in:
   - **Platform**: iOS
   - **Name**: TypeB Family
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.typeb.familyapp` from dropdown
   - **SKU**: TYPEBFAMILY001 (unique identifier)
   - **User Access**: Full Access
5. Click **"Create"**

---

## Part 4: Configure In-App Purchases

### Step 4.1: Create Subscription Group
1. In your app in App Store Connect, go to **"Features"** → **"In-App Purchases"**
2. Under **"Subscription Groups"**, click **"+"**
3. **Reference Name**: Premium Access
4. **Subscription Group Display Name**: TypeB Premium
5. Click **"Create"**

### Step 4.2: Create Monthly Subscription
1. Click your subscription group "Premium Access"
2. Click **"+"** to add subscription
3. Fill in:
   - **Reference Name**: Premium Monthly
   - **Product ID**: `typeb_premium_monthly` (EXACT - RevenueCat needs this)
   - **Subscription Duration**: 1 Month
   - **Subscription Prices**: Click **"+"**
     - **Country**: USA
     - **Price**: $4.99
     - Click **"Create"**
4. Add more details:
   - **Localizations**: Click **"+"**
     - **Language**: English (U.S.)
     - **Display Name**: Premium Monthly
     - **Description**: Unlock all premium features with monthly access
   - **App Store Promotion** (optional): Add image 1024x1024
   - **Review Notes**: "Monthly subscription for premium features"
5. **Introductory Offer**: Click **"+"**
   - **Type**: Free Trial
   - **Duration**: 7 Days
   - **Countries**: All Countries
6. Click **"Save"**

### Step 4.3: Create Annual Subscription
1. In the same subscription group, click **"+"**
2. Fill in:
   - **Reference Name**: Premium Annual
   - **Product ID**: `typeb_premium_annual` (EXACT)
   - **Subscription Duration**: 1 Year
   - **Subscription Prices**: 
     - **USA**: $39.99
3. Add details:
   - **Display Name**: Premium Annual (Save 33%)
   - **Description**: Best value! Full year of premium features
4. **Introductory Offer**: 7-day free trial
5. Click **"Save"**

### Step 4.4: Set Subscription Order (Important!)
1. In your subscription group, you'll see both subscriptions
2. Drag to reorder:
   - Level 1: Premium Annual (higher level = priority for upgrades)
   - Level 2: Premium Monthly
3. This allows users to upgrade from monthly to annual

### Step 4.5: Generate App-Specific Shared Secret
1. Go to your app's **"App Information"** page
2. Scroll to **"App-Specific Shared Secret"**
3. Click **"Manage"**
4. Click **"Generate"**
5. **COPY AND SAVE THIS SECRET** - You'll need it for RevenueCat

---

## Part 5: Create API Key for RevenueCat (After API Access Approved)

### Step 5.1: Check API Access Status
1. Go to **Users and Access** → **Integrations** → **Team Keys**
2. If you see the keys section, you're approved!
3. If not, wait for Apple's email (24-48 hours)

### Step 5.2: Generate API Key
1. In **Team Keys**, click **"+"**
2. Fill in:
   - **Name**: RevenueCat Integration
   - **Access**: App Manager
3. Click **"Generate"**
4. **IMMEDIATELY DOWNLOAD** the .p8 file (you can only download once!)
5. Note down:
   - **Key ID**: (shown on screen, like "ABC123DEF4")
   - **Issuer ID**: (shown on screen, UUID format)

### Step 5.3: Save Your Credentials
Create a secure document with:
```
Apple App Store Connect Credentials
====================================
Bundle ID: com.typeb.familyapp
SKU: TYPEBFAMILY001

API Key for RevenueCat:
- Key ID: [YOUR_KEY_ID]
- Issuer ID: [YOUR_ISSUER_ID]
- Private Key: [Path to your .p8 file]

App-Specific Shared Secret: [YOUR_SECRET]

In-App Purchase IDs:
- Monthly: typeb_premium_monthly
- Annual: typeb_premium_annual
```

---

## Part 6: Prepare for App Submission

### Step 6.1: App Information
1. In App Store Connect, go to your app
2. Fill in **"App Information"**:
   - Category: Productivity
   - Content Rights: Yes (you own the content)
   - Age Rating: Click "Edit" and answer questionnaire

### Step 6.2: Pricing and Availability
1. Go to **"Pricing and Availability"**
2. Price: Free
3. Availability: Select all countries (or specific ones)

### Step 6.3: Privacy Policy
1. You MUST have a privacy policy URL for apps with subscriptions
2. Create one at https://www.termsfeed.com/privacy-policy-generator/ (free)
3. Host it somewhere (GitHub Pages, your website, etc.)
4. Add URL in App Information

---

## Part 7: Connect to RevenueCat

Now you're ready for RevenueCat! You have:
- ✅ App created in App Store Connect
- ✅ In-App Purchases configured
- ✅ API Key generated (after approval)
- ✅ App-Specific Shared Secret

### In RevenueCat:
1. Use your API Key (.p8 file, Key ID, Issuer ID)
2. Products will auto-import
3. Configure entitlements
4. Get your RevenueCat API key

---

## 🚨 Common Issues & Solutions

### "Request API Access" Button Not Showing
- You need to be Account Holder or Admin
- Check Users and Access → your role

### API Access Still Pending
- Normal wait time: 24-48 hours
- Check email for approval
- Weekend requests may take longer

### Can't Create In-App Purchases
- Ensure you accepted all agreements
- Fill in banking and tax information
- App must be created first

### Products Not Showing in RevenueCat
- Product IDs must match EXACTLY
- Wait 24 hours after creating products
- Ensure products are in "Ready to Submit" state

---

## 📅 Realistic Timeline

- **Day 1**: 
  - Create Apple Developer account
  - Request API access
  - Create app and in-app purchases
  
- **Day 2-3**: 
  - Wait for API access approval
  - Prepare app metadata
  
- **Day 3-4**: 
  - Generate API key
  - Connect RevenueCat
  - Configure products
  
- **Day 4-5**: 
  - Build app with EAS
  - Submit to TestFlight

---

## 🎯 Next Steps After This Guide

1. ✅ Complete RevenueCat setup with your API credentials
2. ✅ Update `.env.production` with RevenueCat keys
3. ✅ Build your app with EAS
4. ✅ Submit to TestFlight
5. ✅ Test subscriptions with sandbox account
6. ✅ Submit for App Store review

---

## 📞 Need Help?

- **Apple Developer Support**: https://developer.apple.com/contact/
- **App Store Connect Help**: https://help.apple.com/app-store-connect/
- **RevenueCat Support**: https://community.revenuecat.com/

---

**Remember**: The API access approval is the main bottleneck. Request it ASAP and you can set up everything else while waiting!

---

*Last Updated: January 9, 2025*
*For: TypeB Family App v1.0.1*