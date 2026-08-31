'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, CheckCircle2, Volume2, Sparkles, Plus } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function FocusTimer() {
  const { tasks, logFocusSession, focusSessions } = usePlanner();

  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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
      notes: notes.trim() || undefined,
    });

    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
    });

    toast.success(`Great job! Completed ${selectedDuration}m focus session.`);
    handleReset();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs text-center space-y-1">
        <h1 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
          <Timer className="w-5 h-5 text-primary" /> Distraction-Free Focus
        </h1>
        <p className="text-xs text-muted-foreground">Select a task and enter deep flow state</p>
      </div>

      {/* Main Focus Card */}
      <div className="p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Linked Task Selector */}
        <div className="max-w-sm mx-auto">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Focusing On</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={isRunning}
            className="w-full text-xs bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground font-medium focus:outline-hidden"
          >
            <option value="">General Focus / Deep Work</option>
            {tasks
              .filter((t) => t.status !== 'completed')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </div>

        {/* Big Timer Display */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-secondary"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-primary transition-all duration-300"
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progress) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black tracking-tight text-foreground font-mono">
                {formattedTime}
              </span>
              <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-2">
                {isRunning ? 'IN SESSION' : 'READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Duration Selectors */}
        <div className="flex items-center justify-center gap-2">
          {[
            { label: '25m Pomodoro', mins: 25 },
            { label: '50m Deep Work', mins: 50 },
            { label: '90m Ultradian', mins: 90 },
          ].map((item) => (
            <button
              key={item.mins}
              onClick={() => handleSelectDuration(item.mins)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedDuration === item.mins
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleTimer}
            className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleSessionComplete}
            title="Complete early"
            className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:bg-secondary transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Focus History */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recent Focus Sessions ({focusSessions.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {focusSessions.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">No sessions recorded yet.</div>
          ) : (
            focusSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{session.duration_minutes} mins</span>
                  {session.notes && <span className="text-muted-foreground">· {session.notes}</span>}
                </div>
                <span className="text-emerald-500 font-semibold uppercase text-[10px]">Completed</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
