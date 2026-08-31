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
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-sidebar h-screen sticky top-0 select-none z-30 transition-colors">
      {/* App Title */}
      <div className="h-14 px-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground group">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-xs">
            L
          </div>
          <span className="font-semibold text-[15px] tracking-tight">LifeOS</span>
        </Link>
        <button
          onClick={() => openQuickAdd('task')}
          aria-label="New Item"
          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors group relative',
                isActive
                  ? 'bg-secondary text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{item.label}</span>

              {item.label === 'Tasks' && pendingTasksCount > 0 && (
                <span className="ml-auto text-[11px] px-1.5 py-0.2 rounded-md bg-secondary text-muted-foreground font-medium">
                  {pendingTasksCount}
                </span>
              )}

              {item.shortcut && item.label !== 'Tasks' && (
                <kbd className="ml-auto text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/70 font-mono">
                  {item.shortcut}
                </kbd>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Quiet Status */}
      <div className="p-3 border-t border-border/60">
        <button
          onClick={() => openQuickAdd('task')}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>New Task</span>
          <kbd className="ml-auto text-[10px] text-muted-foreground/50 font-mono">Q</kbd>
        </button>
      </div>
    </aside>
  );
}
