import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';

if (!admin.apps.length) {
	admin.initializeApp();
}

// Ensure Firestore ignores undefined values in writes
try {
	admin.firestore().settings({ ignoreUndefinedProperties: true });
} catch {}

// Initialize Sentry for Cloud Functions (no-op if DSN missing)
try {
  const sentryDsn = process.env.SENTRY_DSN_FUNCTIONS || process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || process.env.GCLOUD_PROJECT || 'local',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      profilesSampleRate: 0,
    });
  }
} catch {}
