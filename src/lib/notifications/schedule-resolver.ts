import { SupabaseClient } from '@supabase/supabase-js';
import {
  NotificationPreferences,
  ScheduledNotificationItem,
} from '@/types/notifications';
import { CalendarEvent, Task, Habit, HabitLog } from '@/types';
import { sendPushToUser, PushDeliveryResult } from './server-push';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './constants';
export { DEFAULT_NOTIFICATION_PREFERENCES };

/**
 * Check if the current time falls within user's Quiet Hours
 */
export function isQuietHoursActive(
  now: Date,
  startTimeStr: string = '22:00',
  endTimeStr: string = '07:00',
  timezone?: string
): boolean {
  try {
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const formatted = timeFormatter.format(now);
    const [currentHour, currentMin] = formatted.split(':').map(Number);
    const currentMins = currentHour * 60 + currentMin;

    const [startHour, startMin] = startTimeStr.split(':').map(Number);
    const startMins = startHour * 60 + startMin;

    const [endHour, endMin] = endTimeStr.split(':').map(Number);
    const endMins = endHour * 60 + endMin;

    if (startMins > endMins) {
      // Overnight (e.g. 22:00 to 07:00)
      return currentMins >= startMins || currentMins < endMins;
    } else {
      // Same day (e.g. 13:00 to 15:00)
      return currentMins >= startMins && currentMins < endMins;
    }
  } catch {
    return false;
  }
}

/**
 * Extract HH:mm in user timezone
 */
export function getCurrentTimeInTimezone(now: Date, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);
  } catch {
    return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  }
}

/**
 * Extract YYYY-MM-DD in user timezone
 */
export function getCurrentDateInTimezone(now: Date, timezone?: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/**
 * Resolve deterministic notification items for a user at the given evaluation moment
 */
export function resolvePendingNotifications(params: {
  userId: string;
  preferences: NotificationPreferences;
  events: CalendarEvent[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  timezone?: string;
  now?: Date;
  evaluationWindowMinutes?: number; // default lookahead/lookbehind window: 4 minutes
}): ScheduledNotificationItem[] {
  const {
    userId,
    preferences,
    events,
    tasks,
    habits,
    habitLogs,
    timezone = 'UTC',
    now = new Date(),
    evaluationWindowMinutes = 4,
  } = params;

  if (!preferences.notifications_enabled) {
    return [];
  }

  const items: ScheduledNotificationItem[] = [];
  const nowMs = now.getTime();
  const windowMs = evaluationWindowMinutes * 60 * 1000;
  const todayStr = getCurrentDateInTimezone(now, timezone);
  const currentTimeStr = getCurrentTimeInTimezone(now, timezone);

  // 1. Upcoming Events & Next Activity
  if (preferences.upcoming_events || preferences.next_activity) {
    const reminderMins = preferences.event_reminder_timing || 15;
    const nextActivityMins = preferences.next_activity_timing || 15;

    events.forEach((event) => {
      if (event.is_completed) return;
      if (event.is_all_day) return;

      try {
        const startTime = new Date(event.start_time).getTime();
        if (isNaN(startTime)) return;

        // A) Event Reminder
        if (preferences.upcoming_events) {
          const targetRemindTime = startTime - reminderMins * 60 * 1000;
          const diff = Math.abs(nowMs - targetRemindTime);

          if (diff <= windowMs) {
            const locText = event.location ? ` · ${event.location}` : '';
            items.push({
              idempotencyKey: `event:${event.id}:reminder_${reminderMins}m:${event.start_time}`,
              type: 'event',
              title: event.title,
              body: `Starts in ${reminderMins} minutes${locText}`,
              url: `/calendar?event=${event.id}`,
              priority: 'normal',
              scheduledFor: new Date(targetRemindTime),
              metadata: { eventId: event.id, startTime: event.start_time },
            });
          }
        }

        // B) Next Activity Notification ("NEXT — Python Assignment")
        if (preferences.next_activity && nextActivityMins !== reminderMins) {
          const nextTargetTime = startTime - nextActivityMins * 60 * 1000;
          const diffNext = Math.abs(nowMs - nextTargetTime);

          if (diffNext <= windowMs) {
            items.push({
              idempotencyKey: `next_activity:${event.id}:${event.start_time}:${nextActivityMins}m`,
              type: 'next_activity',
              title: `NEXT — ${event.title}`,
              body: `Starts in ${nextActivityMins} minutes`,
              url: `/calendar?event=${event.id}`,
              priority: 'normal',
              scheduledFor: new Date(nextTargetTime),
              metadata: { eventId: event.id, startTime: event.start_time },
            });
          }
        }
      } catch (err) {
        // Skip invalid date strings safely
      }
    });
  }

  // 2. Task Reminders (Due Soon)
  if (preferences.task_reminders && preferences.task_due_soon) {
    tasks.forEach((task) => {
      if (task.status === 'completed' || task.status === 'cancelled') return;
      if (!task.due_date || !task.due_time) return;

      try {
        if (task.due_date !== todayStr) return;

        const [dueH, dueM] = task.due_time.split(':').map(Number);
        const [curH, curM] = currentTimeStr.split(':').map(Number);
        const taskDueMins = dueH * 60 + dueM;
        const curMins = curH * 60 + curM;

        // Reminder 30 minutes before due time
        const reminderLeadMins = 30;
        const targetRemindMins = taskDueMins - reminderLeadMins;
        const diffMins = Math.abs(targetRemindMins - curMins);

        if (diffMins <= evaluationWindowMinutes) {
          items.push({
            idempotencyKey: `task_due:${task.id}:${task.due_date}_${task.due_time}_30m`,
            type: 'task',
            title: task.title,
            body: `Due in ${reminderLeadMins} minutes.`,
            url: `/tasks?task=${task.id}`,
            priority: 'high',
            scheduledFor: now,
            metadata: { taskId: task.id, due_date: task.due_date, due_time: task.due_time },
          });
        }
      } catch (err) {
        // Skip invalid task dates
      }
    });
  }

  // 3. Habit Reminders
  if (preferences.habit_reminders) {
    habits.forEach((habit) => {
      if (!habit.is_active || !habit.reminder_time) return;

      // Check if habit is already completed today
      const alreadyDone = habitLogs.some(
        (log) => log.habit_id === habit.id && log.date === todayStr && log.completed
      );
      if (alreadyDone) return;

      // Check time matching
      const [hH, mM] = habit.reminder_time.split(':').map(Number);
      const [curH, curM] = currentTimeStr.split(':').map(Number);
      const habitMins = hH * 60 + mM;
      const curMins = curH * 60 + curM;

      if (Math.abs(habitMins - curMins) <= evaluationWindowMinutes) {
        items.push({
          idempotencyKey: `habit:${habit.id}:${todayStr}:${habit.reminder_time}`,
          type: 'habit',
          title: habit.name,
          body: habit.description || 'Time to complete your habit!',
          url: `/habits`,
          priority: 'low',
          scheduledFor: now,
          metadata: { habitId: habit.id, date: todayStr },
        });
      }
    });
  }

  // 4. Daily Planning Reminder
  if (preferences.daily_planning && preferences.daily_planning_time) {
    const [planH, planM] = preferences.daily_planning_time.split(':').map(Number);
    const [curH, curM] = currentTimeStr.split(':').map(Number);
    const planMins = planH * 60 + planM;
    const curMins = curH * 60 + curM;

    if (Math.abs(planMins - curMins) <= evaluationWindowMinutes) {
      items.push({
        idempotencyKey: `daily_plan:${userId}:${todayStr}`,
        type: 'daily_plan',
        title: 'Plan your day',
        body: 'Take 3 minutes to review your priorities and schedule.',
        url: `/?plan=true`,
        priority: 'normal',
        scheduledFor: now,
        metadata: { date: todayStr },
      });
    }
  }

  return items;
}

/**
 * Server-side evaluation & batch delivery for a given user
 */
export async function evaluateAndDispatchForUser(
  supabase: SupabaseClient,
  userId: string,
  now = new Date()
): Promise<{ dispatched: number; skippedQuietHours: number; results: PushDeliveryResult[] }> {
  const summary = { dispatched: 0, skippedQuietHours: 0, results: [] as PushDeliveryResult[] };

  // Fetch user profile and notification preferences
  const [{ data: profile }, { data: prefData }] = await Promise.all([
    supabase.from('profiles').select('timezone').eq('id', userId).maybeSingle(),
    supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const preferences: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(prefData || {}),
    user_id: userId,
  };

  if (!preferences.notifications_enabled) {
    return summary;
  }

  const timezone = profile?.timezone || 'UTC';
  const isQuietHours = preferences.quiet_hours_enabled && isQuietHoursActive(
    now,
    preferences.quiet_hours_start,
    preferences.quiet_hours_end,
    timezone
  );

  // Fetch active events, tasks, habits, and logs
  const todayStr = getCurrentDateInTimezone(now, timezone);
  const [{ data: events }, { data: tasks }, { data: habits }, { data: habitLogs }] = await Promise.all([
    supabase.from('events').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*').eq('user_id', userId).in('status', ['inbox', 'todo', 'scheduled', 'in_progress']),
    supabase.from('habits').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('habit_logs').select('*').eq('user_id', userId).eq('date', todayStr),
  ]);

  const pendingItems = resolvePendingNotifications({
    userId,
    preferences,
    events: (events as any) || [],
    tasks: (tasks as any) || [],
    habits: (habits as any) || [],
    habitLogs: (habitLogs as any) || [],
    timezone,
    now,
  });

  for (const item of pendingItems) {
    // If quiet hours is active and priority is not 'high', log skipped delivery
    if (isQuietHours && item.priority !== 'high') {
      summary.skippedQuietHours++;
      await supabase.from('notification_deliveries').upsert(
        {
          user_id: userId,
          idempotency_key: item.idempotencyKey,
          notification_type: item.type,
          scheduled_for: item.scheduledFor.toISOString(),
          sent_at: new Date().toISOString(),
          status: 'skipped_quiet_hours',
          failure_reason: `Suppressed by Quiet Hours (${preferences.quiet_hours_start} - ${preferences.quiet_hours_end})`,
        },
        { onConflict: 'user_id, idempotency_key' }
      );
      continue;
    }

    // Send push
    const deliveryResult = await sendPushToUser(
      supabase,
      userId,
      {
        title: item.title,
        body: item.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: item.idempotencyKey,
        data: {
          url: item.url,
          type: item.type,
          priority: item.priority,
          ...item.metadata,
        },
      },
      {
        idempotencyKey: item.idempotencyKey,
        createInAppRecord: true,
        priority: item.priority,
        scheduledFor: item.scheduledFor,
        metadata: item.metadata,
      }
    );

    summary.dispatched++;
    summary.results.push(deliveryResult);
  }

  return summary;
}
