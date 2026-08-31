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
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { CalendarEvent } from '@/types';
import { formatEventTime } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'day' | '3day' | 'week' | 'month' | 'agenda';

export function CalendarView() {
  const { events, updateEvent, deleteEvent, toggleEventCompletion, openQuickAdd } = usePlanner();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === '3day') setCurrentDate(subDays(currentDate, 3));
    else if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
    else if (viewMode === 'month') setCurrentDate(subDays(currentDate, 30));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === '3day') setCurrentDate(addDays(currentDate, 3));
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else if (viewMode === 'month') setCurrentDate(addDays(currentDate, 30));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Determine days to display based on view mode
  const getDaysToRender = () => {
    if (viewMode === 'day') {
      return [currentDate];
    }
    if (viewMode === '3day') {
      return [currentDate, addDays(currentDate, 1), addDays(currentDate, 2)];
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

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((e) => {
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
    <div className="space-y-6">
      {/* Calendar Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        {/* Navigation & Current Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-foreground hover:bg-card transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View Mode Selector & Add Button */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl flex-1 sm:flex-initial justify-between">
            {(['day', 'week', 'month', 'agenda'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => openQuickAdd('event')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </div>

      {/* VIEW: WEEK / DAY / 3-DAY GRID */}
      {viewMode !== 'month' && viewMode !== 'agenda' && (
        <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-1 sm:grid-cols-7 border-b border-border bg-secondary/30 divide-x divide-border">
            {days.map((day, index) => {
              const dayIsToday = isToday(day);
              return (
                <div
                  key={index}
                  className={`p-3 text-center transition-colors ${dayIsToday ? 'bg-primary/5' : ''}`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 mt-1 rounded-full text-xs font-bold ${
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
          <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-border min-h-[550px] p-2 gap-2 bg-secondary/10">
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div key={index} className="space-y-2 min-h-[120px] sm:min-h-full">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                        event.is_completed
                          ? 'bg-secondary/30 border-border opacity-70 line-through'
                          : 'bg-card border-border/80'
                      }`}
                      style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-foreground truncate">{event.title}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatEventTime(event.start_time)}</span>
                      </div>
                      {event.project && (
                        <div className="mt-1">
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: `${event.project.color}15`, color: event.project.color }}
                          >
                            {event.project.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="hidden sm:block text-center py-8 text-[11px] text-muted-foreground/50">
                      No events
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
        <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-secondary/30 text-center py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-border min-h-[500px]">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const dayIsToday = isToday(day);
              return (
                <div
                  key={idx}
                  className={`p-2 min-h-[90px] flex flex-col justify-between ${
                    dayIsToday ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className={`text-xs font-semibold self-end w-6 h-6 rounded-full flex items-center justify-center ${
                      dayIsToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer bg-secondary/70 text-foreground hover:bg-secondary"
                        style={{ borderLeft: `2px solid ${e.color}` }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-muted-foreground font-semibold block">
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

      {/* VIEW: AGENDA (Mobile Friendly List) */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-2xl border border-border text-xs text-muted-foreground">
              No calendar events found.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: event.color }} />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{format(parseISO(event.start_time), 'EEE, MMM d')}</span>
                      <span>·</span>
                      <span>{formatEventTime(event.start_time)} – {formatEventTime(event.end_time)}</span>
                    </p>
                  </div>
                </div>
                {event.project && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ backgroundColor: `${event.project.color}15`, color: event.project.color }}
                  >
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}
                >
                  {selectedEvent.category.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-foreground mt-2">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {format(parseISO(selectedEvent.start_time), 'EEEE, MMMM d, yyyy')} · {formatEventTime(selectedEvent.start_time)} – {formatEventTime(selectedEvent.end_time)}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <p className="text-xs text-foreground/80 bg-secondary/40 p-3 rounded-xl border border-border">
                {selectedEvent.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>

              <button
                onClick={() => {
                  toggleEventCompletion(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                {selectedEvent.is_completed ? 'Mark Incomplete' : 'Mark Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
