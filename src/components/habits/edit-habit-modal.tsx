'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Habit, HabitFrequency } from '@/types';
import { usePlanner } from '@/lib/store/planner-context';
import { HABIT_ICONS, HABIT_COLORS } from './habit-constants';
import { toast } from 'sonner';

interface EditHabitModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditHabitModal({ habit, isOpen, onClose }: EditHabitModalProps) {
  const { updateHabit } = usePlanner();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetDays, setTargetDays] = useState(7);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedIcon, setSelectedIcon] = useState('CheckCircle');
  const [selectedColor, setSelectedColor] = useState('#34c759');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habit && isOpen) {
      setName(habit.name || '');
      setDescription(habit.description || '');
      setFrequency(habit.frequency || 'daily');
      setTargetDays(habit.target_days || 7);
      setReminderTime(habit.reminder_time || '09:00');
      setSelectedIcon(habit.icon || 'CheckCircle');
      setSelectedColor(habit.color || '#34c759');
    }
  }, [habit, isOpen]);

  if (!isOpen || !habit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide a habit name');
      return;
    }

    try {
      setIsSubmitting(true);
      updateHabit(habit.id, {
        name: name.trim(),
        description: description.trim(),
        frequency,
        target_days: frequency === 'weekly' ? Math.min(7, Math.max(1, Number(targetDays) || 1)) : 7,
        reminder_time: reminderTime || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });

      toast.success('Habit updated');
      onClose();
    } catch {
      toast.error("Couldn't update that habit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] pb-safe sm:pb-0 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Edit Habit
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Name */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Habit Name
            </label>
            <input
              type="text"
              placeholder="e.g. Daily Meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full text-sm bg-secondary/50 border border-border/80 rounded-lg px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 10 minutes breathing exercise"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-3 py-2 text-foreground focus:outline-hidden"
            />
          </div>

          {/* Frequency & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-2 text-foreground focus:outline-hidden"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Conditional Weekly Target */}
          {frequency === 'weekly' && (
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 animate-in fade-in-50 duration-150">
              <label className="text-[11px] font-medium text-foreground block mb-1">
                Target Days per Week
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-xs font-semibold text-foreground w-12 text-right">
                  {targetDays} {targetDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          )}

          {/* Color Picker */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {HABIT_COLORS.map((c) => {
                const isSelected = selectedColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.name}
                    aria-label={`Select color ${c.name}`}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1 bg-secondary/20 rounded-xl border border-border/50">
              {HABIT_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    title={item.label}
                    aria-label={`Select icon ${item.label}`}
                    className={`h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 tactile-btn shadow-xs transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
