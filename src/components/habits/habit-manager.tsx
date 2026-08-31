'use client';

import React from 'react';
import { Flame, Plus, Check, Trash2 } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format, subDays, eachDayOfInterval, isToday } from 'date-fns';
import { toast } from 'sonner';

export function HabitManager() {
  const { habits, habitLogs, toggleHabitForDate, deleteHabit, getHabitStreak, openQuickAdd } = usePlanner();

  const today = new Date();
  const past7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Habit Tracking</h1>
            <p className="text-xs text-muted-foreground">Build consistency with daily streaks</p>
          </div>
        </div>

        <button
          onClick={() => openQuickAdd('habit')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits List with Weekly Matrix */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border text-xs text-muted-foreground">
            No habits yet. Click "New Habit" to start tracking daily routines.
          </div>
        ) : (
          habits.map((habit) => {
            const streak = getHabitStreak(habit.id);

            return (
              <div
                key={habit.id}
                className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                {/* Habit Info & Streak */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-primary shrink-0">
                    <Flame className={`w-5 h-5 ${streak > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground truncate">{habit.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{habit.frequency}</span>
                      <span>·</span>
                      <span className="font-semibold text-amber-500">{streak} day streak 🔥</span>
                    </div>
                  </div>
                </div>

                {/* 7-Day Completion Matrix */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 bg-secondary/40 p-1.5 rounded-xl border border-border/60">
                    {past7Days.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isCompleted = habitLogs.some(
                        (l) => l.habit_id === habit.id && l.date === dateStr && l.completed
                      );
                      const isCurrentDay = isToday(day);

                      return (
                        <button
                          key={idx}
                          onClick={() => toggleHabitForDate(habit.id, dateStr)}
                          className={`w-7 h-8 rounded-lg flex flex-col items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white font-bold'
                              : 'bg-card text-muted-foreground hover:bg-secondary border border-border/40'
                          } ${isCurrentDay ? 'ring-1 ring-primary' : ''}`}
                        >
                          <span className="text-[9px] uppercase font-bold opacity-80">
                            {format(day, 'EEEEE')}
                          </span>
                          <span className="text-[10px] font-semibold">
                            {isCompleted ? '✓' : format(day, 'd')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      deleteHabit(habit.id);
                      toast.success('Habit deleted');
                    }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
