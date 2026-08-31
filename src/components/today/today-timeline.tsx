'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Plus,
  ArrowRight,
  Flame,
  Layers,
  MapPin,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { formatEventTime, getDurationFormatted } from '@/lib/utils';
import { CalendarEvent, Task } from '@/types';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export function TodayTimeline() {
  const {
    events,
    tasks,
    habits,
    habitLogs,
    toggleHabitForDate,
    toggleEventCompletion,
    toggleTaskCompletion,
    scheduleTaskAsEvent,
    openQuickAdd,
    profile,
    updateDailyIntention,
  } = usePlanner();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [intentionInput, setIntentionInput] = useState(profile.daily_intention || '');
  const [isEditingIntention, setIsEditingIntention] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIntentionInput(profile.daily_intention || '');
  }, [profile.daily_intention]);

  const todayStr = format(currentTime, 'yyyy-MM-dd');

  // Filter today's events
  const todayEvents = events
    .filter((e) => {
      try {
        return isSameDay(parseISO(e.start_time), currentTime);
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Filter today's tasks
  const todayTasks = tasks.filter((t) => t.due_date === todayStr || t.status === 'scheduled');
  const pendingTasks = todayTasks.filter((t) => t.status !== 'completed');
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');

  // Unscheduled Inbox tasks
  const unscheduledTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'inbox');

  // Find Happening Now and Up Next
  const happeningNowEvent = todayEvents.find((e) => {
    try {
      const start = parseISO(e.start_time);
      const end = parseISO(e.end_time);
      return isWithinInterval(currentTime, { start, end });
    } catch {
      return false;
    }
  });

  const nextUpcomingEvent = todayEvents.find((e) => {
    try {
      return parseISO(e.start_time) > currentTime;
    } catch {
      return false;
    }
  });

  const handleSaveIntention = () => {
    updateDailyIntention(intentionInput.trim());
    setIsEditingIntention(false);
  };

  const handleCompleteTask = (id: string) => {
    toggleTaskCompletion(id);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#6366F1', '#10B981', '#F59E0B'],
    });
  };

  // Calculate current scrubber line position (between 8:00 AM and 10:00 PM = 14 hours total)
  const currentHour = currentTime.getHours();
  const currentMin = currentTime.getMinutes();
  const timelineStartHour = 8;
  const timelineEndHour = 22;
  const totalHours = timelineEndHour - timelineStartHour;

  const scrubberPercentage = Math.max(
    0,
    Math.min(100, (((currentHour - timelineStartHour) * 60 + currentMin) / (totalHours * 60)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Daily Intention Banner */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {isEditingIntention ? (
            <div className="flex items-center gap-2 flex-1 w-full">
              <input
                type="text"
                value={intentionInput}
                onChange={(e) => setIntentionInput(e.target.value)}
                placeholder="What is your primary daily focus?"
                className="text-xs bg-secondary px-3 py-1.5 rounded-xl border border-border flex-1 focus:outline-hidden text-foreground"
                autoFocus
              />
              <button
                onClick={handleSaveIntention}
                className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingIntention(true)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <span className="font-semibold text-foreground mr-1.5">Daily Intention:</span>
              <span>{profile.daily_intention || 'Click to set today’s priority intention...'}</span>
            </div>
          )}
        </div>
        <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-2 self-end sm:self-center">
          <span className="text-primary font-bold">{completedTasks.length}</span> / {todayTasks.length} tasks done
        </div>
      </div>

      {/* Hero "Happening Now" & "Up Next" Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Happening Now */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Happening Now
            </div>
            {happeningNowEvent && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {formatEventTime(happeningNowEvent.start_time)} – {formatEventTime(happeningNowEvent.end_time)}
              </span>
            )}
          </div>

          {happeningNowEvent ? (
            <div className="my-2">
              <h3 className="text-base font-bold text-foreground">{happeningNowEvent.title}</h3>
              {happeningNowEvent.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{happeningNowEvent.location}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="my-2">
              <h3 className="text-sm font-semibold text-foreground">Free Focus Window</h3>
              <p className="text-xs text-muted-foreground mt-0.5">No active event right now. Great time for deep work.</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Link
              href="/focus"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Play className="w-3.5 h-3.5 fill-primary" />
              <span>Launch Focus Timer</span>
            </Link>
          </div>
        </div>

        {/* Up Next */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Up Next</span>
            {nextUpcomingEvent && (
              <span className="text-[11px] font-medium text-muted-foreground">
                Starts at {formatEventTime(nextUpcomingEvent.start_time)}
              </span>
            )}
          </div>

          {nextUpcomingEvent ? (
            <div className="my-2">
              <h3 className="text-base font-bold text-foreground">{nextUpcomingEvent.title}</h3>
              {nextUpcomingEvent.project && (
                <span
                  className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: `${nextUpcomingEvent.project.color}20`, color: nextUpcomingEvent.project.color }}
                >
                  {nextUpcomingEvent.project.name}
                </span>
              )}
            </div>
          ) : (
            <div className="my-2">
              <h3 className="text-sm font-semibold text-foreground">All Clear Ahead</h3>
              <p className="text-xs text-muted-foreground mt-0.5">No remaining events scheduled for today.</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <button
              onClick={() => openQuickAdd('event')}
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule Block
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Timeline + Right Panel (Unscheduled Tasks & Habits) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Vertical Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Today’s Schedule Timeline</h2>
            </div>
            <span className="text-xs text-muted-foreground">{todayEvents.length} scheduled blocks</span>
          </div>

          <div className="p-4 md:p-6 rounded-2xl bg-card border border-border shadow-xs relative overflow-hidden">
            {todayEvents.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No events scheduled today</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Drag tasks onto your timeline or use the "Plan My Day" button above to generate a balanced schedule.
                </p>
                <button
                  onClick={() => openQuickAdd('event')}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
                >
                  + Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {todayEvents.map((event) => {
                  const isDone = event.is_completed;
                  return (
                    <div
                      key={event.id}
                      className={`group p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 ${
                        isDone
                          ? 'bg-secondary/30 border-border opacity-70'
                          : 'bg-secondary/40 border-border/80 hover:bg-secondary/70 hover:border-primary/40'
                      }`}
                    >
                      {/* Checkbox toggle */}
                      <button
                        onClick={() => toggleEventCompletion(event.id)}
                        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {event.title}
                          </h4>
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            {formatEventTime(event.start_time)} – {formatEventTime(event.end_time)}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize"
                            style={{ backgroundColor: `${event.color}20`, color: event.color }}
                          >
                            {event.category.replace('_', ' ')}
                          </span>

                          {event.project && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                              style={{ backgroundColor: `${event.project.color}15`, color: event.project.color }}
                            >
                              {event.project.name}
                            </span>
                          )}

                          {event.location && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Tasks & Habits */}
        <div className="space-y-6">
          {/* Today Tasks Box */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Today’s Tasks
              </h3>
              <button
                onClick={() => openQuickAdd('task')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {todayTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No tasks due today. Capture one above!
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl bg-secondary/40 border border-border/70 flex items-start justify-between gap-2 group hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-medium block truncate ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{task.estimated_duration}m</span>
                          {task.priority !== 'none' && (
                            <span className="capitalize font-semibold text-primary">{task.priority}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {task.status !== 'completed' && (
                      <button
                        onClick={() => scheduleTaskAsEvent(task.id, new Date().toISOString())}
                        title="Schedule as Time Block"
                        className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all shrink-0"
                      >
                        Block
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Habits Box */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" /> Daily Habits
              </h3>
              <Link href="/habits" className="text-xs font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {habits.slice(0, 4).map((habit) => {
                const isCompleted = habitLogs.some((l) => l.habit_id === habit.id && l.date === todayStr && l.completed);
                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabitForDate(habit.id, todayStr)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-secondary/40 border-border/70 hover:bg-secondary/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? '✓' : ''}
                      </div>
                      <span className={`text-xs font-medium truncate ${isCompleted ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {habit.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {habit.frequency}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
