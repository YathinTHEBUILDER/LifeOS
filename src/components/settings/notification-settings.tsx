'use client';

import React from 'react';
import {
  Bell,
  BellOff,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  CheckSquare,
  Flame,
  Zap,
  Moon,
  Trash2,
  Send,
  HelpCircle,
  Share,
  PlusSquare,
  Loader2,
} from 'lucide-react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { format, parseISO } from 'date-fns';

export function NotificationSettings() {
  const {
    supported,
    iosDevice,
    standaloneMode,
    permission,
    isSubscribed,
    preferences,
    devices,
    isLoading,
    isActionLoading,
    enablePushNotifications,
    disablePushNotifications,
    updateNotificationPreferences,
    sendTestNotification,
    toggleDevice,
    removeDevice,
  } = useNotifications();

  // Permission & Device Status Logic
  const getStatusBadge = () => {
    if (!supported) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Not Supported
        </span>
      );
    }
    if (permission === 'denied') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Blocked in Browser
        </span>
      );
    }
    if (isSubscribed && preferences.notifications_enabled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Active & Subscribed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">
        <BellOff className="w-3.5 h-3.5" />
        Not Yet Enabled
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Status & Diagnostics Card */}
      <div className="rounded-2xl bg-card border border-border/80 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Device Notification Status
              </span>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Get quiet, time-sensitive reminders for your calendar events, next activity blocks,
              and due tasks across your laptops and phones.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSubscribed ? (
              <>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => sendTestNotification()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary text-xs font-medium transition-colors tactile-btn"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>Send Test</span>
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => disablePushNotifications()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/30 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors tactile-btn"
                >
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Disable</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isActionLoading || permission === 'denied' || !supported}
                onClick={() => enablePushNotifications()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors tactile-btn shadow-xs disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
                <span>Enable Notifications</span>
              </button>
            )}
          </div>
        </div>

        {/* Browser Permission Blocked Alert */}
        {permission === 'denied' && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-foreground flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-destructive">Notifications are blocked</span>
              <span className="text-muted-foreground text-[11px]">
                Your browser or operating system settings are blocking notifications for LifeOS.
                Please click the lock/settings icon next to the URL address bar and change Notifications to &quot;Allow&quot;.
              </span>
            </div>
          </div>
        )}

        {/* iPhone PWA Guide Banner */}
        {iosDevice && !standaloneMode && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-indigo-400">
              <Smartphone className="w-4 h-4" />
              <span>iPhone Web Push Setup</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Apple requires web apps to be installed to the Home Screen to deliver background push notifications.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-foreground font-medium pt-1">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/60">
                <Share className="w-3.5 h-3.5 text-primary" />
                <span>1. Tap Share (⎋) in Safari toolbar</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/60">
                <PlusSquare className="w-3.5 h-3.5 text-primary" />
                <span>2. Tap &quot;Add to Home Screen&quot;</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Grouped Notification Preferences */}
      <div className="space-y-4">
        {/* Section: General */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            General
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-xs">
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Master Notifications</span>
                <span className="text-[11px] text-muted-foreground">
                  Master switch to allow LifeOS to evaluate and send alerts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.notifications_enabled}
                onChange={(e) => updateNotificationPreferences({ notifications_enabled: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section: Schedule & Next Activity */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Schedule & Next Activity
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Upcoming Events */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Upcoming Events</span>
                <span className="text-[11px] text-muted-foreground">
                  Remind you when a scheduled calendar event or routine is approaching.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.upcoming_events}
                onChange={(e) => updateNotificationPreferences({ upcoming_events: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>

            {/* Event Timing */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Event Reminder Timing</span>
                <span className="text-[11px] text-muted-foreground">
                  How early to alert you before an event begins.
                </span>
              </div>
              <select
                value={preferences.event_reminder_timing}
                onChange={(e) => updateNotificationPreferences({ event_reminder_timing: Number(e.target.value) })}
                className="text-xs rounded-lg bg-secondary border border-border px-2.5 py-1 text-foreground font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>

            {/* Next Activity */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-medium text-foreground block">Next Activity Prompt</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Signature LifeOS prompt: &quot;NEXT — Python Assignment starts in 15 minutes.&quot;
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.next_activity}
                onChange={(e) => updateNotificationPreferences({ next_activity: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>

            {/* Next Activity Timing */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-foreground block">Next Activity Timing</span>
              <select
                value={preferences.next_activity_timing}
                onChange={(e) => updateNotificationPreferences({ next_activity_timing: Number(e.target.value) })}
                className="text-xs rounded-lg bg-secondary border border-border px-2.5 py-1 text-foreground font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>

            {/* Smart Free Time */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Free Time Gap Notification</span>
                <span className="text-[11px] text-muted-foreground">
                  Quietly let you know when you have a 2+ hour break between tasks (&quot;You have 2 hours free&quot;).
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.smart_free_time}
                onChange={(e) => updateNotificationPreferences({ smart_free_time: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section: Tasks */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Tasks & Deadlines
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Task Reminders */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Task Reminders</span>
                <span className="text-[11px] text-muted-foreground">
                  Alert on tasks with configured due times.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.task_reminders}
                onChange={(e) => updateNotificationPreferences({ task_reminders: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>

            {/* Due Soon */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Due Soon Reminders</span>
                <span className="text-[11px] text-muted-foreground">
                  Send reminder 30 minutes before task due time (&quot;DB assignment is due in 30 minutes&quot;).
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.task_due_soon}
                onChange={(e) => updateNotificationPreferences({ task_due_soon: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>

            {/* Missed Tasks */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Uncompleted Task Review</span>
                <span className="text-[11px] text-muted-foreground">
                  Gentle evening reminder to reschedule uncompleted tasks.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.missed_tasks}
                onChange={(e) => updateNotificationPreferences({ missed_tasks: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section: Daily Planning, Focus & Habits */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Planning, Focus & Habits
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Daily Planning */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Daily Planning Prompt</span>
                <span className="text-[11px] text-muted-foreground">
                  Morning notification to open Today view and organize priorities.
                </span>
              </div>
              <div className="flex items-center gap-3">
                {preferences.daily_planning && (
                  <input
                    type="time"
                    value={preferences.daily_planning_time}
                    onChange={(e) => updateNotificationPreferences({ daily_planning_time: e.target.value })}
                    className="text-xs rounded-lg bg-secondary border border-border px-2 py-1 text-foreground font-medium"
                  />
                )}
                <input
                  type="checkbox"
                  checked={preferences.daily_planning}
                  onChange={(e) => updateNotificationPreferences({ daily_planning: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Focus Session Reminders */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Focus Session Alerts</span>
                <span className="text-[11px] text-muted-foreground">
                  Reminders when scheduled focus blocks start and complete.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.focus_reminders}
                onChange={(e) => updateNotificationPreferences({ focus_reminders: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>

            {/* Habit Reminders */}
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-foreground block">Habit Reminders</span>
                <span className="text-[11px] text-muted-foreground">
                  Understated reminders for active habits at their designated times.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.habit_reminders}
                onChange={(e) => updateNotificationPreferences({ habit_reminders: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section: Quiet Hours */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Quiet Hours
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-xs">
            <div className="p-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-medium text-foreground block">Enable Quiet Hours</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Mutes all non-urgent LifeOS notifications during your rest window.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.quiet_hours_enabled}
                onChange={(e) => updateNotificationPreferences({ quiet_hours_enabled: e.target.checked })}
                className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/10">
                <span className="text-xs text-muted-foreground">Quiet window</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">From</span>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => updateNotificationPreferences({ quiet_hours_start: e.target.value })}
                    className="text-xs rounded-lg bg-secondary border border-border px-2 py-1 text-foreground font-medium"
                  />
                  <span className="text-xs font-mono text-muted-foreground">To</span>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => updateNotificationPreferences({ quiet_hours_end: e.target.value })}
                    className="text-xs rounded-lg bg-secondary border border-border px-2 py-1 text-foreground font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section: Connected Devices */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Registered Push Devices ({devices.length})
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-xs">
            {devices.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Smartphone className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs font-medium">No registered devices</p>
                <p className="text-[11px] mt-0.5">Click &quot;Enable Notifications&quot; above to link this device.</p>
              </div>
            ) : (
              devices.map((device) => {
                let lastSeenStr = 'Recently';
                try {
                  lastSeenStr = format(parseISO(device.last_seen_at), 'MMM d, h:mm a');
                } catch {
                  lastSeenStr = 'Recently';
                }

                return (
                  <div key={device.id} className="p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/50">
                        {device.device_type === 'mobile' ? (
                          <Smartphone className="w-4 h-4 text-primary" />
                        ) : (
                          <Laptop className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-foreground block truncate">
                          {device.device_label || `${device.browser} on ${device.device_type}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          Last active: {lastSeenStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleDevice(device.id, !device.enabled)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          device.enabled
                            ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {device.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeDevice(device.id)}
                        title="Remove device"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
