'use client';

import React from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Habits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'} active
          </p>
        </div>

        <button
          onClick={() => openQuickAdd('habit')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits List with 7-Day Matrix */}
      <div className="space-y-2">
        {habits.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-card border border-border/60 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">No habits yet</p>
            <p>Add a daily or weekly routine to track.</p>
          </div>
        ) : (
          habits.map((habit) => {
            const streak = getHabitStreak(habit.id);

            return (
              <div
                key={habit.id}
                className="p-3.5 rounded-xl bg-card border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:bg-secondary/20 transition-colors"
              >
                {/* Habit Info & Streak */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground truncate">{habit.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="capitalize">{habit.frequency}</span>
                    {streak > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-normal text-foreground">{streak} day streak</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 7-Day Completion Matrix */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/60">
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
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-card text-muted-foreground hover:bg-secondary border border-border/40'
                          } ${isCurrentDay && !isCompleted ? 'border-primary' : ''}`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-normal">{format(day, 'd')}</span>
                          )}
                        </button>
                      );
                    })}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
