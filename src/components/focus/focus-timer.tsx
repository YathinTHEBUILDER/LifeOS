'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { toast } from 'sonner';

export function FocusTimer() {
  const { tasks, logFocusSession, focusSessions } = usePlanner();

  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSelectDuration = (mins: number) => {
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  };

  const handleSessionComplete = () => {
    logFocusSession({
      taskId: selectedTaskId || null,
      durationMinutes: selectedDuration,
    });

    toast.success(`Completed ${selectedDuration}m focus session`);
    handleReset();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="space-y-12 max-w-xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Focus</h1>
        <p className="text-sm text-muted-foreground font-normal">
          {selectedTask ? selectedTask.title : 'Deep work'}
        </p>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="text-7xl sm:text-8xl font-light tracking-tight text-foreground font-mono select-none">
          {formattedTime}
        </div>

        {/* Duration Selectors */}
        <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-xl">
          {[
            { label: '25m', mins: 25 },
            { label: '45m', mins: 45 },
            { label: '60m', mins: 60 },
          ].map((item) => (
            <button
              key={item.mins}
              onClick={() => handleSelectDuration(item.mins)}
              disabled={isRunning}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDuration === item.mins
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Task Linker */}
        <div className="w-full max-w-xs">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={isRunning}
            className="w-full text-xs bg-secondary/50 border border-border/80 rounded-xl px-3 py-2 text-foreground font-medium focus:outline-hidden text-center"
          >
            <option value="">General Focus</option>
            {tasks
              .filter((t) => t.status !== 'completed')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={handleReset}
            aria-label="Reset Timer"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleTimer}
            aria-label={isRunning ? 'Pause' : 'Start'}
            className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 tactile-btn transition-all"
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleSessionComplete}
            aria-label="Complete Session"
            title="Finish early"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Focus History (Quiet) */}
      {focusSessions.length > 0 && (
        <div className="pt-8 border-t border-border/60 space-y-2 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Recent Sessions
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {focusSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-2.5 rounded-lg bg-card border border-border/80 flex items-center justify-between"
              >
                <span className="font-medium text-foreground">{session.duration_minutes} minutes</span>
                <span className="text-muted-foreground font-normal">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
