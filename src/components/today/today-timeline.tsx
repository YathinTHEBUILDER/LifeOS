'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Sparkles,
  Plus,
  Play,
  MapPin,
  Check,
  Moon,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format, parseISO, isWithinInterval, differenceInMinutes } from 'date-fns';
import { formatEventTime } from '@/lib/utils';
import Link from 'next/link';

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
    getExpandedTasksForDate,
    getExpandedEventsForRange,
  } = usePlanner();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [intentionInput, setIntentionInput] = useState(profile.daily_intention || '');
  const [isEditingIntention, setIsEditingIntention] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIntentionInput(profile.daily_intention || '');
  }, [profile.daily_intention]);

  const todayStr = format(currentTime, 'yyyy-MM-dd');

  // Filter today's events with recurring expansion
  const todayEvents = getExpandedEventsForRange(currentTime, currentTime)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Filter today's tasks with recurring expansion
  const todayTasks = getExpandedTasksForDate(todayStr);
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');

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

  // Calculate minutes until next event
  const minutesToNext = nextUpcomingEvent
    ? differenceInMinutes(parseISO(nextUpcomingEvent.start_time), currentTime)
    : null;

  const handleSaveIntention = () => {
    updateDailyIntention(intentionInput.trim());
    setIsEditingIntention(false);
  };

  const handleCompleteTask = (id: string) => {
    toggleTaskCompletion(id);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title & Date Header */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Today
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-normal">
          {format(currentTime, 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Daily Intention */}
      <div className="py-2.5 px-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
            Today I want to:
          </span>
          {isEditingIntention ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={intentionInput}
                onChange={(e) => setIntentionInput(e.target.value)}
                placeholder="What is your main priority for today?"
                className="text-xs bg-secondary/50 px-2.5 py-1 rounded-lg border border-border flex-1 focus:outline-hidden text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveIntention();
                  if (e.key === 'Escape') setIsEditingIntention(false);
                }}
              />
              <button
                type="button"
                onClick={handleSaveIntention}
                className="text-xs px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-medium cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingIntention(true)}
              className="text-xs text-foreground font-normal truncate text-left hover:text-primary transition-colors flex-1 cursor-pointer"
            >
              {profile.daily_intention || <span className="text-muted-foreground/70 italic">Add today’s priority intention...</span>}
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 font-mono">
          {completedTasks.length}/{todayTasks.length} done
        </span>
      </div>

      {/* NOW & UP NEXT Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* NOW */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col justify-between min-h-[110px] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              NOW
            </span>
            {happeningNowEvent && (
              <span className="text-xs text-muted-foreground font-mono">
                {formatEventTime(happeningNowEvent.start_time)} — {formatEventTime(happeningNowEvent.end_time)}
              </span>
            )}
          </div>

          <div className="my-1.5">
            {happeningNowEvent ? (
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  {happeningNowEvent.title}
                </h3>
                {happeningNowEvent.location && (
                  <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {happeningNowEvent.location}
                  </span>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-base font-medium text-foreground tracking-tight">You&apos;re free</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Nothing scheduled right now.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <button
              type="button"
              onClick={() => openQuickAdd('event')}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Block</span>
            </button>
          </div>
        </div>

        {/* UP NEXT */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col justify-between min-h-[110px] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              UP NEXT
            </span>
            {nextUpcomingEvent && minutesToNext !== null && (
              <span className="text-xs text-primary font-medium">
                {minutesToNext <= 0 ? 'Starting now' : `Starts in ${minutesToNext}m`}
              </span>
            )}
          </div>

          <div className="my-1.5">
            {nextUpcomingEvent ? (
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  {nextUpcomingEvent.title}
                </h3>
                <span className="text-xs text-muted-foreground mt-0.5 block font-mono">
                  {formatEventTime(nextUpcomingEvent.start_time)}
                  {nextUpcomingEvent.location ? ` · ${nextUpcomingEvent.location}` : ''}
                </span>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-medium text-foreground tracking-tight">Nothing else planned</h3>
                <p className="text-xs text-muted-foreground mt-0.5">No upcoming events for the rest of today.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <button
              type="button"
              onClick={() => openQuickAdd('event')}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Timeline (2 cols) + Tasks & Habits (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              Schedule
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {todayEvents.length} {todayEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {todayEvents.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-card border border-border/60 space-y-3">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">Nothing planned for today</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Add an event or schedule time blocks from your tasks list.
              </p>
              <button
                type="button"
                onClick={() => openQuickAdd('event')}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium tactile-btn shadow-xs cursor-pointer"
              >
                Add Event
              </button>
            </div>
          ) : (
            <div className="relative pl-6 space-y-3 border-l border-border/70">
              {todayEvents.map((event) => {
                const isDone = event.is_completed;
                return (
                  <div
                    key={event.id}
                    className={`relative p-3.5 rounded-xl border transition-colors flex items-start gap-3 group ${
                      isDone
                        ? 'bg-secondary/30 border-border/60 opacity-60'
                        : 'bg-card border-border/80 hover:border-border'
                    }`}
                  >
                    {/* Event Start Dot on Timeline */}
                    <div
                      className="absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full border-2 border-background"
                      style={{ backgroundColor: event.color || '#0071e3' }}
                    />

                    {/* Completion Button */}
                    <button
                      type="button"
                      onClick={() => toggleEventCompletion(event.id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0 cursor-pointer"
                      aria-label="Toggle Complete"
                    >
                      {isDone ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/60 hover:border-primary transition-colors" />
                      )}
                    </button>

                    {/* Event Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-medium truncate ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {event.title}
                        </h4>
                        <span className="text-xs text-muted-foreground shrink-0 font-mono">
                          {formatEventTime(event.start_time)} — {formatEventTime(event.end_time)}
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        {event.project && (
                          <span className="font-medium text-foreground/80">
                            {event.project.name}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            · <MapPin className="w-3 h-3" /> {event.location}
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

        {/* Right Column: Tasks & Habits */}
        <div className="space-y-6">
          {/* Tasks Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Tasks
              </h2>
              <button
                type="button"
                onClick={() => openQuickAdd('task')}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="space-y-1.5">
              {todayTasks.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-card border border-border/60 text-xs text-muted-foreground">
                  No tasks due today.
                </div>
              ) : (
                todayTasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 group ${
                        isDone
                          ? 'bg-secondary/30 border-border/50 opacity-60'
                          : 'bg-card border-border/80 hover:bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0 cursor-pointer"
                          aria-label="Complete task"
                        >
                          {isDone ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/60 hover:border-primary transition-colors" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-normal truncate ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => scheduleTaskAsEvent(task.id, new Date().toISOString())}
                          className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 font-medium transition-opacity shrink-0 cursor-pointer"
                        >
                          Schedule
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Habits Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Habits
              </h2>
              <Link href="/habits" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-1.5">
              {habits.filter((h) => h.is_active !== false).length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-card border border-border/60 text-xs text-muted-foreground">
                  No habits active yet.
                </div>
              ) : (
                habits
                  .filter((h) => h.is_active !== false)
                  .slice(0, 5)
                  .map((habit) => {
                    const log = habitLogs.find(
                      (l) => l.habit_id === habit.id && l.date === todayStr
                    );
                    const isCompleted = Boolean(log && log.completed && !log.excused);
                    const isRest = Boolean(log && log.excused);
                    const habitColorHex = habit.color || '#34c759';

                    return (
                      <button
                        type="button"
                        key={habit.id}
                        onClick={() => toggleHabitForDate(habit.id, todayStr)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-secondary/60 border-border/80'
                            : isRest
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-card border-border/80 hover:bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'text-white'
                                : isRest
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'border border-muted-foreground/60'
                            }`}
                            style={isCompleted ? { backgroundColor: habitColorHex } : undefined}
                          >
                            {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                            {isRest && <Moon className="w-2.5 h-2.5 stroke-[2.5]" />}
                          </div>
                          <span
                            className={`text-xs truncate ${
                              isCompleted
                                ? 'text-foreground font-medium'
                                : isRest
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {habit.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {isRest ? 'Rest day' : habit.frequency}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
