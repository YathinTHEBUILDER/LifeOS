'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Header } from './header';
import { QuickAddModal } from '../tasks/quick-add-modal';
import { CommandPalette } from '../command/command-palette';
import { PlanDayModal } from '../today/plan-day-modal';
import { Toaster } from 'sonner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPlanDayOpen, setIsPlanDayOpen] = useState(false);

  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header onOpenPlanMyDay={() => setIsPlanDayOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals */}
      <QuickAddModal />
      <CommandPalette />
      <PlanDayModal isOpen={isPlanDayOpen} onClose={() => setIsPlanDayOpen(false)} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
