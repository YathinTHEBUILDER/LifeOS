'use client';

import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Sparkles, Cloud } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format } from 'date-fns';
import { NotificationCenter } from '@/components/notifications/notification-center';

interface HeaderProps {
  onOpenPlanMyDay?: () => void;
}

export function Header({ onOpenPlanMyDay }: HeaderProps) {
  const { profile, setIsCommandPaletteOpen, isAuthenticated } = usePlanner();
  const [timeStr, setTimeStr] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(format(now, 'h:mm a'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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
    <header className="h-14 px-4 md:px-8 border-b border-border/80 apple-blur sticky top-0 z-20 flex items-center justify-between gap-4 transition-colors">
      {/* Date & Time */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground tracking-tight flex items-center gap-2">
          {format(new Date(), 'EEEE, MMMM d')}
          <span className="text-muted-foreground font-normal">{timeStr}</span>
          {isAuthenticated && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10">
              <Cloud className="w-2.5 h-2.5" /> Synced
            </span>
          )}
        </span>
      </div>

      {/* Action Buttons & Search */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground text-xs font-normal hover:bg-secondary transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="text-[10px] text-muted-foreground/70 font-mono">⌘K</kbd>
        </button>

        {/* Plan Day Trigger */}
        {onOpenPlanMyDay && (
          <button
            onClick={onOpenPlanMyDay}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Plan Day</span>
          </button>
        )}

        {/* Notification Center */}
        {isAuthenticated && <NotificationCenter />}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* User Initials Avatar */}
        <div className="w-7 h-7 rounded-full bg-secondary text-foreground font-semibold text-xs flex items-center justify-center border border-border">
          {(profile.full_name || 'Owner').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

