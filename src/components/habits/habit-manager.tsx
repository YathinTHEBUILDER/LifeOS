'use client';

import React, { useState } from 'react';
import {
  Plus,
  Check,
  Archive,
  RotateCcw,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Moon,
  Flame,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { Habit } from '@/types';
import { format, subDays, eachDayOfInterval, isToday, isWeekend } from 'date-fns';
import { HabitIconView, HABIT_COLORS } from './habit-constants';
import { EditHabitModal } from './edit-habit-modal';
import { toast } from 'sonner';

export function HabitManager() {
  const {
    habits,
    habitLogs,
    cycleHabitLogState,
    archiveHabit,
    restoreHabit,
    deleteHabit,
    getHabitStreak,
    openQuickAdd,
  } = usePlanner();

  const [viewMode, setViewMode] = useState<'7d' | '90d'>('7d');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [habitToArchive, setHabitToArchive] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const past7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  const past90Days = eachDayOfInterval({
    start: subDays(today, 89),
    end: today,
  });

  // Separate active and archived habits
  const activeHabits = habits.filter((h) => h.is_active !== false);
  const archivedHabits = habits.filter((h) => h.is_active === false);

  // Compute "X done today" rollup for active habits (excluding excused days)
  const doneTodayCount = activeHabits.filter((habit) =>
    habitLogs.some((l) => l.habit_id === habit.id && l.date === todayStr && l.completed && !l.excused)
  ).length;

  const handleConfirmArchive = () => {
    if (!habitToArchive) return;
    archiveHabit(habitToArchive.id);
    toast.success(`"${habitToArchive.name}" archived`);
    setHabitToArchive(null);
  };

  const handleConfirmDelete = () => {
    if (!habitToDelete) return;
    deleteHabit(habitToDelete.id);
    toast.success(`"${habitToDelete.name}" permanently deleted`);
    setHabitToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Habits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeHabits.length === 0 ? (
              'No active habits'
            ) : (
              <span>
                <span className="font-semibold text-foreground">{doneTodayCount}</span> of{' '}
                <span className="font-semibold text-foreground">{activeHabits.length}</span> done today
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Segmented 7d / 90d toggle */}
          <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => setViewMode('7d')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === '7d'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewMode('90d')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Active Habits List */}
      <div className="space-y-3">
        {activeHabits.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-card border border-border/60 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm">No active habits</p>
            <p>Track daily routines, mindful practices, and weekly goals.</p>
            <div className="pt-2">
              <button
                onClick={() => openQuickAdd('habit')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create your first habit
              </button>
            </div>
          </div>
        ) : (
          activeHabits.map((habit) => {
            const streak = getHabitStreak(habit.id);
            const isWeekdayOnly = habit.frequency === 'weekdays';
            const habitColorHex = habit.color || '#34c759';

            // Calculate 90-day completion rate
            const completed90Count = past90Days.filter((d) => {
              const dStr = format(d, 'yyyy-MM-dd');
              return habitLogs.some(
                (l) => l.habit_id === habit.id && l.date === dStr && l.completed && !l.excused
              );
            }).length;

            const totalEligibleDays = isWeekdayOnly
              ? past90Days.filter((d) => !isWeekend(d)).length
              : 90;
            const completionRate = Math.round((completed90Count / Math.max(1, totalEligibleDays)) * 100);

            return (
              <div
                key={habit.id}
                className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col gap-3.5 group hover:border-border transition-colors shadow-xs"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Habit Icon Badge */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${habitColorHex}18`,
                        color: habitColorHex,
                      }}
                    >
                      <HabitIconView iconName={habit.icon} className="w-4 h-4" />
                    </div>

                    {/* Habit Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
                          {habit.name}
                        </h3>
                        {habit.reminder_time && (
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                            ⏰ {habit.reminder_time}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span className="capitalize">
                          {habit.frequency === 'weekly'
                            ? `Weekly (${habit.target_days || 7}d/wk)`
                            : habit.frequency}
                        </span>
                        {streak > 0 && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                              <Flame className="w-3 h-3 fill-emerald-500/20 text-emerald-500" />
                              {streak} streak
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>{completionRate}% consistency (90d)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Archive */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditingHabit(habit)}
                      aria-label={`Edit ${habit.name}`}
                      title="Edit habit"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setHabitToArchive(habit)}
                      aria-label={`Archive ${habit.name}`}
                      title="Archive habit"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description if present */}
                {habit.description && (
                  <p className="text-xs text-muted-foreground -mt-1 line-clamp-2">
                    {habit.description}
                  </p>
                )}

                {/* 7-Day Matrix View with 3-State Cycle */}
                {viewMode === '7d' ? (
                  <div className="flex items-center gap-1.5 bg-secondary/30 p-2 rounded-xl border border-border/50 self-start overflow-x-auto max-w-full">
                    {past7Days.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const log = habitLogs.find(
                        (l) => l.habit_id === habit.id && l.date === dateStr
                      );
                      const isCompleted = Boolean(log && log.completed && !log.excused);
                      const isExcused = Boolean(log && log.excused);
                      const isCurrentDay = isToday(day);
                      const isDayWeekend = isWeekend(day);
                      const isExcludedWeekend = isWeekdayOnly && isDayWeekend;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => cycleHabitLogState(habit.id, dateStr)}
                          title={`${format(day, 'EEE, MMM d')}: ${
                            isCompleted
                              ? 'Done (Click to set Rest Day)'
                              : isExcused
                              ? 'Rest Day (Click to Clear)'
                              : 'Clear (Click to mark Done)'
                          }`}
                          aria-label={`${habit.name} on ${format(day, 'MMM d')}: ${
                            isCompleted ? 'Done' : isExcused ? 'Rest Day' : 'Not completed'
                          }`}
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                            isCompleted
                              ? 'text-white shadow-xs'
                              : isExcused
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : isExcludedWeekend
                              ? 'bg-secondary/40 text-muted-foreground/50 border border-border/30'
                              : 'bg-card text-foreground hover:bg-secondary border border-border/60'
                          } ${isCurrentDay && !isCompleted && !isExcused ? 'ring-1 ring-primary' : ''}`}
                          style={isCompleted ? { backgroundColor: habitColorHex } : undefined}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isExcused ? (
                            <div className="flex flex-col items-center justify-center">
                              <Moon className="w-3 h-3 stroke-[2.5]" />
                              <span className="text-[8px] font-semibold leading-none mt-0.5">
                                REST
                              </span>
                            </div>
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
                        const log = habitLogs.find(
                          (l) => l.habit_id === habit.id && l.date === dateStr
                        );
                        const isCompleted = Boolean(log && log.completed && !log.excused);
                        const isExcused = Boolean(log && log.excused);
                        const isExcludedWeekend = isWeekdayOnly && isWeekend(day);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => cycleHabitLogState(habit.id, dateStr)}
                            title={`${format(day, 'EEE, MMM d, yyyy')}: ${
                              isCompleted
                                ? 'Completed'
                                : isExcused
                                ? 'Rest Day'
                                : isExcludedWeekend
                                ? 'Weekend off'
                                : 'Not completed'
                            }`}
                            className={`w-2.5 h-2.5 rounded-xs transition-colors cursor-pointer ${
                              isCompleted
                                ? 'hover:opacity-80'
                                : isExcused
                                ? 'bg-amber-400 dark:bg-amber-500/70'
                                : isExcludedWeekend
                                ? 'bg-secondary/50 border border-border/30 opacity-40'
                                : 'bg-secondary hover:bg-secondary/80 border border-border/40'
                            }`}
                            style={isCompleted ? { backgroundColor: habitColorHex } : undefined}
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

      {/* Archived Habits Collapsible Section */}
      {archivedHabits.length > 0 && (
        <div className="pt-4 border-t border-border/60 space-y-3">
          <button
            type="button"
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground py-1 px-1 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-3.5 h-3.5" />
              <span>Archived Habits ({archivedHabits.length})</span>
            </div>
            {isArchivedOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isArchivedOpen && (
            <div className="space-y-2 animate-in fade-in-50 duration-150">
              {archivedHabits.map((habit) => {
                const streak = getHabitStreak(habit.id);
                const habitColorHex = habit.color || '#34c759';

                return (
                  <div
                    key={habit.id}
                    className="p-3 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-60"
                        style={{
                          backgroundColor: `${habitColorHex}18`,
                          color: habitColorHex,
                        }}
                      >
                        <HabitIconView iconName={habit.icon} className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">{habit.name}</h4>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="capitalize">{habit.frequency}</span>
                          {streak > 0 && (
                            <>
                              <span>·</span>
                              <span>{streak} historical streak</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          restoreHabit(habit.id);
                          toast.success(`"${habit.name}" restored to active habits`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-foreground hover:bg-secondary/80 text-xs font-medium border border-border cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHabitToDelete(habit)}
                        aria-label={`Permanently delete ${habit.name}`}
                        title="Delete permanently"
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Habit Modal */}
      <EditHabitModal
        habit={editingHabit}
        isOpen={Boolean(editingHabit)}
        onClose={() => setEditingHabit(null)}
      />

      {/* Archive Confirmation Dialog */}
      {habitToArchive && (
        <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setHabitToArchive(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Archive habit?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will hide &quot;{habitToArchive.name}&quot; from your active list. Streak and completion history will be safely preserved.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHabitToArchive(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs transition-colors"
              >
                Archive Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      {habitToDelete && (
        <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setHabitToDelete(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-destructive">
                Permanently delete habit?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently delete &quot;{habitToDelete.name}&quot; and all of its historical logs? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHabitToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 tactile-btn shadow-xs transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
