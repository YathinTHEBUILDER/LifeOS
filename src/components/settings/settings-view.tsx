'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, LogOut, LogIn } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
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
  } = usePlanner();

  const [name, setName] = useState(profile.full_name);
  const [workStart, setWorkStart] = useState(profile.work_start_time || '09:00');
  const [workEnd, setWorkEnd] = useState(profile.work_end_time || '18:00');
  const [timezone, setTimezone] = useState(profile.timezone || 'UTC');

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

      {/* Sync Status */}
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
              <span className="text-xs font-medium text-foreground block">Export Backup</span>
              <span className="text-[11px] text-muted-foreground">
                Download a JSON backup of your planner data.
              </span>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 tactile-btn shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
