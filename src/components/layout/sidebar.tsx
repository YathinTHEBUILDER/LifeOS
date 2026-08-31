'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Calendar,
  CheckSquare,
  FolderKanban,
  Flame,
  FileText,
  Timer,
  BarChart3,
  Settings,
  Plus,
  Compass,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/store/planner-context';

const navItems = [
  { href: '/', label: 'Today', icon: Sun, shortcut: 'T' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, shortcut: 'C' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, shortcut: 'N' },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/habits', label: 'Habits', icon: Flame },
  { href: '/focus', label: 'Focus', icon: Timer, shortcut: 'F' },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/review', label: 'Review', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tasks, openQuickAdd } = usePlanner();

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-md h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border/70">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-base tracking-tight text-foreground group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight">LifeOS</span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            PRO
          </span>
        </Link>
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <button
          onClick={() => openQuickAdd('task')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Capture</span>
          <kbd className="ml-auto text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded font-mono">Q</kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span>{item.label}</span>

              {item.label === 'Tasks' && pendingTasksCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground font-semibold">
                  {pendingTasksCount}
                </span>
              )}

              {item.shortcut && item.label !== 'Tasks' && (
                <kbd className="ml-auto text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground font-mono">
                  {item.shortcut}
                </kbd>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Live Clock Widget */}
      <div className="p-4 border-t border-border/70 mt-auto">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">Time Blocking Active</span>
            <span className="text-[11px] text-muted-foreground">Focus & Schedule sync</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
