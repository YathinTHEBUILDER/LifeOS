'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Calendar,
  CheckSquare,
  Timer,
  Menu,
  FolderKanban,
  Flame,
  FileText,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryMobileTabs = [
    { href: '/', label: 'Today', icon: Sun },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/focus', label: 'Focus', icon: Timer },
  ];

  const moreItems = [
    { href: '/projects', label: 'Projects', icon: FolderKanban, color: 'text-indigo-500 bg-indigo-500/10' },
    { href: '/habits', label: 'Habits', icon: Flame, color: 'text-emerald-500 bg-emerald-500/10' },
    { href: '/notes', label: 'Notes', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
    { href: '/review', label: 'Review', icon: BarChart3, color: 'text-purple-500 bg-purple-500/10' },
    { href: '/settings', label: 'Settings', icon: Settings, color: 'text-slate-500 bg-slate-500/10' },
  ];

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Bottom Sheet Menu for "More" */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 apple-sheet-backdrop flex items-end justify-center p-0">
          <div className="absolute inset-0" onClick={() => setIsMoreOpen(false)} />

          <div className="relative w-full bg-card rounded-t-3xl border-t border-border shadow-2xl p-5 pb-safe space-y-4 animate-in slide-in-from-bottom-8 duration-200">
            {/* Sheet Handle */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                More Views
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isSelected = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-2 group tactile-btn',
                      isSelected
                        ? 'bg-secondary border-primary/40 text-foreground font-semibold shadow-xs'
                        : 'bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 apple-blur border-t border-border/80 pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          {primaryMobileTabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[56px] py-1 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 mb-0.5 transition-transform active:scale-90',
                    isActive && 'stroke-[2.2px]'
                  )}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          {/* More Tab Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center min-w-[56px] py-1 text-[10px] font-medium transition-colors cursor-pointer',
              isMoreActive || isMoreOpen ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Menu
              className={cn(
                'w-5 h-5 mb-0.5 transition-transform active:scale-90',
                (isMoreActive || isMoreOpen) && 'stroke-[2.2px]'
              )}
            />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
