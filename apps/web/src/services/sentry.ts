'use client';

import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if ((Sentry as any)._initialized) return;
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  (Sentry as any)._initialized = true;
}


