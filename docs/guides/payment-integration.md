# Payment Integration (RevenueCat)

## Setup
- Create products (monthly, annual)
- Get API keys (iOS/Android public, webhook secret)

## Webhook
- Endpoint: `/api/webhooks/revenuecat`
- Secret: `REVENUECAT_WEBHOOK_SECRET`

## Entitlements
- Store entitlements on subscription doc and `users.isPremium`

## Verify
- Test purchase in sandbox
- Check Firestore `subscriptions/{userId}` and `users.isPremium`
