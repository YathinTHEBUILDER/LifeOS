import { CalendarEvent, Habit } from '@/types';
import { WebPushSubscription, DeviceType } from '@/types/notifications';

let activeTimeouts: NodeJS.Timeout[] = [];

/**
 * Check if Web Notifications & Push are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if the current device is iOS (iPhone/iPad)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check if running as an installed PWA (Home Screen)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Convert base64 URL safe VAPID key to Uint8Array for PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detect client device type and browser label
 */
export function getDevicePlatformInfo(): {
  device_type: DeviceType;
  browser: string;
  device_label: string;
} {
  if (typeof window === 'undefined') {
    return { device_type: 'desktop', browser: 'unknown', device_label: 'Desktop' };
  }

  const ua = navigator.userAgent;
  let device_type: DeviceType = 'desktop';
  if (/iPad|tablet/i.test(ua)) device_type = 'tablet';
  else if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) device_type = 'mobile';

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  let os = 'Device';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  const standaloneSuffix = isStandalone() ? ' (PWA)' : '';
  const device_label = `${browser} on ${os}${standaloneSuffix}`;

  return { device_type, browser, device_label };
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    return registration;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Get active Web Push subscription on this device
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error('Error fetching push subscription:', err);
    return null;
  }
}

/**
 * Subscribe device to Web Push
 */
export async function subscribeDeviceToPush(vapidPublicKey: string): Promise<WebPushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // 2. Ensure Service Worker is ready
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = (await registerServiceWorker()) || undefined;
    }
    const swReady = await navigator.serviceWorker.ready;

    // 3. Subscribe via pushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await swReady.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as any,
    });

    const jsonSub = subscription.toJSON();
    if (!jsonSub.endpoint || !jsonSub.keys?.p256dh || !jsonSub.keys?.auth) {
      throw new Error('Invalid push subscription returned by browser');
    }

    return {
      endpoint: jsonSub.endpoint,
      expirationTime: jsonSub.expirationTime,
      keys: {
        p256dh: jsonSub.keys.p256dh,
        auth: jsonSub.keys.auth,
      },
    };
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}

/**
 * Unsubscribe current device from push notifications
 */
export async function unsubscribeDeviceFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error unsubscribing device from push:', err);
    return false;
  }
}

/**
 * Local in-session reminder scheduler (Offline & active session fallback)
 */
export function scheduleSessionReminders(events: CalendarEvent[], habits: Habit[]) {
  activeTimeouts.forEach((t) => clearTimeout(t));
  activeTimeouts = [];

  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const now = Date.now();
  const maxLookaheadMs = 6 * 60 * 60 * 1000; // 6 hours

  events.forEach((event) => {
    if (event.is_completed || event.is_all_day) return;
    try {
      const eventTime = new Date(event.start_time).getTime();
      const remindTime = eventTime - 15 * 60 * 1000; // 15 mins before
      const delay = remindTime - now;

      if (delay > 0 && delay <= maxLookaheadMs) {
        const timeout = setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification(event.title, {
              body: `Starts in 15 minutes${event.location ? ` · ${event.location}` : ''}`,
              icon: '/icon-192.png',
              badge: '/badge-72.png',
              tag: `session-event-${event.id}`,
            });
          }
        }, delay);
        activeTimeouts.push(timeout);
      }
    } catch {
      // Ignore
    }
  });

  habits.forEach((habit) => {
    if (!habit.is_active || !habit.reminder_time) return;
    try {
      const [hours, minutes] = habit.reminder_time.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      const delay = targetDate.getTime() - now;
      if (delay > 0 && delay <= maxLookaheadMs) {
        const timeout = setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification(habit.name, {
              body: habit.description || 'Time for your daily habit.',
              icon: '/icon-192.png',
              badge: '/badge-72.png',
              tag: `session-habit-${habit.id}`,
            });
          }
        }, delay);
        activeTimeouts.push(timeout);
      }
    } catch {
      // Ignore
    }
  });
}
