'use client';

import React, { useState } from 'react';
import { X, CheckSquare, Calendar, FileText, Flame, Plus, Clock, Flag, Folder } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { Priority, EventCategory, HabitFrequency } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDuration, setTaskDuration] = useState<number>(30);
  const [taskDueDate, setTaskDueDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [taskProjectId, setTaskProjectId] = useState<string>('');

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState('14:00');
  const [eventEndTime, setEventEndTime] = useState('15:00');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventCategory, setEventCategory] = useState<EventCategory>('task_block');
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

  if (!isQuickAddOpen) return null;

  const handleClose = () => {
    setIsQuickAddOpen(false);
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
      project_id: taskProjectId || null,
    });

    toast.success(`Task "${taskTitle}" created`);
    setTaskTitle('');
    setTaskDescription('');
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
      location: eventLocation.trim(),
      project_id: taskProjectId || null,
    });

    toast.success(`Event "${eventTitle}" scheduled`);
    setEventTitle('');
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

    toast.success(`Note "${noteTitle}" saved`);
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
      target_days: habitTarget,
    });

    toast.success(`Habit "${habitName}" added`);
    setHabitName('');
    setHabitDesc('');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-1 bg-secondary/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('task')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'task' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Task
            </button>
            <button
              onClick={() => setActiveTab('event')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'event' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Event
            </button>
            <button
              onClick={() => setActiveTab('note')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'note' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Note
            </button>
            <button
              onClick={() => setActiveTab('habit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'habit' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Habit
            </button>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TASK FORM */}
          {activeTab === 'task' && (
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Task title (e.g. Finish math problem set)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-semibold bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              <div>
                <textarea
                  placeholder="Add notes, context or requirements..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-secondary/40 border border-border/70 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  >
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent 🔥</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Estimated Duration</label>
                  <select
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(Number(e.target.value))}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  />
                </div>

                {/* Project */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Project</label>
                  <select
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  >
                    <option value="">No Project (General)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          )}

          {/* EVENT FORM */}
          {activeTab === 'event' && (
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Event title (e.g. Algorithms Lecture)"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-semibold bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  >
                    <option value="task_block">Time Block</option>
                    <option value="routine">Routine</option>
                    <option value="meeting">Meeting</option>
                    <option value="class">Class</option>
                    <option value="focus">Focus Session</option>
                    <option value="break">Break</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Start Time</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">End Time</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Location / Link (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 or Zoom link"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          )}

          {/* NOTE FORM */}
          {activeTab === 'note' && (
            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-semibold bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              <div>
                <textarea
                  placeholder="Capture thoughts, markdown notes, ideas..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="w-full text-xs bg-secondary/40 border border-border/70 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notePinned}
                    onChange={(e) => setNotePinned(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Pin Note to Top
                </label>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* HABIT FORM */}
          {activeTab === 'habit' && (
            <form onSubmit={handleHabitSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Habit name (e.g. 10m Meditation)"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  autoFocus
                  required
                  className="w-full text-base font-semibold bg-transparent border-0 focus:outline-hidden placeholder:text-muted-foreground/60 text-foreground"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Brief description / motivation"
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Frequency</label>
                  <select
                    value={habitFreq}
                    onChange={(e) => setHabitFreq(e.target.value as HabitFrequency)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Target Days / Week</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={habitTarget}
                    onChange={(e) => setHabitTarget(Number(e.target.value))}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Save Habit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
