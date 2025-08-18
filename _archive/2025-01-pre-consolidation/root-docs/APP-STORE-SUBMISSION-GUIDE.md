# TypeB App Store Submission Guide

## 1. Adding 7-Day Free Trial to Subscriptions

### Step-by-Step Navigation in App Store Connect:

1. **Sign in** to [App Store Connect](https://appstoreconnect.apple.com) with wolfjn1@gmail.com
2. Click **"My Apps"** from the main dashboard
3. Select **"TypeB Family"** (App Store ID: 6749812496)
4. In the left sidebar, click **"Monetization"** → **"Subscriptions"**
   - Note: NOT "In-App Purchases" - Subscriptions have their own section
5. Click on your **Subscription Group** (if you haven't created one, you'll need to create it first)
6. Select **"premium_monthly"** subscription
7. Click the **"+"** button next to **"Subscription Prices"**
8. Under **"Introductory Offers"**, click **"Create Introductory Offer"**
9. Configure the free trial:
   - **Offer Type**: Select "Free Trial"
   - **Duration**: Select "7 Days"
   - **Countries**: Select all territories where you want to offer the trial
10. Click **"Create"**
11. Repeat steps 6-10 for **"premium_annual"** subscription

### Important Notes:
- Free trials are automatically applied to new subscribers
- Users can only use one free trial per subscription group
- The trial will auto-convert to paid subscription unless cancelled

## 1.5. Fixing "Missing Metadata" for Subscriptions

If you see "Missing Metadata" status on your subscriptions, you need to complete:

### Required Fields:

1. **Subscription Prices** (CRITICAL):
   - Click **"+"** or **"Set Up Pricing"** in the Subscription Prices section
   - Enter **$4.99** for Premium Monthly, **$39.99** for Premium Annual
   - Select all territories where you want to offer the subscription

2. **Localizations**:
   - Click **"Add Localization"** → Select **"English (U.S.)"**
   - **Display Name**: "Premium Monthly" or "Premium Annual"
   - **Description**:
     ```
     Unlock all premium features:
     • Unlimited family members
     • Advanced analytics & insights
     • Custom reward systems
     • Priority support
     • Ad-free experience
     • Bulk task creation
     
     7-day free trial for new users!
     ```

3. **Promotional Image** (1024×1024):
   - Run: `cd typeb-family-app && ./scripts/create-subscription-promo-images.sh`
   - Upload the generated images from `subscription-promo-images/` folder
   - Use `premium_monthly_promo.png` for monthly subscription
   - Use `premium_annual_promo.png` for annual subscription

4. **Review Information** (Optional but helps):
   - **Screenshot**: Upload a screenshot showing the subscription in your app
   - **Review Notes**: "Premium subscription with 7-day free trial. Unlocks unlimited family members and advanced features."

After completing these fields, the status will change from "Missing Metadata" to "Ready to Submit".

## 2. Updating App Name and Logo

### Changing App Name from "TypeB Family" to "TypeB":

1. In App Store Connect, go to your app
2. Click **"App Information"** in the left sidebar
3. Under **"Localizable Information"**:
   - Change **"Name"** from "TypeB Family" to "TypeB"
   - This change will take effect with your next app version submission
4. Click **"Save"** in the top right

### Adding Your App Logo:

1. Navigate to **"App Store"** → **"iOS App"** → **"1.1.0 Prepare for Submission"**
2. Scroll to **"App Icon"**
3. Upload your 1024x1024px app icon (no transparency, no rounded corners)
   - The system will automatically generate all required sizes
4. The icon must match the icon in your app binary

### Updating Screenshots:
- In the same "1.1.0 Prepare for Submission" page
- Scroll to **"App Preview and Screenshots"**
- Upload new screenshots (see Section 3 for creation guide)

## 3. Creating Professional Screenshots

### Quick Professional Screenshot Creation:

#### Option A: Using Screenshot (Recommended - Fastest)
1. **Install Screenshot app** on your Mac (free from Mac App Store)
2. **Take raw screenshots** from TestFlight:
   - Open TestFlight on iPhone 15 Pro Max (for 6.7" display)
   - Navigate to each screen you want to capture
   - Press Volume Up + Side Button simultaneously
3. **Create marketing frames**:
   - Open Screenshot app
   - Import your raw screenshots
   - Add device frames (iPhone 15 Pro)
   - Add text overlays with key features
   - Export at 1290 × 2796 pixels

#### Option B: Using Figma (Free)
1. **Create Figma account** at figma.com
2. **Use iPhone mockup template**:
   - Search "iPhone 15 Pro Max mockup" in Community
   - Insert your screenshots
   - Add marketing text and backgrounds
3. **Export** at 1290 × 2796 pixels

### Recommended Screenshot Sequence:

1. **Hero Shot** - Dashboard with multiple tasks
   - Headline: "Manage Family Tasks Effortlessly"
   - Show: Full dashboard with 4-5 active tasks

2. **Task Creation** - Creating task with photo requirement
   - Headline: "Photo Validation Ensures Completion"
   - Show: Task creation screen with photo option enabled

3. **Family Management** - Family members screen
   - Headline: "Organize Your Entire Family"
   - Show: Family screen with multiple members and roles

4. **Premium Features** - Analytics or advanced features
   - Headline: "Unlock Premium Analytics"
   - Show: Analytics dashboard or premium feature highlight

5. **Rewards System** - Points and achievements
   - Headline: "Motivate with Rewards & Points"
   - Show: Rewards screen or leaderboard

### Quick Text Overlays:
- Font: SF Pro Display Bold
- Size: 60-80pt
- Color: Your brand colors or high contrast
- Position: Top 20% of screen

## 4. Optimized App Store Description

### App Name
**TypeB**

### Subtitle (30 characters max)
**Family Tasks Made Simple**

### Promotional Text (170 characters)
🎉 Launch Special: 7-day FREE trial! Transform how your family manages tasks with photo validation, rewards, and real-time collaboration. Join thousands of organized families!

### Description
```
TypeB revolutionizes family task management with a perfect blend of simplicity and accountability. Whether you're managing chores, homework, or family projects, TypeB keeps everyone on track.

KEY FEATURES:

📸 Photo Validation
Ensure tasks are completed correctly with built-in photo verification. Kids snap a photo when done, parents approve with one tap.

👨‍👩‍👧‍👦 Smart Family Roles
Automatic role assignment based on age. Parents manage, kids complete, everyone stays organized.

🏆 Motivation That Works
Points, streaks, and achievements keep kids engaged. Turn chores into challenges they actually want to complete.

📊 Premium Analytics (Premium)
Track completion rates, identify patterns, and optimize your family's productivity with detailed insights.

🎯 Flexible Task Management
• One-time or recurring tasks
• Custom categories
• Priority levels
• Due date reminders
• Photo requirements

PREMIUM FEATURES:
• Unlimited family members (Free: 5 members)
• Advanced analytics dashboard
• Custom reward systems
• Priority support
• Ad-free experience
• Bulk task creation
• Export reports

SUBSCRIPTION OPTIONS:
• Monthly: $4.99/month
• Annual: $39.99/year (Save 33%)
• 7-day FREE trial for new users

PERFECT FOR:
• Busy parents managing household tasks
• Families with kids ages 5-18
• Multi-generational households
• Separated parents coordinating responsibilities

Join thousands of families who've transformed chaos into collaboration with TypeB.

Privacy Policy: [your-url]/privacy
Terms of Service: [your-url]/terms
Support: support@typebapp.com
```

### Keywords (100 characters)
```
family,tasks,chores,kids,parenting,organize,todo,household,rewards,photos,validation,productivity
```

## 5. Submitting Version 1.1.0 with Build #16

### Pre-Submission Checklist:
- [ ] TestFlight Build #16 is "Ready to Submit"
- [ ] All screenshots uploaded (5 minimum)
- [ ] App icon uploaded
- [ ] Description and metadata complete
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Age rating questionnaire completed

### Step-by-Step Submission:

1. **Navigate to Version Submission**:
   - App Store Connect → My Apps → TypeB Family
   - Click **"+"** next to "iOS App" or select existing "1.1.0"

2. **Select Build**:
   - Scroll to **"Build"** section
   - Click **"Select a build before you submit your app"**
   - Choose **"1.1.0 (16)"** from TestFlight builds
   - Click **"Done"**

3. **Version Information**:
   - **What's New**: Add release notes
   ```
   • Introducing 7-day FREE trial for new users
   • Performance improvements and bug fixes
   • Enhanced photo upload reliability
   • Improved family onboarding experience
   ```

4. **App Review Information**:
   - **Sign-in Required**: Yes
   - **Demo Account**:
     ```
     Email: demo@typebapp.com
     Password: Demo123!
     ```
   - **Notes**: "TestFlight Build #16 has been thoroughly tested with 50+ beta users"

5. **Configure Pricing**:
   - Click **"Pricing and Availability"**
   - Ensure app is set to **"Free"** (with In-App Purchases)
   - Select all desired countries

6. **Final Review**:
   - Review all sections for completion (no red badges)
   - Check "Localizable Information"
   - Verify screenshots for all required device sizes

7. **Submit for Review**:
   - Click **"Add for Review"** in top right
   - Answer export compliance questions:
     - Uses encryption: Yes (HTTPS only)
     - Exempt: Yes
   - Review summary page
   - Click **"Submit to App Review"**

### Post-Submission:

1. **Expected Timeline**:
   - Review typically takes 24-48 hours
   - You'll receive email updates at each stage
   - Can expedite if needed (limited uses)

2. **Monitor Status**:
   - Check App Store Connect regularly
   - Respond quickly to any reviewer questions
   - Be prepared to provide additional information

3. **After Approval**:
   - Can release immediately or schedule
   - Monitor crash reports and user feedback
   - Prepare 1.1.1 hotfix branch if needed

## Quick Actions Checklist

### Today's Priority Actions:

1. **Free Trial Setup** (15 minutes):
   - Log into App Store Connect
   - Navigate to Monetization → Subscriptions
   - Add 7-day free trial to both subscriptions

2. **Update App Name** (5 minutes):
   - App Information → Name → Change to "TypeB"

3. **Create Screenshots** (30-45 minutes):
   - Take 5 screenshots from TestFlight
   - Add to Screenshot app or Figma
   - Export at correct resolution

4. **Submit Build** (20 minutes):
   - Select Build #16
   - Complete all metadata
   - Submit for review

## Common Issues & Solutions

### "Build Not Available"
- Ensure Build #16 shows "Ready to Submit" in TestFlight
- Wait 10-15 minutes after TestFlight processing
- Refresh App Store Connect

### "Missing Compliance"
- Go to TestFlight → Build #16 → Export Compliance
- Select "Uses Encryption" → "HTTPS only" → "Exempt"

### "Screenshot Wrong Size"
- Must be exactly 1290 × 2796 for 6.7" display
- Use Preview app to check dimensions
- No transparency allowed

### "Subscription Not Showing"
- Subscriptions must be in "Ready to Submit" state
- Check that subscription group is created
- Ensure products are linked to app

## Support Resources

- **App Store Connect Help**: https://help.apple.com/app-store-connect/
- **Screenshot Specifications**: https://help.apple.com/app-store-connect/#/devd274dd925
- **Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Expedited Review Request**: https://developer.apple.com/contact/app-store/

## Next Steps After Launch

1. **Monitor Performance**:
   - Check Analytics daily for first week
   - Monitor crash reports
   - Track subscription conversions

2. **Gather Feedback**:
   - Respond to reviews
   - Send feedback survey to beta users
   - Plan 1.2.0 features based on user input

3. **Marketing Push**:
   - Update website with App Store badge
   - Send launch email to waitlist
   - Post on social media with download link

---

**Need Help?** 
- Technical Issues: Check TestFlight feedback
- Submission Issues: Contact App Store Connect support
- Revenue Questions: Check RevenueCat dashboard

Good luck with your launch! 🚀