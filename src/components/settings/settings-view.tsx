'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Download, Upload, LogOut, LogIn, Bell, BellOff } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';
import { toast } from 'sonner';

export function SettingsView() {
  const {
    profile,
    updateProfile,
    isSupabaseConnected,
    isAuthenticated,
    signOut,
    tasks,
    events,
    projects,
    habits,
    notes,
    importData,
  } = usePlanner();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(profile.full_name);
  const [workStart, setWorkStart] = useState(profile.work_start_time || '09:00');
  const [workEnd, setWorkEnd] = useState(profile.work_end_time || '18:00');
  const [timezone, setTimezone] = useState(profile.timezone || 'UTC');
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());

  const handleExportData = () => {
    const data = {
      profile,
      tasks,
      events,
      projects,
      habits,
      notes,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exported');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importData(json);
        if (success) {
          toast.success('Backup successfully restored!');
        }
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        toast.error('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleToggleNotifications = async () => {
    if (notifPermission === 'granted') {
      updateProfile({ notifications_enabled: !profile.notifications_enabled });
      toast.success(profile.notifications_enabled ? 'Notifications disabled' : 'Notifications enabled');
    } else {
      const granted = await requestNotificationPermission();
      setNotifPermission(getNotificationPermission());
      if (granted) {
        updateProfile({ notifications_enabled: true });
        toast.success('Notification permission granted!');
      } else {
        toast.error('Notification permission denied or blocked by browser.');
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: name,
      timezone,
      work_start_time: workStart,
      work_end_time: workEnd,
    });
    toast.success('Preferences updated');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Preferences and data storage</p>
      </div>

      {/* Account & Schedule (iOS Grouped Style) */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            General
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-foreground">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs text-right bg-transparent border-0 focus:outline-hidden text-foreground placeholder:text-muted-foreground font-medium"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-foreground">Timezone</span>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="text-xs text-right bg-transparent border-0 focus:outline-hidden text-foreground placeholder:text-muted-foreground font-medium"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Working Hours
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-foreground">Start Time</span>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-hidden text-foreground font-medium"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-foreground">End Time</span>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-hidden text-foreground font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Notifications Section */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
          Notifications & Alerts
        </span>
        <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden">
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-foreground block">Event & Habit Reminders</span>
              <span className="text-[11px] text-muted-foreground">
                Receive browser alerts 5 minutes before scheduled time blocks and habit reminders.
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tactile-btn transition-colors shrink-0 ${
                profile.notifications_enabled && notifPermission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
              }`}
            >
              {profile.notifications_enabled && notifPermission === 'granted' ? (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>{notifPermission === 'denied' ? 'Blocked' : 'Enable'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sync & Backup Status */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
          Storage & Sync
        </span>
        <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden">
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-foreground block">Account & Sync</span>
              <span className="text-[11px] text-muted-foreground">
                {isAuthenticated
                  ? `Signed in as ${profile.email || profile.full_name}`
                  : isSupabaseConnected
                  ? 'Cloud connected · Sign in to synchronize'
                  : 'Running offline with local storage'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                  isAuthenticated
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : isSupabaseConnected
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isAuthenticated ? 'Synced' : isSupabaseConnected ? 'Signed Out' : 'Offline'}
              </span>

              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : isSupabaseConnected ? (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-foreground block">Data Backup</span>
              <span className="text-[11px] text-muted-foreground">
                Export or import a JSON snapshot of your planner.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleImportClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 tactile-btn"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>

              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 tactile-btn"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
