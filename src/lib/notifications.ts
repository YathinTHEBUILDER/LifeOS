import { CalendarEvent, Habit } from '@/types';

// In-session notification scheduler
let activeTimeouts: NodeJS.Timeout[] = [];

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch (err) {
    console.error('Failed to trigger notification:', err);
  }
}

export function scheduleSessionReminders(events: CalendarEvent[], habits: Habit[]) {
  // Clear previous timeouts
  activeTimeouts.forEach((t) => clearTimeout(t));
  activeTimeouts = [];

  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const now = Date.now();
  const maxLookaheadMs = 12 * 60 * 60 * 1000; // 12 hours lookahead

  // Schedule upcoming event notifications (5 minutes before start)
  events.forEach((event) => {
    if (event.is_completed) return;
    try {
      const eventTime = new Date(event.start_time).getTime();
      const remindTime = eventTime - 5 * 60 * 1000; // 5 mins before
      const delay = remindTime - now;

      if (delay > 0 && delay <= maxLookaheadMs) {
        const timeout = setTimeout(() => {
          sendBrowserNotification(`Upcoming: ${event.title}`, {
            body: `Starts in 5 minutes at ${new Date(event.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
          });
        }, delay);
        activeTimeouts.push(timeout);
      }
    } catch (e) {
      // ignore invalid dates
    }
  });

  // Schedule habit reminders
  habits.forEach((habit) => {
    if (!habit.is_active || !habit.reminder_time) return;
    try {
      const [hours, minutes] = habit.reminder_time.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      const delay = targetDate.getTime() - now;
      if (delay > 0 && delay <= maxLookaheadMs) {
        const timeout = setTimeout(() => {
          sendBrowserNotification(`Habit Reminder: ${habit.name}`, {
            body: habit.description || 'Time to complete your daily habit!',
          });
        }, delay);
        activeTimeouts.push(timeout);
      }
    } catch (e) {
      // ignore invalid reminder formats
    }
  });
}
