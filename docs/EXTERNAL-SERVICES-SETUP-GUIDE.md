# External Services Setup Guide for TypeB Family App

## 📱 RevenueCat Setup (Payment Processing)

### Step 1: Create RevenueCat Account
1. Go to https://app.revenuecat.com/signup
2. Sign up with your email
3. Create a new project called "TypeB Family App"

### Step 2: Configure App in RevenueCat
1. **Add iOS App**:
   - Bundle ID: `com.typeb.familyapp`
   - App Name: TypeB Family
   - Select "App Store Connect" as platform

2. **Add Android App**:
   - Package Name: `com.typeb.familyapp`
   - App Name: TypeB Family
   - Select "Google Play Console" as platform

### Step 3: Create Products
Navigate to Products → Add Products:

#### iOS Products (App Store Connect):
1. **Monthly Subscription**:
   - Product ID: `typeb_premium_monthly`
   - Price: $4.99
   - Duration: 1 month
   - Free Trial: 7 days
   - Description: "Unlock all premium features with monthly access"

2. **Annual Subscription**:
   - Product ID: `typeb_premium_annual`
   - Price: $39.99 (save $19.89/year)
   - Duration: 1 year
   - Free Trial: 7 days
   - Description: "Best value! Save 33% with annual subscription"

#### Android Products (Google Play):
Use the same product IDs and pricing as iOS.

### Step 4: Create Entitlement
1. Go to Entitlements → Add Entitlement
2. Name: `premium`
3. Description: "Premium Features Access"
4. Attach both products to this entitlement

### Step 5: Get API Keys
1. Go to Project Settings → API Keys
2. Copy the iOS API Key (starts with `appl_`)
3. Copy the Android API Key (starts with `goog_`)

### Step 6: Configure Webhooks (Optional but Recommended)
1. Go to Project Settings → Webhooks
2. Add webhook URL: `https://api.typebfamily.com/webhooks/revenuecat`
3. Select events:
   - Initial purchase
   - Renewal
   - Cancellation
   - Expiration

---

## 🔍 Sentry Setup (Error Monitoring)

### Step 1: Create Sentry Account
1. Go to https://sentry.io/signup/
2. Sign up with your email
3. Select "React Native" as your platform

### Step 2: Create Project
1. Organization Name: TypeB (or your company name)
2. Project Name: typeb-family-app
3. Platform: React Native
4. Alert frequency: Real-time

### Step 3: Configure Project Settings
1. Go to Settings → Projects → typeb-family-app
2. Set up these configurations:
   - **Error Sampling**: 100% (for initial launch)
   - **Performance Sampling**: 10% (to manage costs)
   - **Release Tracking**: Enabled
   - **Source Maps**: Upload enabled

### Step 4: Get DSN
1. Go to Settings → Projects → typeb-family-app → Client Keys
2. Copy the DSN (format: `https://[key]@[org].ingest.sentry.io/[project-id]`)

### Step 5: Set Up Alerts
1. Go to Alerts → Create Alert Rule
2. Recommended alerts:
   - High error rate (>1% of sessions)
   - New error types
   - Performance degradation
   - Crash free rate < 99%

### Step 6: Configure Integrations
1. Slack integration for instant alerts
2. Email digest for daily summaries
3. GitHub integration for issue tracking

---

## 🔐 Environment Variables to Update

After setting up both services, update your `.env.production` file:

```env
# RevenueCat Configuration
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_[YOUR_ACTUAL_IOS_KEY]
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_[YOUR_ACTUAL_ANDROID_KEY]

# Sentry Configuration
EXPO_PUBLIC_SENTRY_DSN=https://[YOUR_KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_RELEASE=1.0.1
```

---

## 🧪 Testing the Integration

### RevenueCat Testing
1. Use sandbox accounts for testing:
   - iOS: Create sandbox tester in App Store Connect
   - Android: Add test email in Google Play Console

2. Test scenarios:
   - Purchase monthly subscription
   - Purchase annual subscription
   - Cancel subscription
   - Restore purchases
   - Upgrade/downgrade

### Sentry Testing
1. Trigger test error:
   ```javascript
   Sentry.captureException(new Error('Test error from production'));
   ```

2. Verify in dashboard:
   - Error appears in real-time
   - Stack trace is readable
   - User context is attached
   - Performance metrics are tracked

---

## 📊 Monitoring Dashboard Setup

### RevenueCat Dashboard
Monitor these metrics:
- Monthly Recurring Revenue (MRR)
- Trial conversion rate
- Churn rate
- Active subscriptions
- Revenue by product

### Sentry Dashboard
Track these metrics:
- Crash free rate
- Error rate
- Performance scores
- User feedback
- Release adoption

---

## 🚨 Important Notes

1. **API Key Security**:
   - Never commit API keys to git
   - Use environment variables only
   - Rotate keys if exposed

2. **Testing First**:
   - Always test in sandbox/development first
   - Verify all flows before production
   - Have rollback plan ready

3. **Gradual Rollout**:
   - Start with 10% of users
   - Monitor for 24 hours
   - Increase to 50%, then 100%

4. **Support Preparation**:
   - Document common issues
   - Prepare FAQ for payments
   - Set up refund process

---

## 📞 Support Contacts

### RevenueCat Support
- Documentation: https://docs.revenuecat.com
- Support: support@revenuecat.com
- Slack Community: https://rev.cat/slack

### Sentry Support
- Documentation: https://docs.sentry.io
- Support: support@sentry.io
- Discord: https://discord.gg/sentry

---

## ✅ Setup Checklist

### RevenueCat
- [ ] Account created
- [ ] iOS app configured
- [ ] Android app configured
- [ ] Products created with correct pricing
- [ ] Entitlement configured
- [ ] API keys obtained
- [ ] Webhooks configured (optional)
- [ ] Sandbox testing accounts created

### Sentry
- [ ] Account created
- [ ] Project created
- [ ] DSN obtained
- [ ] Alerts configured
- [ ] Integrations set up
- [ ] Test error sent successfully

### Integration
- [ ] Environment variables updated
- [ ] Code integration tested
- [ ] Error tracking verified
- [ ] Payment flow tested
- [ ] Production build created

---

*Last Updated: January 9, 2025*
*Version: 1.0*