'use client';

import React, { useState } from 'react';
import { BarChart3, CheckCircle2, Clock, Flame, Star, ArrowRight, Sparkles } from 'lucide-react';
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
    toast.success('Daily Review saved!');
  };

  const handleRolloverTasks = () => {
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    missedTasks.forEach((t) => {
      updateTask(t.id, { due_date: tomorrowStr, status: 'todo' });
    });
    toast.success(`Moved ${missedTasks.length} uncompleted tasks to tomorrow!`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs text-center space-y-1">
        <h1 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Daily Review & Reflection
        </h1>
        <p className="text-xs text-muted-foreground">Close out your day intentionally and set up tomorrow</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
          <div className="text-2xl font-black text-foreground">
            {completedTasks.length} / {todayTasks.length}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Tasks Completed</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <Clock className="w-5 h-5 text-primary mx-auto" />
          <div className="text-2xl font-black text-foreground">{todayFocusMinutes}m</div>
          <span className="text-[11px] text-muted-foreground font-medium">Deep Focus Logged</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <Flame className="w-5 h-5 text-amber-500 mx-auto" />
          <div className="text-2xl font-black text-foreground">
            {habitsDoneCount} / {habits.length}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Habits Checked Off</span>
        </div>
      </div>

      {/* Missed Tasks Rollover Box */}
      {missedTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-foreground block">
              {missedTasks.length} tasks still open from today
            </span>
            <span className="text-[11px] text-muted-foreground">
              Would you like to reschedule them to tomorrow morning?
            </span>
          </div>
          <button
            onClick={handleRolloverTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shrink-0"
          >
            <span>Move to Tomorrow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Reflection Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-card border border-border shadow-md space-y-5">
        <div>
          <label className="text-xs font-bold text-foreground block mb-1">What went well today?</label>
          <textarea
            placeholder="Wins, breakthrough moments, shipped milestones..."
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
            rows={2}
            className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 text-foreground focus:outline-hidden resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-foreground block mb-1">What didn't get done and why?</label>
          <textarea
            placeholder="Blockers, unexpected meetings, energy dips..."
            value={whatDidntGetDone}
            onChange={(e) => setWhatDidntGetDone(e.target.value)}
            rows={2}
            className="w-full text-xs bg-secondary/50 border border-border rounded-xl p-3 text-foreground focus:outline-hidden resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-foreground block mb-1">Single most important action for tomorrow?</label>
          <input
            type="text"
            placeholder="e.g. Finish InvoiceFlow Stripe integration by noon"
            value={actionTomorrow}
            onChange={(e) => setActionTomorrow(e.target.value)}
            className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="text-xs font-bold text-foreground block mb-2">Overall Day Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 text-amber-500 transition-transform hover:scale-125"
              >
                <Star
                  className={`w-6 h-6 ${rating >= star ? 'fill-amber-500' : 'text-muted-foreground/30'}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            Save Daily Review
          </button>
        </div>
      </form>
    </div>
  );
}
