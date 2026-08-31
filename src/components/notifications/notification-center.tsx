'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  CheckSquare,
  Sparkles,
  Flame,
  Zap,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import { InAppNotification } from '@/types/notifications';
import { usePlanner } from '@/lib/store/planner-context';
import { format, isToday, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

export function NotificationCenter() {
  const { isAuthenticated } = usePlanner();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications/history?limit=30');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notification history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 45 seconds for new notification indicators
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await fetch('/api/notifications/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleItemClick = async (notif: InAppNotification) => {
    // Mark as read
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      fetch('/api/notifications/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      }).catch(console.error);
    }

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleClearAll = async () => {
    try {
      setNotifications([]);
      await fetch('/api/notifications/history', { method: 'DELETE' });
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Group notifications into Today vs Earlier
  const todayItems: InAppNotification[] = [];
  const earlierItems: InAppNotification[] = [];

  notifications.forEach((item) => {
    try {
      const d = parseISO(item.created_at);
      if (isToday(d)) {
        todayItems.push(item);
      } else {
        earlierItems.push(item);
      }
    } catch {
      earlierItems.push(item);
    }
  });

  const getTypeIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
      case 'task':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'next_activity':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
      case 'habit':
        return <Flame className="w-3.5 h-3.5 text-amber-500" />;
      case 'focus':
        return <Zap className="w-3.5 h-3.5 text-purple-500" />;
      case 'daily_plan':
        return <Clock className="w-3.5 h-3.5 text-cyan-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors tactile-btn"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-background animate-in zoom-in duration-150">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl shadow-black/20 z-50 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear all"
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 divide-dashed">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-secondary/60 text-muted-foreground flex items-center justify-center mx-auto mb-2.5">
                  <Bell className="w-4 h-4 opacity-60" />
                </div>
                <p className="text-xs font-medium text-foreground">All caught up</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Upcoming events and task reminders will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Today Section */}
                {todayItems.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/20">
                      Today
                    </div>
                    {todayItems.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        getTypeIcon={getTypeIcon}
                        onClick={() => handleItemClick(item)}
                      />
                    ))}
                  </div>
                )}

                {/* Earlier Section */}
                {earlierItems.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/20">
                      Earlier
                    </div>
                    {earlierItems.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        getTypeIcon={getTypeIcon}
                        onClick={() => handleItemClick(item)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  getTypeIcon,
  onClick,
}: {
  item: InAppNotification;
  getTypeIcon: (type: InAppNotification['type']) => React.ReactNode;
  onClick: () => void;
}) {
  let timeStr = '';
  try {
    const d = parseISO(item.created_at);
    timeStr = format(d, 'h:mm a');
  } catch {
    timeStr = '';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 flex items-start gap-3 hover:bg-secondary/40 transition-colors group ${
        !item.is_read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 mt-0.5 border border-border/40">
        {getTypeIcon(item.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`text-xs tracking-tight truncate ${
              !item.is_read ? 'font-semibold text-foreground' : 'font-normal text-foreground/90'
            }`}
          >
            {item.title}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
            {timeStr}
          </span>
        </div>

        {item.message && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {item.message}
          </p>
        )}
      </div>

      {!item.is_read ? (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 self-center ring-2 ring-background" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1 self-center" />
      )}
    </button>
  );
}
