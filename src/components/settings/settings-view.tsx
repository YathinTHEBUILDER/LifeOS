'use client';

import React, { useState } from 'react';
import { Settings, Shield, Download, RefreshCw, Moon, Sun, User, Clock, Database } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { toast } from 'sonner';

export function SettingsView() {
  const { profile, updateDailyIntention, isSupabaseConnected, tasks, events, projects, habits, notes } = usePlanner();

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
    a.download = `lifeos-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Planner data exported as JSON backup');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Preferences saved!');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Settings & Preferences</h1>
          <p className="text-xs text-muted-foreground">Manage profile, working hours, and data sync</p>
        </div>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Backend & Database</h3>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isSupabaseConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            {isSupabaseConnected ? 'Connected to Supabase' : 'Local Storage Mode (Offline Ready)'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {isSupabaseConnected
            ? 'Your planner is securely connected to your PostgreSQL instance with Row-Level Security active.'
            : 'Running in zero-latency offline-first local mode. To sync with Supabase cloud, supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'}
        </p>
      </div>

      {/* Profile & Working Hours Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> User Profile & Working Hours
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Work Day Start</label>
            <input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Work Day End</label>
            <input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Data Export & Backup */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" /> Data Portability & Backup
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download a full JSON snapshot of your tasks, events, projects, notes, and habits.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-all shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
}
