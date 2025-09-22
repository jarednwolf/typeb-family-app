# Troubleshooting

## Build/Install
- pnpm install fails: `pnpm store prune && rm -rf node_modules && pnpm install`
- Expo metro issues: `npx expo start --clear`

## Firebase
- Emulator ports busy: `lsof -i :8080` etc.; kill process and retry
- Auth errors: verify `NEXT_PUBLIC_FIREBASE_*` or `EXPO_PUBLIC_FIREBASE_*`
- Storage signed URLs fail locally: expected in emulator. Ensure `STORAGE_EMULATOR_HOST` is set (auto by emulators). In prod, verify service account has `roles/storage.objectViewer` and key is available to Functions runtime.

## CI/CD
- Missing secrets: ensure GitHub/Vercel secrets set
- Vercel build fails: check logs; verify envs

## Mobile
- iOS pods: `cd ios && pod deintegrate && pod install`
- Google Sign-In: set correct client IDs; reinstall app after change

## Web
- Google SSO popup blocked: allow popups; ensure OAuth origins match
- 401s on webhooks: verify `REVENUECAT_WEBHOOK_SECRET`
