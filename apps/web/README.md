# Web App Design Tokens and UI Conventions

This app aligns web UI with the mobile design system. Key tokens live in `src/app/globals.css`.

## Colors
- Brand: `--color-primary` (#0A0A0A), `--color-info` (#007AFF), success/warning/error
- Surfaces: `--color-surface`, `--color-background`, `--color-separator`

## Type Scale
- `.heading-1` (2rem/1.1), `.heading-2` (1.5rem/1.2)
- `.body-lg` (1rem/1.6) and `.body-sm` (0.875rem/1.5)

## Spacing
- Section wrappers: `.section-y` (40px) and `.section-y-sm` (24px)
- Cards: rounded-xl, `shadow-sm`, 24px padding on primary cards

## Iconography
- Use inline SVG icons (no emojis) for professionalism and consistency.
- Stat cards: 48px icon container with brand-tinted background.

## Accessibility
- All interactive elements have focus styles and aria labels where appropriate.
- Color choices pass contrast on text/icons.

## Patterns
- Empty states: icon (48px), headline, body, and primary action.
- Quick actions: rounded-xl, strong contrast for primary action.

## Deployment checklist (web)
- Set env:
  - NEXT_PUBLIC_FIREBASE_* (see lib/firebase/config.ts)
  - NEXT_PUBLIC_GA4_ID, NEXT_PUBLIC_FB_PIXEL_ID (optional)
  - NEXT_PUBLIC_SENTRY_DSN (optional)
  - NEXT_PUBLIC_BILLING_PORTAL_URL (for Manage subscription)
- Enable Firebase Firestore and Storage rules (see repo rules files)
- Verify redirect URLs for Google SSO
- Vercel project connected to repo; production branch main

## New capabilities
- Quick-create task modal with templates (Chore, Homework, Routine)
- Photo upload for tasks that require validation (stored in Firebase Storage)
- Validation queue with approve/reject notes and bulk actions
- Premium upsell banner and Manage subscription link in Settings
- Notifications opt-in (web push permissions prompt)
- Analytics events for quick-create, photo submit, and validation decisions
- Sentry error/perf monitoring (guarded by NEXT_PUBLIC_SENTRY_DSN)

## Feature flags
- Local dev: set localStorage `featureFlags` JSON to toggle features
- Flags: enableSocialProof, enableDemoVideo, etc.

Duplicate web app folder

This folder mirrors `apps/web` in the monorepo and exists temporarily for reference during consolidation. Do not use. Work in `/apps/web`.
