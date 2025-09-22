# Testing

## Types
- Unit: packages and isolated modules
- Integration: Redux slices, services with Firebase emulator
- E2E: Mobile flows (Detox) and web critical paths

## Running
```bash
# Unit/integration
pnpm test

# Web E2E (coming soon)
cd apps/web && pnpm test:e2e

# Mobile E2E (Detox; coming soon)
cd typeb-family-app && pnpm e2e:ios
```

## Firebase Emulator
```bash
# Preferred: one-shot smoke run (functions+firestore+storage)
pnpm run firebase:smoke

# Or attach-only run against already-running emulators
pnpm run firebase:smoke:run

# Manual start (if needed)
firebase emulators:start --only firestore,auth,storage,functions
```

## Functions Error Reporting smoke
```bash
# Verifies /reportError -> writes errorReports doc, triggers processErrorReports,
# and updates errorSummaries without FieldValue.increment and with idempotency
pnpm run firebase:smoke
```

## Sentry smoke
```bash
# Web: check diagnostic route (returns JSON with hasDsn)
curl -s http://localhost:3000/api/diagnostics/sentry | jq

# Mobile: EXPO_PUBLIC_SENTRY_DSN in typeb-family-app/.env.local and run app; trigger a test error
# Functions: set SENTRY_DSN or SENTRY_DSN_FUNCTIONS in root .env.*; invoke /reportError with bad body to capture exception
```

## Coverage
- Target: 80% lines/functions in packages and core flows

## CI
- Run unit/integration on PRs
- E2E on staging or nightly
- Rules tests on PRs:
```bash
pnpm -w run rules:test
```

## Storage thumbnails & URLs
```bash
# In emulator: storage URLs are deterministic and unsigned, built from STORAGE_EMULATOR_HOST
# Example: http://127.0.0.1:9200/v0/b/<bucket>/o/<path>?alt=media
# In production: signed URLs are generated; ensure service account has storage.objectViewer
# Smoke note: Signed URL generation is expected to fail on emulator; now skipped with emulator-aware URLs
pnpm run firebase:smoke
```
