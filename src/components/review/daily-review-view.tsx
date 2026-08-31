'use client';

import React, { useState } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

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

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const existingReview = dailyReviews.find((r) => r.date === todayStr);

  const [whatWentWell, setWhatWentWell] = useState(existingReview?.what_went_well || '');
  const [whatDidntGetDone, setWhatDidntGetDone] = useState(existingReview?.what_didnt_get_done || '');
  const [actionTomorrow, setActionTomorrow] = useState(existingReview?.action_for_tomorrow || '');
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);

  // Metrics
  const todayTasks = tasks.filter((t) => t.due_date === todayStr || t.status === 'scheduled');
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');
  const missedTasks = todayTasks.filter((t) => t.status !== 'completed');

  const todayFocusMinutes = focusSessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const habitsDoneCount = habitLogs.filter((l) => l.date === todayStr && l.completed).length;

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
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Review</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

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
  );
}
