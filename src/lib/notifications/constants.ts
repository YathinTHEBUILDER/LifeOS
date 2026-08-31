import { NotificationPreferences } from '@/types/notifications';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  user_id: '',
  notifications_enabled: true,
  upcoming_events: true,
  event_reminder_timing: 15,
  task_reminders: true,
  task_due_soon: true,
  next_activity: true,
  next_activity_timing: 15,
  daily_planning: false,
  daily_planning_time: '07:30',
  focus_reminders: true,
  habit_reminders: false,
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  smart_free_time: false,
  missed_tasks: false,
};
