'use client';

/**
 * Open the browser's notifications settings page (best effort per browser).
 */
export function openSystemNotificationSettings(): void {
  try {
    const ua = navigator.userAgent.toLowerCase();
    const isEdge = /edg\//.test(ua);
    const isChrome = /chrome|crios/.test(ua) && !isEdge && !/opr|brave/.test(ua);
    const isFirefox = /firefox|fxios/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|android/.test(ua);

    let url = 'about:preferences';
    if (isChrome) url = 'chrome://settings/content/notifications';
    else if (isEdge) url = 'edge://settings/content/notifications';
    else if (isFirefox) url = 'about:preferences#privacy';
    else if (isSafari) url = 'https://support.apple.com/guide/safari/manage-website-notifications-sfri40734/mac';

    const opened = window.open(url, '_blank');
    if (!opened) window.location.href = url;
  } catch {
    // no-op
  }
}


