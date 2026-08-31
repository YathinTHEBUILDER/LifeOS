'use client';

import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { toast } from 'sonner';

interface PlanDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanDayModal({ isOpen, onClose }: PlanDayModalProps) {
  const { planMyDay, replanMyDay, tasks } = usePlanner();
  const [activeMode, setActiveMode] = useState<'plan' | 'replan'>('plan');
  const [lostTimeOption, setLostTimeOption] = useState<number>(60);

  if (!isOpen) return null;

  const unscheduledTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'inbox');

  const handleRunPlan = () => {
    planMyDay();
    toast.success('Schedule created');
    onClose();
  };

  const handleRunReplan = () => {
    replanMyDay(lostTimeOption);
    toast.success('Schedule adjusted');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-safe sm:pb-0 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="p-3.5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveMode('plan')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeMode === 'plan'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Plan Day
            </button>
            <button
              onClick={() => setActiveMode('replan')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeMode === 'replan'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Lost Time
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {activeMode === 'plan' ? (
            <div className="space-y-4">
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="text-foreground font-medium">Auto-scheduling</p>
                <p className="leading-relaxed">
                  We look at your available working hours, preserve any existing calendar events, and fit your pending tasks into open time blocks based on priority.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Pending tasks</span>
                <span className="font-semibold text-foreground">{unscheduledTasks.length} ready</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunPlan}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
                >
                  Schedule Day
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="text-foreground font-medium">Running behind schedule?</p>
                <p className="leading-relaxed">
                  If an unexpected meeting ran over or you got sidetracked, choose how much time was lost to shift flexible tasks into the afternoon.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Lost Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '30m', val: 30 },
                    { label: '1 hour', val: 60 },
                    { label: '2 hours', val: 120 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setLostTimeOption(item.val)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        lostTimeOption === item.val
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunReplan}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
                >
                  Shift Afternoon Tasks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
