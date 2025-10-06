// Minimal Web Push subscription helper using the Notifications API
// Note: Full FCM Web Push requires additional setup (service worker + VAPID key).

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return 'denied';
  }
}


