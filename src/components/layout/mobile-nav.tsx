'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Calendar, CheckSquare, Timer, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const primaryMobileTabs = [
    { href: '/', label: 'Today', icon: Sun },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/focus', label: 'Focus', icon: Timer },
    { href: '/settings', label: 'More', icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 apple-blur border-t border-border/80 pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {primaryMobileTabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && tab.href !== '/settings' && pathname.startsWith(tab.href));
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
              <Icon className={cn('w-5 h-5 mb-0.5 transition-transform active:scale-90', isActive && 'stroke-[2.2px]')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
