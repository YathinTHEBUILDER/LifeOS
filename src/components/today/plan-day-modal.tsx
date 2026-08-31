'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw, Clock, X, Check, ArrowRight } from 'lucide-react';
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
    toast.success('Generated your balanced daily schedule!');
    onClose();
  };

  const handleRunReplan = () => {
    replanMyDay(lostTimeOption);
    toast.success(`Rearranged afternoon schedule by +${lostTimeOption} minutes.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Intelligent Day Planner</h2>
              <p className="text-[11px] text-muted-foreground">Automate or recover your schedule gracefully</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-4 bg-secondary/30 border-b border-border flex gap-2">
          <button
            onClick={() => setActiveMode('plan')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'plan' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Plan My Day
          </button>
          <button
            onClick={() => setActiveMode('replan')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'replan' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            Replan ("Lost Time")
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {activeMode === 'plan' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-xs space-y-2">
                <p className="text-foreground font-medium">How Planning Works:</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside text-[11px]">
                  <li>Inspects fixed commitments & classes</li>
                  <li>Finds free focus windows in your working hours (9 AM - 6 PM)</li>
                  <li>Allocates your highest priority tasks with realistic duration buffers</li>
                  <li>Never deletes your existing scheduled items</li>
                </ul>
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{unscheduledTasks.length} pending tasks</span> ready to be
                scheduled into available time blocks.
              </div>

              <button
                onClick={handleRunPlan}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                Propose & Schedule My Day
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <p className="text-amber-500 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> "I lost time today — help me adjust"
                </p>
                <p className="text-muted-foreground text-[11px]">
                  If an emergency, overrunning meeting, or distraction occurred, select how much time was lost. We will push
                  remaining flexible tasks into the afternoon.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">How much time was lost?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '30 mins', val: 30 },
                    { label: '1 hour', val: 60 },
                    { label: '2 hours', val: 120 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setLostTimeOption(item.val)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        lostTimeOption === item.val
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRunReplan}
                className="w-full py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Rearrange Remaining Day
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
