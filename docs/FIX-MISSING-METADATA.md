# 🔧 Fix "Missing Metadata" for Subscriptions - Quick Guide

## The Problem
Your subscriptions show **"Missing Metadata"** status in App Store Connect because required fields haven't been completed.

## The Solution - 4 Required Steps

### Step 1: Set Base Pricing (MOST IMPORTANT)
1. In your subscription page, scroll to **"Subscription Prices"** section
2. Click **"+"** or **"Set Up Pricing"**
3. Enter the price:
   - **Premium Monthly**: $4.99 USD
   - **Premium Annual**: $39.99 USD
4. Select **all territories** (or specific ones you want)
5. Click **Save**

### Step 2: Add Localization
1. Find **"Localizations"** section (below pricing)
2. Click **"Add Localization"** → Select **"English (U.S.)"**
3. Fill in:
   - **Display Name**: 
     - Monthly: "Premium Monthly"
     - Annual: "Premium Annual"
   - **Description**:
     ```
     Unlock all premium features:
     • Unlimited family members
     • Advanced analytics & insights
     • Custom reward systems
     • Priority support
     • Ad-free experience
     • Bulk task creation
     • Export reports
     
     Start with a 7-day free trial!
     ```
4. Click **Save**

### Step 3: Upload Required Images

#### A. Promotional Image (1024×1024) - For App Store promotion
1. **Generate the images** (already done):
   ```bash
   cd typeb-family-app
   ./scripts/create-subscription-promo-images.sh
   ```
2. Images are in: `typeb-family-app/subscription-promo-images/`
3. In App Store Connect, find **"Promotional Image"** section
4. Click **"Choose File"** and upload:
   - For Monthly: `premium_monthly_promo.png`
   - For Annual: `premium_annual_promo.png`

#### B. Review Information Screenshot (iPhone dimensions) - For Apple reviewers
1. **Generate the screenshots** (already done):
   ```bash
   cd typeb-family-app
   ./scripts/create-review-screenshots.sh
   ```
2. Screenshots are in: `typeb-family-app/review-screenshots/`
3. Scroll to **"Review Information"** section
4. Under **"Screenshot"**, click **"Choose File"** and upload:
   - For Monthly: `premium_monthly_review.png` (1179×2556)
   - For Annual: `premium_annual_review.png` (1179×2556)

### Step 4: Add Free Trial (After Pricing is Set)
1. After saving the base price, find **"Introductory Offers"** section
2. Click **"Create Introductory Offer"**
3. Configure:
   - **Offer Type**: Free Trial
   - **Duration**: 7 Days
   - **Countries**: All territories
4. Click **Create**

## Optional but Recommended

### Review Information
In the **"Review Information"** section:
- **Screenshot**: Upload from `review-screenshots/` folder (NOT the promotional image)
  - Use `premium_monthly_review.png` or `premium_annual_review.png`
- **Review Notes**:
  ```
  This subscription unlocks premium features including unlimited family members
  (free tier limited to 5), advanced analytics, and custom rewards.
  New users receive a 7-day free trial. The subscription auto-renews
  monthly at $4.99 or annually at $39.99 unless cancelled.
  ```

## Verification Checklist

After completing these steps, verify:
- [ ] Base price is set ($4.99 monthly / $39.99 annual)
- [ ] English localization added with display name and description
- [ ] Promotional image uploaded (1024×1024) in Promotional Image section
- [ ] Review screenshot uploaded (1179×2556) in Review Information section
- [ ] Free trial configured (7 days)
- [ ] Status changed from "Missing Metadata" to "Ready to Submit"

## Files You Need

**Promotional Images** (1024×1024 for App Store promotion):
```
typeb-family-app/subscription-promo-images/
├── premium_monthly_promo.png    # For Monthly subscription
├── premium_annual_promo.png     # For Annual subscription
└── premium_simple_promo.png     # Alternative design
```

**Review Screenshots** (1179×2556 for Apple reviewers):
```
typeb-family-app/review-screenshots/
├── premium_monthly_review.png        # For Monthly subscription
├── premium_annual_review.png         # For Annual subscription
└── subscription_selection_review.png # Shows both options
```

## Common Issues

**Still showing "Missing Metadata"?**
- Make sure you clicked **Save** after setting the price
- Ensure at least one territory is selected
- Verify the localization has both name AND description
- Refresh the page after saving

**Can't add free trial?**
- You MUST set and save the base price first
- The subscription must be in "Ready to Submit" state
- Free trial is added via "Introductory Offers", not the main pricing

**Image upload failing?**
- Must be exactly 1024×1024 pixels
- PNG or JPG format only
- No transparency allowed
- No rounded corners

## Time Required: ~10 minutes

1. Set pricing: 2 minutes
2. Add localization: 2 minutes
3. Upload image: 1 minute
4. Add free trial: 2 minutes
5. Save and verify: 1 minute

---

**Need the full guide?** See [`APP-STORE-SUBMISSION-GUIDE.md`](APP-STORE-SUBMISSION-GUIDE.md)