## RevenueCat Validation Checklist

### iOS (Sandbox/TestFlight)
- Install build with StoreKit sandbox.
- New purchase flow: monthly, annual; verify entitlement unlocks premium UI.
- Restore purchases: logged-in same user; verify entitlement restores.
- Account switch: restore prompt offers correct previous subscription.
- Cancellation/expiration: entitlement revocation reflected within grace period.
- Network loss: purchase retried or gracefully fails; no duplicate charges.

### Android (Internal testing)
- New purchase: basic and premium tiers if applicable.
- Restore purchases across devices.
- Play billing errors handled (user canceled, item already owned).

### Cross-platform
- Entitlement gating: premium components/routes are hidden without entitlement.
- RevenueCat webhooks/Analytics: events arrive to chosen sink.
- Price localization and offer codes (if used) behave correctly.

### Notes
- Ensure config plugins (`plugins/fix-revenuecat-ios.js`, `plugins/withRevenueCatFix.js`) applied in EAS.
- Never ship secret keys in client. Use public SDK keys only.


