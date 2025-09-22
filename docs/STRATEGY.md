# TypeB Strategy, Tech Stack, and Current State

## Strategy Overview

- Mission: Help families build habits via gamified task management and positive reinforcement.
- Product: Mobile-first (Expo) with a public web app for onboarding/management.
- Monetization: RevenueCat subscriptions (monthly/annual), premium features gated by entitlements.
- Compliance: COPPA-first design (age gate, verified parental consent, data minimization).

## Tech Stack

- Frontend: React Native (Expo SDK 50), Next.js 15 (App Router)
- State: Redux Toolkit (@typeb/store)
- Shared: @typeb/core (business logic), @typeb/types (models)
- Backend: Firebase (Auth, Firestore, Storage, Functions)
- Payments: RevenueCat (webhooks handled in Next API route)
- Hosting: Vercel (web), EAS (mobile)

## Key Decisions (ADRs)

- Monorepo with pnpm + Turbo — see `docs/ADR/001-monorepo-structure.md`
- Firebase as backend — see `docs/ADR/002-firebase-backend.md`
- Redux Toolkit for state — see future ADR

## Current State (grounded)

- Web: Firebase client initialized from env; Google SSO implemented; RevenueCat webhook implemented; Sentry not wired
- Mobile: Firebase config reads from env; emulators supported; Google Sign-In implemented; Sentry service exists (needs DSN/app init wiring)
- Packages: @typeb/core, @typeb/store, @typeb/types built and consumed by web
- Functions: COPPA jobs and endpoints present under root; duplicate legacy functions exist under `typeb-family-app/functions`
- Rules: Firestore/Storage rules present with COPPA logic
- Docs: Consolidated under `docs/`; ADR index added; historical notes captured

## Gaps/Risks

- Functions duplicated under `typeb-family-app/functions` vs root `functions/`
- Monitoring (Sentry) not wired end-to-end (web missing, mobile pending DSN)
- Google OAuth client IDs and Apple Sign In configuration pending
- CI/CD deploy/EAS jobs missing; staging activation not confirmed

## Next Steps (seeded)

1. Consolidate Cloud Functions in root `functions/`; remove legacy `typeb-family-app/functions`
2. Add Sentry client/server setup with DSN from env for web and mobile
3. Configure Google OAuth (web/mobile) and add sign-in buttons behind flags; plan Apple Sign In
4. Harden Firestore rules; add tests and emulator CI job
5. Add end-to-end auth and subscription flow tests (mock RevenueCat); configure products/keys
6. Add CI/CD deploy jobs (Vercel, Firebase); optional EAS workflow; confirm staging activation
7. Migrate `typeb-family-app` to `apps/mobile` post-launch (update workspace & CI)
8. Add `guides/firebase-setup.md`, `guides/payment-integration.md`, `guides/monitoring-setup.md`

## Environments & Secrets

- Web envs: `NEXT_PUBLIC_FIREBASE_*`, `REVENUECAT_WEBHOOK_SECRET`, Firebase Admin creds for webhooks
- Mobile envs: `EXPO_PUBLIC_FIREBASE_*`, RevenueCat public keys, Sentry DSN
- CI: Use per-environment secrets, no hardcoded keys in repo

## Definition of Done (near-term)

- Production incident-ready: monitoring, alerts, error tracking
- Secure by default: COPPA compliance flows enforced; rules tested
- Payments functional: entitlements reflect in user profile; revocations handled
- Docs current: each feature PR updates relevant docs and ADRs
