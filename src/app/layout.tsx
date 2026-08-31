import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PlannerProvider } from '@/lib/store/planner-context';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'LifeOS — Personal Planner & Time Operating System',
  description: 'A calm, fast, unified personal productivity system with tasks, time blocking, habits, calendar, and focus mode.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LifeOS',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        <PlannerProvider>
          <AppShell>{children}</AppShell>
        </PlannerProvider>
      </body>
    </html>
  );
}
