'use client';

import React, { useState } from 'react';
import { Star, ArrowRight, TrendingUp, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format, addDays, subDays, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { toast } from 'sonner';

type ReviewPeriod = 'day' | 'week' | 'month';

export function DailyReviewView() {
  const {
    tasks,
    focusSessions,
    habits,
    habitLogs,
    dailyReviews,
    saveDailyReview,
    updateTask,
  } = usePlanner();

  const [period, setPeriod] = useState<ReviewPeriod>('day');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const existingReview = dailyReviews.find((r) => r.date === todayStr);

  const [whatWentWell, setWhatWentWell] = useState(existingReview?.what_went_well || '');
  const [whatDidntGetDone, setWhatDidntGetDone] = useState(existingReview?.what_didnt_get_done || '');
  const [actionTomorrow, setActionTomorrow] = useState(existingReview?.action_for_tomorrow || '');
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);

  // --------------------------------------------------------------------------
  // DAY METRICS
  // --------------------------------------------------------------------------
  const todayTasks = tasks.filter((t) => t.due_date === todayStr || t.status === 'scheduled');
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');
  const missedTasks = todayTasks.filter((t) => t.status !== 'completed');

  const todayFocusMinutes = focusSessions
    .filter((s) => {
      try {
        return isSameDay(parseISO(s.start_time), new Date());
      } catch {
        return false;
      }
    })
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  const habitsDoneCount = habitLogs.filter((l) => l.date === todayStr && l.completed).length;

  // --------------------------------------------------------------------------
  // WEEK / MONTH ROLLUP CALCULATIONS
  // --------------------------------------------------------------------------
  const numRollupDays = period === 'week' ? 7 : 30;
  const rollupDays = eachDayOfInterval({
    start: subDays(new Date(), numRollupDays - 1),
    end: new Date(),
  });

  const periodDaysStr = rollupDays.map((d) => format(d, 'yyyy-MM-dd'));

  // Aggregated tasks completed in this period
  const periodCompletedTasks = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const completedDate = t.completed_at ? t.completed_at.split('T')[0] : t.due_date;
    return completedDate && periodDaysStr.includes(completedDate);
  });

  const periodTotalTasks = tasks.filter((t) => {
    return t.due_date && periodDaysStr.includes(t.due_date);
  });

  const taskCompletionRate = periodTotalTasks.length > 0
    ? Math.round((periodCompletedTasks.length / periodTotalTasks.length) * 100)
    : 100;

  // Total Focus Minutes in Period
  const periodFocusMinutes = focusSessions
    .filter((s) => {
      try {
        const sDate = s.start_time.split('T')[0];
        return periodDaysStr.includes(sDate);
      } catch {
        return false;
      }
    })
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  // Daily Focus Distribution for Bar Chart
  const focusByDay = rollupDays.map((day) => {
    const dStr = format(day, 'yyyy-MM-dd');
    const mins = focusSessions
      .filter((s) => {
        try {
          return s.start_time.split('T')[0] === dStr;
        } catch {
          return false;
        }
      })
      .reduce((acc, s) => acc + s.duration_minutes, 0);

    return {
      date: day,
      label: format(day, period === 'week' ? 'EEE' : 'd'),
      minutes: mins,
    };
  });

  const maxFocusMin = Math.max(1, ...focusByDay.map((d) => d.minutes));

  // Habit Consistency in Period
  const habitConsistency = habits.map((habit) => {
    const logsInPeriod = habitLogs.filter(
      (l) => l.habit_id === habit.id && periodDaysStr.includes(l.date) && l.completed
    ).length;
    const rate = Math.round((logsInPeriod / numRollupDays) * 100);
    return {
      habit,
      completedCount: logsInPeriod,
      rate,
    };
  });

  // Average Rating
  const periodReviews = dailyReviews.filter((r) => periodDaysStr.includes(r.date) && r.rating);
  const avgRating = periodReviews.length > 0
    ? (periodReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / periodReviews.length).toFixed(1)
    : '5.0';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveDailyReview({
      date: todayStr,
      tasks_completed_count: completedTasks.length,
      focus_minutes_total: todayFocusMinutes,
      habits_completed_count: habitsDoneCount,
      what_went_well: whatWentWell.trim(),
      what_didnt_get_done: whatDidntGetDone.trim(),
      action_for_tomorrow: actionTomorrow.trim(),
      rating,
    });
    toast.success('Review saved');
  };

  const handleRolloverTasks = () => {
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    missedTasks.forEach((t) => {
      updateTask(t.id, { due_date: tomorrowStr, status: 'todo' });
    });
    toast.success(`Moved ${missedTasks.length} uncompleted tasks to tomorrow`);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header & Segmented Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Review</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {period === 'day'
              ? format(new Date(), 'EEEE, MMMM d')
              : period === 'week'
              ? 'Past 7 Days Summary'
              : 'Past 30 Days Summary'}
          </p>
        </div>

        {/* Period Switcher */}
        <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/60 self-start sm:self-auto">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPeriod(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                period === mode
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DAY VIEW */}
      {/* ========================================================================= */}
      {period === 'day' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border/80 text-center">
              <div className="text-2xl font-semibold text-foreground tracking-tight">
                {completedTasks.length} <span className="text-xs text-muted-foreground font-normal">/ {todayTasks.length}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-normal block mt-1">Tasks Done</span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/80 text-center">
              <div className="text-2xl font-semibold text-foreground tracking-tight">{todayFocusMinutes}m</div>
              <span className="text-[11px] text-muted-foreground font-normal block mt-1">Focus Time</span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/80 text-center">
              <div className="text-2xl font-semibold text-foreground tracking-tight">
                {habitsDoneCount} <span className="text-xs text-muted-foreground font-normal">/ {habits.length}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-normal block mt-1">Habits Done</span>
            </div>
          </div>

          {/* Missed Tasks Rollover Box */}
          {missedTasks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 flex items-center justify-between gap-4">
              <div className="text-xs">
                <span className="font-medium text-foreground block">
                  {missedTasks.length} {missedTasks.length === 1 ? 'task still open' : 'tasks still open'}
                </span>
                <span className="text-muted-foreground">
                  Reschedule them to tomorrow morning.
                </span>
              </div>
              <button
                onClick={handleRolloverTasks}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline shrink-0"
              >
                <span>Move to tomorrow</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Reflection Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">What went well today?</label>
              <textarea
                placeholder="Wins, completed milestones, breakthrough moments..."
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                rows={2}
                className="w-full text-xs bg-secondary/40 border border-border/70 rounded-lg p-2.5 text-foreground focus:outline-hidden resize-none placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">What didn't get done and why?</label>
              <textarea
                placeholder="Obstacles, interruptions, or shifts in priority..."
                value={whatDidntGetDone}
                onChange={(e) => setWhatDidntGetDone(e.target.value)}
                rows={2}
                className="w-full text-xs bg-secondary/40 border border-border/70 rounded-lg p-2.5 text-foreground focus:outline-hidden resize-none placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Priority for tomorrow</label>
              <input
                type="text"
                placeholder="Single most important thing to get done tomorrow..."
                value={actionTomorrow}
                onChange={(e) => setActionTomorrow(e.target.value)}
                className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">How was your day?</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-500 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${rating >= star ? 'fill-amber-500' : 'text-muted-foreground/30'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
              >
                Save Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WEEK / MONTH ROLLUP VIEW */}
      {/* ========================================================================= */}
      {(period === 'week' || period === 'month') && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* High Level Rollup Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Tasks Completed</span>
              <div className="text-2xl font-bold text-foreground mt-1">
                {periodCompletedTasks.length}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {taskCompletionRate}% completion rate
              </span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Focus Hours</span>
              <div className="text-2xl font-bold text-foreground mt-1">
                {(periodFocusMinutes / 60).toFixed(1)}h
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {Math.round(periodFocusMinutes / numRollupDays)}m / day avg
              </span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Active Habits</span>
              <div className="text-2xl font-bold text-foreground mt-1">
                {habits.length}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {habitConsistency.filter((h) => h.rate >= 70).length} on track
              </span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/80">
              <span className="text-[11px] text-muted-foreground block">Average Rating</span>
              <div className="text-2xl font-bold text-foreground mt-1 flex items-center gap-1.5">
                <span>{avgRating}</span>
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {periodReviews.length} reviews logged
              </span>
            </div>
          </div>

          {/* Focus Distribution Bar Chart */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Focus Time Distribution</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Daily deep work minutes over this period</p>
              </div>
              <span className="text-xs font-semibold text-primary font-mono">{periodFocusMinutes}m Total</span>
            </div>

            <div className="flex items-end gap-1.5 h-36 pt-6 px-1 overflow-x-auto">
              {focusByDay.map((day, idx) => {
                const heightPct = Math.max(4, Math.round((day.minutes / maxFocusMin) * 100));

                return (
                  <div key={idx} className="flex-1 min-w-[18px] flex flex-col items-center gap-1 group">
                    <div className="w-full flex-1 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[28px] rounded-t-sm transition-all ${
                          day.minutes > 0
                            ? 'bg-primary hover:bg-primary/80'
                            : 'bg-secondary/60'
                        }`}
                        title={`${format(day.date, 'MMM d')}: ${day.minutes} mins`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono truncate">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habit Consistency Breakdown */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Habit Consistency</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Completion percentage across active habits</p>
            </div>

            <div className="space-y-3">
              {habitConsistency.map(({ habit, completedCount, rate }) => (
                <div key={habit.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{habit.name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">({habit.frequency})</span>
                    </div>
                    <span className="font-medium text-muted-foreground">
                      {completedCount} / {numRollupDays} days ({rate}%)
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: habit.color || '#10B981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
