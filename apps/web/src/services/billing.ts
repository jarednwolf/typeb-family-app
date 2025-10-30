'use client';

/**
 * billing service
 * Opens the billing customer portal in a new tab/window.
 * Falls back to Settings page if the env var is not set.
 */
export function openBillingPortal(): void {
  const url = process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || '/dashboard/settings';
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}


