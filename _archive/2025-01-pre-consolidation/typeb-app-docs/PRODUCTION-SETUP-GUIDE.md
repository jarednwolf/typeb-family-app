# 🚀 TypeB Family App - Production Setup Guide

**IMPORTANT**: Follow these steps in order to launch your app to production.

---

## 📋 Pre-Launch Checklist

- [x] Apple Developer Account ($99/year)
- [ ] Google Play Developer Account ($25 one-time)
- [x] Credit card for service accounts
- [x] Access to email for verifications

---

## 🔑 Step 1: RevenueCat Setup (Payment Processing)

### 1.1 Create RevenueCat Account
1. **Go to**: https://app.revenuecat.com/signup
2. **Sign up** with your email
3. **Verify** your email address

### 1.2 Create New Project
1. **Dashboard URL**: https://app.revenuecat.com/overview
2. Click **"Create New Project"**
3. **Project Name**: `TypeB Family App`
4. **Platform**: Select both iOS and Android

### 1.3 Configure iOS App
1. **Go to**: Project Settings → Apps → **"+ New"**
2. **App Name**: `TypeB Family iOS`
3. **Bundle ID**: `com.typeb.familyapp`
4. **App Store Connect App-Specific Shared Secret**: (get from App Store Connect later)

### 1.4 Configure Android App
1. **Go to**: Project Settings → Apps → **"+ New"**
2. **App Name**: `TypeB Family Android`
3. **Package Name**: `com.typeb.familyapp`
4. **Google Play Service Credentials**: (upload JSON key later)

### 1.5 Create Products
1. **Go to**: Products → **"+ New"**
2. Create these EXACT product IDs:

**Monthly Subscription**:
- **Identifier**: `typeb_premium_monthly`
- **App Store Product ID**: `typeb_premium_monthly`
- **Play Store Product ID**: `typeb_premium_monthly`

**Annual Subscription**:
- **Identifier**: `typeb_premium_annual`
- **App Store Product ID**: `typeb_premium_annual`
- **Play Store Product ID**: `typeb_premium_annual`

### 1.6 Create Entitlement
1. **Go to**: Entitlements → **"+ New"**
2. **Identifier**: `premium`
3. **Description**: `Premium Features Access`
4. **Attach Products**: Select both monthly and annual

### 1.7 Create Offering
1. **Go to**: Offerings → Current Offering → **"Edit"**
2. Add both products to the default offering
3. Set monthly as default package

### 1.8 Get Your API Keys
1. **Go to**: Project Settings → **API Keys**
2. **Copy these keys**:
   - **iOS Public Key**: `appl_xxxxxxxxxxxxxxxxxxxxx`
   - **Android Public Key**: `goog_xxxxxxxxxxxxxxxxxxxxx`

---

## 🔍 Step 2: Sentry Setup (Error Monitoring)

### 2.1 Create Sentry Account
1. **Go to**: https://sentry.io/signup/
2. **Sign up** with email or GitHub
3. **Organization Name**: Your company or `typeb`

### 2.2 Create Project
1. **Go to**: https://sentry.io/organizations/[your-org]/projects/new/
2. **Platform**: Select **React Native**
3. **Project Name**: `typeb-family-app`
4. **Team**: `#typeb` or create new

### 2.3 Get Your DSN
1. **Go to**: Settings → Projects → typeb-family-app → **Client Keys (DSN)**
2. **Copy the DSN**: It looks like:
   ```
   https://1234567890abcdef@o123456.ingest.sentry.io/1234567
   ```

### 2.4 Configure Alerts (Optional but Recommended)
1. **Go to**: Alerts → **Create Alert Rule**
2. Set up these alerts:
   - Error rate > 1%
   - New error types
   - Crash free rate < 99%

---

## 🍎 Step 3: App Store Connect Setup

### 3.1 Access App Store Connect
1. **Go to**: https://appstoreconnect.apple.com
2. **Sign in** with Apple Developer account

### 3.2 Create App
1. **Go to**: My Apps → **"+"** → **New App**
2. **Platform**: iOS
3. **Name**: `TypeB Family`
4. **Primary Language**: English (U.S.)
5. **Bundle ID**: `com.typeb.familyapp`
6. **SKU**: `TYPEBFAMILY001`

### 3.3 Create In-App Purchases
1. **Go to**: Your App → Features → **In-App Purchases**
2. Click **"+"** to create:

**Monthly Subscription**:
- **Reference Name**: `Premium Monthly`
- **Product ID**: `typeb_premium_monthly`
- **Subscription Duration**: 1 Month
- **Price**: $4.99
- **Free Trial**: 7 days
- **Family Sharing**: Enable

**Annual Subscription**:
- **Reference Name**: `Premium Annual`
- **Product ID**: `typeb_premium_annual`
- **Subscription Duration**: 1 Year
- **Price**: $39.99
- **Free Trial**: 7 days
- **Family Sharing**: Enable

### 3.4 Create Subscription Group
1. **Name**: `Premium Access`
2. **Add both subscriptions** to this group
3. **Set upgrade/downgrade** rankings

---

## 🤖 Step 4: Google Play Console Setup

### 4.1 Access Play Console
1. **Go to**: https://play.google.com/console
2. **Sign in** with Google account

### 4.2 Create App
1. Click **"Create app"**
2. **App name**: `TypeB Family`
3. **Default language**: English (United States)
4. **App type**: App
5. **Category**: Productivity
6. **Free/Paid**: Free (with in-app purchases)

### 4.3 Create Subscriptions
1. **Go to**: Monetize → Products → **Subscriptions**
2. Create subscriptions:

**Monthly**:
- **Product ID**: `typeb_premium_monthly`
- **Name**: `Premium Monthly`
- **Billing period**: Monthly
- **Default price**: $4.99
- **Free trial**: 7 days

**Annual**:
- **Product ID**: `typeb_premium_annual`
- **Name**: `Premium Annual`
- **Billing period**: Yearly
- **Default price**: $39.99
- **Free trial**: 7 days

### 4.4 Create Service Account
1. **Go to**: Setup → **API access**
2. Click **"Create new service account"**
3. Follow the link to Google Cloud Console
4. Create service account with **Financial Data** permissions
5. Download JSON key file
6. Upload to RevenueCat Android configuration

---

## 🔧 Step 5: Update Environment Variables

### 5.1 Edit Production Environment File
Open `typeb-family-app/.env.production` and update:

```env
# RevenueCat - Replace with your actual keys from Step 1.8
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_YOUR_ACTUAL_IOS_KEY_HERE
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_YOUR_ACTUAL_ANDROID_KEY_HERE

# Sentry - Replace with your DSN from Step 2.3
EXPO_PUBLIC_SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID
```

### 5.2 Verify Configuration
```bash
cd typeb-family-app
cat .env.production | grep -E "REVENUECAT|SENTRY"
```

---

## 🏗️ Step 6: Build Apps

### 6.1 iOS Production Build
```bash
cd typeb-family-app
eas build --platform ios --profile production
```
- **Build time**: ~30-45 minutes
- **Output**: .ipa file for TestFlight

### 6.2 Android Production Build
```bash
cd typeb-family-app
eas build --platform android --profile production
```
- **Build time**: ~20-30 minutes
- **Output**: .aab file for Play Store

### 6.3 Check Build Status
```bash
eas build:list
```
Or visit: https://expo.dev/accounts/wolfjn1/projects/typeb-family-app/builds

---

## 📱 Step 7: Submit to Stores

### 7.1 Submit to TestFlight
```bash
eas submit --platform ios --latest
```
**Manual Alternative**:
1. Download .ipa from EAS
2. Use **Transporter** app
3. Upload to App Store Connect

### 7.2 Submit to Google Play
```bash
eas submit --platform android --latest
```
**Manual Alternative**:
1. Download .aab from EAS
2. Upload in Play Console → Testing → Internal testing

---

## ✅ Step 8: Testing

### 8.1 TestFlight Testing
1. **Go to**: App Store Connect → TestFlight
2. **Add testers** by email
3. **Test these flows**:
   - Sign up with new account
   - Purchase monthly subscription
   - Purchase annual subscription
   - Cancel subscription
   - Restore purchases

### 8.2 Google Play Testing
1. **Go to**: Play Console → Testing → Internal testing
2. **Create release**
3. **Add testers**
4. **Share testing link**

---

## 🚀 Step 9: Production Release

### 9.1 iOS App Store
1. **Go to**: App Store Connect → App Store → Prepare for Submission
2. **Fill in**:
   - App description
   - Keywords
   - Screenshots (6.5", 5.5", iPad)
   - App preview video (optional)
   - Support URL
   - Privacy Policy URL
3. **Submit for Review**
4. **Review time**: 24-48 hours typically

### 9.2 Google Play Store
1. **Go to**: Play Console → Production
2. **Create release** from internal testing
3. **Fill in**:
   - Store listing
   - Graphics (icon, feature graphic, screenshots)
   - Categorization
   - Content rating questionnaire
4. **Submit for Review**
5. **Review time**: 2-24 hours typically

---

## 📊 Step 10: Monitor Launch

### 10.1 RevenueCat Dashboard
- **URL**: https://app.revenuecat.com/overview
- **Monitor**: Trials, conversions, MRR, churn

### 10.2 Sentry Dashboard
- **URL**: https://sentry.io/organizations/[your-org]/issues/
- **Monitor**: Errors, crash rate, performance

### 10.3 Firebase Console
- **URL**: https://console.firebase.google.com/project/typeb-family-app
- **Monitor**: Users, database, storage

### 10.4 App Analytics
- **App Store Connect**: Analytics → Overview
- **Play Console**: Statistics → Overview

---

## 🆘 Troubleshooting

### Common Issues

**RevenueCat products not showing**:
- Ensure products are approved in App Store Connect
- Wait 24 hours for propagation
- Check product IDs match exactly

**Sentry not receiving events**:
- Verify DSN is correct
- Check network connectivity
- Ensure production environment is set

**Build failures**:
- Run `eas build --clear-cache`
- Check `app.json` configuration
- Verify certificates are valid

**Submission rejected**:
- Review rejection reasons
- Common: Missing privacy policy, unclear subscription terms
- Fix and resubmit

---

## 📞 Support Contacts

### Service Support
- **RevenueCat**: support@revenuecat.com or https://community.revenuecat.com
- **Sentry**: support@sentry.io
- **Expo/EAS**: https://chat.expo.dev
- **Firebase**: https://firebase.google.com/support

### App Store Support
- **Apple Developer**: https://developer.apple.com/contact/
- **Google Play**: https://support.google.com/googleplay/android-developer

---

## 🎯 Quick Reference

### Your Project URLs
- **EAS Builds**: https://expo.dev/accounts/wolfjn1/projects/typeb-family-app/builds
- **Firebase Console**: https://console.firebase.google.com/project/typeb-family-app
- **RevenueCat**: https://app.revenuecat.com/overview
- **Sentry**: https://sentry.io/organizations/[your-org]/projects/typeb-family-app

### Critical IDs
- **Bundle ID**: `com.typeb.familyapp`
- **EAS Project ID**: `0b1cab38-fdeb-4b64-a3bb-874e84c9d5c9`
- **Firebase Project**: `typeb-family-app`

### Product IDs
- **Monthly**: `typeb_premium_monthly` ($4.99)
- **Annual**: `typeb_premium_annual` ($39.99)
- **Entitlement**: `premium`

---

**Last Updated**: January 9, 2025  
**Version**: 1.0.1  
**Status**: Ready for account creation and API key configuration

---

## Next Immediate Actions

1. ✅ Create RevenueCat account (10 min)
2. ✅ Create Sentry account (5 min)
3. ✅ Update .env.production with keys (2 min)
4. ✅ Create App Store Connect app (15 min)
5. ✅ Create Google Play Console app (15 min)
6. ✅ Configure in-app purchases (30 min)
7. ✅ Build apps with EAS (1 hour)
8. ✅ Submit to TestFlight/Internal Testing (15 min)

**Total Time**: ~2.5 hours of active work + build time