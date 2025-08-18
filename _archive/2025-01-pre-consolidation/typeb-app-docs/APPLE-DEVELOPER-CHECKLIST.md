# 🍎 Apple Developer Account Setup Checklist

## 📱 Account Status Check

### 1. Apple Developer Program ($99/year)
- [ ] Go to: https://developer.apple.com/account
- [ ] Check membership status (must show "Active")
- [ ] If not enrolled, click "Enroll" and pay $99 annual fee
- [ ] Wait for activation (usually instant, sometimes 24-48 hours)

### 2. App Store Connect Access
- [ ] Go to: https://appstoreconnect.apple.com
- [ ] Sign in with your Apple ID
- [ ] If you see "My Apps" - you're ready!
- [ ] If not, wait for Developer Program activation

### 3. Agreements, Tax, and Banking
- [x] In App Store Connect → Agreements, Tax, and Banking
- [x] **Free Apps**: Should be active by default
- [x] **Paid Apps**: Must be signed for In-App Purchases
- [x] Click "View and Agree" on any pending agreements
- [x] Add banking information (required for paid apps)
- [x] Add tax forms (W-9 for US, W-8BEN for international)

## 🆔 Bundle ID Registration

### 1. Register App ID
- [x] Go to: https://developer.apple.com/account/resources/identifiers/list
- [x] Click "+" to register new identifier
- [x] Select "App IDs" → Continue
- [x] Select "App" → Continue
- [x] Fill in:
  - Description: `TypeB Family App`
  - Bundle ID: Explicit
  - Bundle ID: `com.typeb.familyapp`
- [x] Enable Capabilities:
  - [x] In-App Purchase
  - [x] Push Notifications (if using)
- [x] Register

## 📱 Create App in App Store Connect

### 1. Create New App
- [x] Go to App Store Connect → My Apps
- [x] Click "+" → "New App"
- [x] Fill in:
  - Platform: `iOS`
  - Name: `TypeB Family`
  - Primary Language: `English (U.S.)`
  - Bundle ID: Select `com.typeb.familyapp`
  - SKU: `TYPEB-FAMILY-001`
  - User Access: `Full Access`

### 2. App Information
- [x] Category: Select appropriate (e.g., "Productivity" or "Lifestyle")
- [x] Content Rights: Check if you own all rights
- [x] Age Rating: Complete questionnaire

## 💰 In-App Purchase Setup

### 1. Create Subscription Group
- [x] In your app → Features → In-App Purchases
- [x] Click "+" under Subscription Groups
- [x] Name: `Premium Features`
- [x] Save

### 2. Create Monthly Subscription
- [x] Click "+" in your subscription group
- [x] Reference Name: `Premium Monthly`
- [x] Product ID: `premium_monthly`
- [x] Subscription Duration: `1 Month`
- [x] Price: Select $4.99 tier
- [x] Add Localization:
  - Display Name: `Premium Monthly`
  - Description: `Unlock all premium features`

### 3. Create Annual Subscription
- [x] Click "+" in your subscription group
- [x] Reference Name: `Premium Annual`
- [x] Product ID: `premium_annual`
- [x] Subscription Duration: `1 Year`
- [x] Price: Select $39.99 tier
- [x] Add Localization:
  - Display Name: `Premium Annual`
  - Description: `Save 33% with annual billing`

### 4. Set Up Introductory Offer (7-day trial)
- [ ] For each subscription, click "+"  under Introductory Offer
- [ ] Type: Free Trial
- [ ] Duration: 7 days
- [ ] Save

## 🔑 API Key for RevenueCat

### 1. Generate API Key (if not done)
- [x] App Store Connect → Users and Access → Integrations
- [x] Click "+" to generate key
- [x] Name: `RevenueCat Integration`
- [x] Access: `App Manager`
- [x] Download .p8 file (only downloadable once!)
- [x] Note the Key ID (e.g., `KS2265QQ7W`)
- [x] Note the Issuer ID (UUID at top of page)

## ✅ Verification Checklist

Before attempting RevenueCat setup again:
- [x] Apple Developer Program is active ($99 paid)
- [x] Paid Applications agreement is signed
- [x] Bundle ID `com.typeb.familyapp` is registered
- [x] App exists in App Store Connect
- [x] In-App Purchases are created with correct IDs
- [x] API key .p8 file is saved
- [x] You have Key ID and Issuer ID

## 🚨 Common Issues

### "Bundle ID not found"
- App must exist in App Store Connect first
- Bundle ID must match exactly: `com.typeb.familyapp`

### "Invalid API Key"
- Using wrong Key ID (check your .p8 filename)
- Key was revoked or expired
- Wrong Issuer ID

### "Agreements not signed"
- Must accept Paid Applications agreement
- Banking info must be complete

## 🎯 Quick Win Path

If you're stuck on Apple setup:

1. **Build for Development First**:
   ```bash
   cd typeb-family-app
   eas build --platform ios --profile development
   ```

2. **Use RevenueCat Sandbox**:
   - Click "Continue Anyway" in RevenueCat
   - Get sandbox API keys for testing

3. **Test Locally**:
   - The app works without payments (dev mode fallback)
   - All features available for testing

4. **Complete Apple Setup Later**:
   - Take time to properly set up Apple account
   - Come back when everything is ready

## 📞 Getting Help

- **Apple Developer Support**: https://developer.apple.com/support/
- **App Store Connect Help**: https://help.apple.com/app-store-connect/
- **RevenueCat Support**: https://www.revenuecat.com/support

## 🎉 Once Everything is Ready

When all checkboxes are complete:
1. Return to RevenueCat setup
2. Use Key ID: `KS2265QQ7W` (from your file)
3. Upload your .p8 file
4. Enter Issuer ID
5. Validation should succeed!
6. Get your production API keys
7. Build and deploy your app!