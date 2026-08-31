'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { Priority, EventCategory, HabitFrequency, RecurrenceRule } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { HABIT_ICONS, HABIT_COLORS } from '@/components/habits/habit-constants';

export function QuickAddModal() {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddDefaultTab,
    projects,
    addTask,
    addEvent,
    addNote,
    addHabit,
  } = usePlanner();

  const [activeTab, setActiveTab] = useState<'task' | 'event' | 'note' | 'habit'>(quickAddDefaultTab);
  const [showDetails, setShowDetails] = useState(false);

  // Sync tab with default when opened
  useEffect(() => {
    if (isQuickAddOpen) {
      setActiveTab(quickAddDefaultTab);
      setShowDetails(false);
    }
  }, [isQuickAddOpen, quickAddDefaultTab]);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDuration, setTaskDuration] = useState<number>(30);
  const [taskDueDate, setTaskDueDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [taskRecurrence, setTaskRecurrence] = useState<RecurrenceRule>(null);
  const [taskProjectId, setTaskProjectId] = useState<string>('');

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState('14:00');
  const [eventEndTime, setEventEndTime] = useState('15:00');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventCategory, setEventCategory] = useState<EventCategory>('task_block');
  const [eventRecurrence, setEventRecurrence] = useState<RecurrenceRule>(null);
  const [eventLocation, setEventLocation] = useState('');

  // Note Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notePinned, setNotePinned] = useState(false);
  const [noteProjectId, setNoteProjectId] = useState('');

  // Habit Form State
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');
  const [habitTarget, setHabitTarget] = useState<number>(7);
  const [habitReminder, setHabitReminder] = useState<string>('09:00');
  const [habitIcon, setHabitIcon] = useState<string>('CheckCircle');
  const [habitColor, setHabitColor] = useState<string>('#34c759');

  if (!isQuickAddOpen) return null;

  const handleClose = () => {
    setIsQuickAddOpen(false);
    setShowDetails(false);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      estimated_duration: Number(taskDuration) || 30,
      due_date: taskDueDate || null,
      recurrence_rule: taskRecurrence,
      project_id: taskProjectId || null,
    });

    toast.success('Task added');
    setTaskTitle('');
    setTaskDescription('');
    setTaskRecurrence(null);
    handleClose();
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const startIso = new Date(`${eventDate}T${eventStartTime}:00`).toISOString();
    const endIso = new Date(`${eventDate}T${eventEndTime}:00`).toISOString();

    addEvent({
      title: eventTitle.trim(),
      start_time: startIso,
      end_time: endIso,
      category: eventCategory,
      recurrence_rule: eventRecurrence,
      location: eventLocation.trim(),
      project_id: taskProjectId || null,
    });

    toast.success('Event scheduled');
    setEventTitle('');
    setEventLocation('');
    setEventRecurrence(null);
    handleClose();
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    addNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      is_pinned: notePinned,
      project_id: noteProjectId || null,
    });

    toast.success('Note saved');
    setNoteTitle('');
    setNoteContent('');
    handleClose();
  };

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    addHabit({
      name: habitName.trim(),
      description: habitDesc.trim(),
      frequency: habitFreq,
      target_days: habitFreq === 'weekly' ? Math.min(7, Math.max(1, habitTarget)) : 7,
      reminder_time: habitReminder,
      icon: habitIcon,
      color: habitColor,
    });

    toast.success('Habit added');
    setHabitName('');
    setHabitDesc('');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-safe sm:pb-0 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200">
        {/* Header / Segmented Switcher */}
        <div className="p-3 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg">
            {(['task', 'event', 'note', 'habit'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* TASK FORM */}
          {activeTab === 'task' && (
            <form onSubmit={handleTaskSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-medium bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              {/* Progressive Disclosure Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium py-1"
                >
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showDetails ? 'Hide details' : 'Add details'}</span>
                </button>
              </div>

              {showDetails && (
                <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in-50 duration-150">
                  <textarea
                    placeholder="Notes or context..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={2}
                    className="w-full text-xs bg-secondary/40 border border-border/70 rounded-lg p-2.5 focus:outline-hidden text-foreground placeholder:text-muted-foreground/60 resize-none"
                  />

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Duration</label>
                      <select
                        value={taskDuration}
                        onChange={(e) => setTaskDuration(Number(e.target.value))}
                        className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                      >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as Priority)}
                        className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                      >
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Repeats</label>
                      <select
                        value={taskRecurrence || ''}
                        onChange={(e) => setTaskRecurrence((e.target.value || null) as RecurrenceRule)}
                        className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                      >
                        <option value="">Never</option>
                        <option value="daily">Daily</option>
                        <option value="weekdays">Every Weekday</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[11px] text-muted-foreground block mb-1">Project</label>
                      <select
                        value={taskProjectId}
                        onChange={(e) => setTaskProjectId(e.target.value)}
                        className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                      >
                        <option value="">None</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          )}

          {/* EVENT FORM */}
          {activeTab === 'event' && (
            <form onSubmit={handleEventSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Event title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-medium bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                    className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                  >
                    <option value="task_block">Time Block</option>
                    <option value="routine">Routine</option>
                    <option value="meeting">Meeting</option>
                    <option value="class">Class</option>
                    <option value="focus">Focus</option>
                    <option value="break">Break</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">End Time</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] text-muted-foreground block mb-1">Repeats</label>
                  <select
                    value={eventRecurrence || ''}
                    onChange={(e) => setEventRecurrence((e.target.value || null) as RecurrenceRule)}
                    className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                  >
                    <option value="">Never</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Every Weekday</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 or Zoom link"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
                >
                  Schedule
                </button>
              </div>
            </form>
          )}

          {/* NOTE FORM */}
          {activeTab === 'note' && (
            <form onSubmit={handleNoteSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-medium bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              <div>
                <textarea
                  placeholder="Capture thoughts or ideas..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="w-full text-xs bg-secondary/40 border border-border/70 rounded-lg p-2.5 focus:outline-hidden text-foreground placeholder:text-muted-foreground/60 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notePinned}
                    onChange={(e) => setNotePinned(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  Pin Note
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* HABIT FORM */}
          {activeTab === 'habit' && (
            <form onSubmit={handleHabitSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Habit name (e.g. Meditation)"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-medium bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Description (Optional)"
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Frequency</label>
                  <select
                    value={habitFreq}
                    onChange={(e) => setHabitFreq(e.target.value as HabitFrequency)}
                    className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Reminder Time</label>
                  <input
                    type="time"
                    value={habitReminder}
                    onChange={(e) => setHabitReminder(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden font-mono"
                  />
                </div>

                {habitFreq === 'weekly' && (
                  <div className="col-span-2 p-2.5 bg-secondary/30 rounded-xl border border-border/60 animate-in fade-in-50 duration-150">
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Target Days / Week ({habitTarget} days)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={7}
                      value={habitTarget}
                      onChange={(e) => setHabitTarget(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}
              </div>

              {/* Color Swatches */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Color</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {HABIT_COLORS.map((c) => {
                    const isSelected = habitColor === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setHabitColor(c.hex)}
                        title={c.name}
                        aria-label={`Color ${c.name}`}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Grid */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Icon</label>
                <div className="grid grid-cols-8 gap-1 max-h-28 overflow-y-auto p-1 bg-secondary/20 rounded-xl border border-border/50">
                  {HABIT_ICONS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = habitIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setHabitIcon(item.name)}
                        title={item.label}
                        aria-label={`Icon ${item.label}`}
                        className={`h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
                >
                  Add Habit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

