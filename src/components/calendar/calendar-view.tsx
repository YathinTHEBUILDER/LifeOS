'use client';

import React, { useState } from 'react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  isToday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { CalendarEvent } from '@/types';
import { formatEventTime } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'day' | 'week' | 'month' | 'agenda';

export function CalendarView() {
  const {
    events,
    updateEvent,
    deleteEvent,
    toggleEventCompletion,
    openQuickAdd,
    getExpandedEventsForRange,
  } = usePlanner();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
    else if (viewMode === 'month') setCurrentDate(subDays(currentDate, 30));
    else setCurrentDate(subDays(currentDate, 7));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else if (viewMode === 'month') setCurrentDate(addDays(currentDate, 30));
    else setCurrentDate(addDays(currentDate, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Determine days to display based on view mode
  const getDaysToRender = () => {
    if (viewMode === 'day') {
      return [currentDate];
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    return [currentDate];
  };

  const days = getDaysToRender();
  const startRange = days[0] || currentDate;
  const endRange = days[days.length - 1] || currentDate;

  const visibleEvents = React.useMemo(() => {
    return getExpandedEventsForRange(startRange, endRange);
  }, [getExpandedEventsForRange, startRange, endRange, events]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return visibleEvents.filter((e) => {
      try {
        return isSameDay(parseISO(e.start_time), day);
      } catch {
        return false;
      }
    });
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    setSelectedEvent(null);
    toast.success('Event deleted');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Calendar Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Navigation & Current Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-secondary/80 p-0.5 rounded-lg">
            <button
              onClick={handlePrev}
              aria-label="Previous"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-foreground hover:bg-card transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              aria-label="Next"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View Mode Selector & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-secondary/80 p-0.5 rounded-lg flex-1 sm:flex-initial justify-between">
            {(['day', 'week', 'month', 'agenda'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => openQuickAdd('event')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </div>

      {/* VIEW: WEEK / DAY GRID */}
      {viewMode !== 'month' && viewMode !== 'agenda' && (
        <div className="rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-1 sm:grid-cols-7 border-b border-border/70 bg-secondary/20 divide-x divide-border/50">
            {days.map((day, index) => {
              const dayIsToday = isToday(day);
              return (
                <div
                  key={index}
                  className={`p-2.5 text-center transition-colors ${dayIsToday ? 'bg-primary/5' : ''}`}
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full text-xs font-semibold ${
                      dayIsToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Day Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-border/60 min-h-[500px] p-2 gap-2 bg-secondary/5">
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div key={index} className="space-y-1.5 min-h-[100px] sm:min-h-full">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:bg-secondary/40 ${
                        event.is_completed
                          ? 'bg-secondary/30 border-border opacity-60 line-through'
                          : 'bg-card border-border/80'
                      }`}
                      style={{ borderLeftColor: event.color || '#0071e3', borderLeftWidth: '3px' }}
                    >
                      <span className="font-medium text-foreground truncate block">{event.title}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {formatEventTime(event.start_time)}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="hidden sm:block text-center py-8 text-[11px] text-muted-foreground/40 font-normal">
                      ·
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: MONTH GRID */}
      {viewMode === 'month' && (
        <div className="rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border/70 bg-secondary/20 text-center py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-border/60 min-h-[480px]">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const dayIsToday = isToday(day);
              return (
                <div
                  key={idx}
                  className={`p-1.5 min-h-[85px] flex flex-col justify-between ${
                    dayIsToday ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium self-end w-5 h-5 rounded-full flex items-center justify-center ${
                      dayIsToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className="text-[10px] font-normal px-1.5 py-0.5 rounded truncate cursor-pointer bg-secondary/70 text-foreground hover:bg-secondary"
                        style={{ borderLeft: `2px solid ${e.color || '#0071e3'}` }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-muted-foreground font-medium block pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: AGENDA (Clean List) */}
      {viewMode === 'agenda' && (
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-2xl border border-border text-xs text-muted-foreground">
              No calendar events found.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: event.color || '#0071e3' }} />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{format(parseISO(event.start_time), 'EEE, MMM d')}</span>
                      <span>·</span>
                      <span>{formatEventTime(event.start_time)} — {formatEventTime(event.end_time)}</span>
                    </p>
                  </div>
                </div>
                {event.project && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {event.project.name}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Details Dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">
                  {selectedEvent.category.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-foreground mt-1">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>
                  {format(parseISO(selectedEvent.start_time), 'EEEE, MMMM d')} · {formatEventTime(selectedEvent.start_time)} — {formatEventTime(selectedEvent.end_time)}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <p className="text-xs text-foreground/90 bg-secondary/40 p-2.5 rounded-xl border border-border/60">
                {selectedEvent.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/80">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              <button
                onClick={() => {
                  toggleEventCompletion(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                {selectedEvent.is_completed ? 'Mark Incomplete' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
