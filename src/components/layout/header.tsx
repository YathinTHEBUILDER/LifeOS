'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Moon, Sun, ShieldCheck } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format } from 'date-fns';
import { getGreeting } from '@/lib/utils';

interface HeaderProps {
  onOpenPlanMyDay?: () => void;
}

export function Header({ onOpenPlanMyDay }: HeaderProps) {
  const { profile, setIsCommandPaletteOpen, isSupabaseConnected } = usePlanner();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(format(now, 'h:mm a'));
      setDateStr(format(now, 'EEEE, MMMM d'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check initial theme class
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="h-16 px-4 md:px-8 border-b border-border/70 bg-card/40 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
      {/* Date & Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {getGreeting()}, {profile.full_name.split(' ')[0]}
            </span>
            {isSupabaseConnected && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.2 rounded font-medium">
                <ShieldCheck className="w-3 h-3" /> Supabase
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">
            {dateStr || 'Today'} <span className="text-muted-foreground font-normal">· {timeStr}</span>
          </span>
        </div>
      </div>

      {/* Action Buttons & Search */}
      <div className="flex items-center gap-2.5">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-secondary/50 text-muted-foreground hover:text-foreground text-xs font-medium shadow-2xs hover:bg-secondary transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search or commands</span>
          <kbd className="text-[10px] bg-card px-1.5 py-0.5 rounded border border-border font-mono font-semibold">
            ⌘K
          </kbd>
        </button>

        {/* Plan Day Trigger */}
        {onOpenPlanMyDay && (
          <button
            onClick={onOpenPlanMyDay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Plan Day</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="w-8 h-8 rounded-xl border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs">
          {profile.full_name.charAt(0)}
        </div>
      </div>
    </header>
  );
}
