'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Download, Upload, LogOut, LogIn, User, Clock, ShieldCheck, Database } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { NotificationSettings } from './notification-settings';
import { toast } from 'sonner';

export function SettingsView() {
  const {
    profile,
    updateProfile,
    isSupabaseConnected,
    isAuthenticated,
    realtimeStatus,
    signOut,
    tasks,
    events,
    projects,
    habits,
    notes,
    focusSessions,
    dailyReviews,
    importData,
  } = usePlanner();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(profile.full_name || 'Owner');
  const [workStart, setWorkStart] = useState(profile.work_start_time || '09:00');
  const [workEnd, setWorkEnd] = useState(profile.work_end_time || '18:00');
  const [timezone, setTimezone] = useState(
    profile.timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC')
  );

  const handleExportData = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      owner: {
        name,
        email: profile.email,
        timezone,
      },
      profile,
      tasks,
      events,
      projects,
      habits,
      notes,
      focusSessions,
      dailyReviews,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Personal data backup exported');
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
          toast.success('Backup successfully restored');
        } else {
          toast.error('Failed to import backup file.');
        }
      } catch (err) {
        console.error('Failed to parse backup JSON:', err);
        toast.error('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: name,
      timezone,
      work_start_time: workStart,
      work_end_time: workEnd,
    });
    toast.success('Personal preferences saved');
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
        <p className="text-sm text-muted-foreground mt-0.5">Personal preferences, schedule, and device notifications</p>
      </div>

      {/* Profile & Schedule Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Personal Profile */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Personal Profile
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-foreground">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Owner"
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

        {/* Working Hours */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
            Working Schedule
          </span>
          <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-foreground">Day Starts</span>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-hidden text-foreground font-medium"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-foreground">Day Ends</span>
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
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Notifications Section */}
      <NotificationSettings />

      {/* Storage, Sync & Backup */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
          Data & Account
        </span>
        <div className="rounded-xl bg-card border border-border/80 divide-y divide-border/60 overflow-hidden shadow-xs">
          {/* Account Row */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-foreground block">Account & Sync</span>
              <span className="text-[11px] text-muted-foreground">
                {isAuthenticated
                  ? `Signed in as ${profile.email || name}`
                  : isSupabaseConnected
                  ? 'Cloud connected · Sign in to sync across devices'
                  : 'Running locally'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                  isAuthenticated
                    ? realtimeStatus === 'CONNECTED'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : realtimeStatus === 'CONNECTING'
                      ? 'bg-amber-500/10 text-amber-500'
                      : realtimeStatus === 'ERROR'
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-amber-500/10 text-amber-500'
                    : isSupabaseConnected
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isAuthenticated
                  ? realtimeStatus === 'CONNECTED'
                    ? '● Live Sync'
                    : realtimeStatus === 'CONNECTING'
                    ? 'Connecting...'
                    : realtimeStatus === 'ERROR'
                    ? 'Sync Error'
                    : 'Reconnecting...'
                  : isSupabaseConnected
                  ? 'Signed Out'
                  : 'Offline'}
              </span>

              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-secondary transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : isSupabaseConnected ? (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline px-2 py-1 rounded-md bg-primary/10"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              ) : null}
            </div>
          </div>

          {/* Backup & Export Row */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-foreground block">Personal Data Backup</span>
              <span className="text-[11px] text-muted-foreground">
                Export or restore a complete snapshot of your schedule, tasks, habits, and notes.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleImportClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 tactile-btn cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>

              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 tactile-btn cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
