export interface NotificationPreferences {
  user_id: string;
  notifications_enabled: boolean;
  upcoming_events: boolean;
  event_reminder_timing: number; // 5, 10, 15, 30, 60 minutes
  task_reminders: boolean;
  task_due_soon: boolean;
  next_activity: boolean;
  next_activity_timing: number; // 5, 10, 15, 30 minutes
  daily_planning: boolean;
  daily_planning_time: string; // HH:mm (e.g. '07:30')
  focus_reminders: boolean;
  habit_reminders: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:mm (e.g. '22:00')
  quiet_hours_end: string; // HH:mm (e.g. '07:00')
  smart_free_time: boolean;
  missed_tasks: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface WebPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
}

export interface NotificationDevice {
  id: string;
  user_id: string;
  device_type: DeviceType;
  browser: string;
  device_label: string;
  endpoint: string;
  subscription_data: WebPushSubscription;
  enabled: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'event' | 'task' | 'next_activity' | 'focus' | 'habit' | 'daily_plan' | 'test' | 'info';
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string | null;
  link?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationDelivery {
  id: string;
  user_id: string;
  device_id?: string | null;
  idempotency_key: string;
  notification_type: string;
  scheduled_for: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'skipped_quiet_hours' | 'skipped_completed' | 'skipped_deleted';
  failure_reason?: string | null;
  created_at: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data: {
    url: string;
    type: string;
    id?: string;
    priority?: NotificationPriority;
    [key: string]: any;
  };
}

export interface ScheduledNotificationItem {
  idempotencyKey: string;
  type: InAppNotification['type'];
  title: string;
  body: string;
  url: string;
  priority: NotificationPriority;
  scheduledFor: Date;
  metadata?: Record<string, any>;
}
