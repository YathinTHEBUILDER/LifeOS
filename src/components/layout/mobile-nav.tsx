'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Calendar, CheckSquare, Timer, Plus, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/store/planner-context';

export function MobileNav() {
  const pathname = usePathname();
  const { openQuickAdd } = usePlanner();

  const primaryMobileTabs = [
    { href: '/', label: 'Today', icon: Sun },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/focus', label: 'Focus', icon: Timer },
    { href: '/settings', label: 'More', icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {primaryMobileTabs.slice(0, 2).map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[11px] font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.5px]')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {/* Center Floating Quick Add Action Button */}
        <button
          onClick={() => openQuickAdd('task')}
          aria-label="Quick Add"
          className="relative -top-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {primaryMobileTabs.slice(2).map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[11px] font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.5px]')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
