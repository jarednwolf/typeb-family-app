# Monitoring Setup (Sentry)

## Web (Next.js)
- Install: `pnpm add @sentry/nextjs`
- Init: `sentry.client.config.ts` / `sentry.server.config.ts`
- Env: `SENTRY_DSN`

## Mobile (React Native)
- Install: `pnpm add @sentry/react-native`
- Init in app entry (see `typeb-family-app/src/services/errorMonitoring.tsx`)
- Env: `EXPO_PUBLIC_SENTRY_DSN`

## Alerts
- Configure alert rules for error rate and transaction latency
