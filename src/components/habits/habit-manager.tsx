'use client';

import React, { useState } from 'react';
import { Plus, Check, Trash2, Calendar, Grid } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format, subDays, eachDayOfInterval, isToday, isWeekend } from 'date-fns';
import { toast } from 'sonner';

export function HabitManager() {
  const { habits, habitLogs, toggleHabitForDate, deleteHabit, getHabitStreak, openQuickAdd } = usePlanner();
  const [viewMode, setViewMode] = useState<'7d' | '90d'>('7d');

  const today = new Date();
  const past7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  const past90Days = eachDayOfInterval({
    start: subDays(today, 89),
    end: today,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Habits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'} active
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Segmented 7d / 90d toggle */}
          <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => setViewMode('7d')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === '7d'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewMode('90d')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === '90d'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              90 Days
            </button>
          </div>

          <button
            onClick={() => openQuickAdd('habit')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-card border border-border/60 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">No habits yet</p>
            <p>Add a daily or weekly routine to track.</p>
          </div>
        ) : (
          habits.map((habit) => {
            const streak = getHabitStreak(habit.id);
            const isWeekdayOnly = habit.frequency === 'weekdays';

            // Calculate 90-day completion rate
            const completed90Count = past90Days.filter((d) => {
              const dStr = format(d, 'yyyy-MM-dd');
              return habitLogs.some((l) => l.habit_id === habit.id && l.date === dStr && l.completed);
            }).length;

            const totalEligibleDays = isWeekdayOnly
              ? past90Days.filter((d) => !isWeekend(d)).length
              : 90;
            const completionRate = Math.round((completed90Count / Math.max(1, totalEligibleDays)) * 100);

            return (
              <div
                key={habit.id}
                className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col gap-3 group hover:border-border transition-colors shadow-xs"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{habit.name}</h3>
                      {habit.reminder_time && (
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                          ⏰ {habit.reminder_time}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{habit.frequency}</span>
                      {streak > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-emerald-500">{streak} streak</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{completionRate}% consistency (90d)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      deleteHabit(habit.id);
                      toast.success('Habit deleted');
                    }}
                    aria-label="Delete habit"
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 7-Day Matrix View */}
                {viewMode === '7d' ? (
                  <div className="flex items-center gap-1.5 bg-secondary/30 p-2 rounded-xl border border-border/50 self-start">
                    {past7Days.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isCompleted = habitLogs.some(
                        (l) => l.habit_id === habit.id && l.date === dateStr && l.completed
                      );
                      const isCurrentDay = isToday(day);
                      const isDayWeekend = isWeekend(day);
                      const isExcludedWeekend = isWeekdayOnly && isDayWeekend;

                      return (
                        <button
                          key={idx}
                          onClick={() => toggleHabitForDate(habit.id, dateStr)}
                          title={`${format(day, 'MMM d, yyyy')}${isExcludedWeekend ? ' (Weekend - no penalty)' : ''}`}
                          className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isExcludedWeekend
                              ? 'bg-secondary/40 text-muted-foreground/50 border border-border/30'
                              : 'bg-card text-foreground hover:bg-secondary border border-border/60'
                          } ${isCurrentDay && !isCompleted ? 'ring-1 ring-primary' : ''}`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <>
                              <span className="text-[9px] text-muted-foreground/80 leading-none">
                                {format(day, 'EEE')[0]}
                              </span>
                              <span className="text-[11px] font-medium leading-none mt-0.5">
                                {format(day, 'd')}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* 90-Day Contribution Heatmap View */
                  <div className="bg-secondary/20 p-3 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                      <span>90-day activity</span>
                      <span>{completed90Count} completed</span>
                    </div>

                    <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
                      {past90Days.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCompleted = habitLogs.some(
                          (l) => l.habit_id === habit.id && l.date === dateStr && l.completed
                        );
                        const isExcludedWeekend = isWeekdayOnly && isWeekend(day);

                        return (
                          <button
                            key={idx}
                            onClick={() => toggleHabitForDate(habit.id, dateStr)}
                            title={`${format(day, 'EEE, MMM d, yyyy')}: ${
                              isCompleted ? 'Completed' : isExcludedWeekend ? 'Weekend off' : 'Not completed'
                            }`}
                            className={`w-2.5 h-2.5 rounded-xs transition-colors ${
                              isCompleted
                                ? 'bg-emerald-500 hover:bg-emerald-400'
                                : isExcludedWeekend
                                ? 'bg-secondary/50 border border-border/30 opacity-40'
                                : 'bg-secondary hover:bg-secondary/80 border border-border/40'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

