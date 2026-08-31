'use client';

import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Trash2,
  CalendarPlus,
  Search,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { format, isBefore, parseISO, startOfDay, addDays } from 'date-fns';
import { toast } from 'sonner';

export function TaskManager() {
  const {
    tasks,
    projects,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
    scheduleTaskAsEvent,
    openQuickAdd,
  } = usePlanner();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'today' | 'completed'>('pending');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const startOfToday = startOfDay(new Date());

  // Overdue tasks
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'completed' || !t.due_date) return false;
    try {
      return isBefore(parseISO(t.due_date), startOfToday);
    } catch {
      return false;
    }
  });

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProjectId === 'all' ? true : t.project_id === selectedProjectId;

    let matchesStatus = true;
    if (selectedStatus === 'pending') {
      matchesStatus = t.status !== 'completed';
    } else if (selectedStatus === 'today') {
      matchesStatus = t.due_date === todayStr && t.status !== 'completed';
    } else if (selectedStatus === 'completed') {
      matchesStatus = t.status === 'completed';
    }

    return matchesSearch && matchesProject && matchesStatus;
  });

  const handleToggle = (id: string) => {
    toggleTaskCompletion(id);
  };

  const handleRescheduleToToday = (id: string) => {
    updateTask(id, { due_date: todayStr });
    toast.success('Moved task to today');
  };

  const handleScheduleTimeBlock = (taskId: string) => {
    scheduleTaskAsEvent(taskId, new Date().toISOString());
    toast.success('Scheduled in timeline');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.filter((t) => t.status !== 'completed').length} pending
          </p>
        </div>

        <button
          onClick={() => openQuickAdd('task')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Overdue Banner (Calm, not screaming red) */}
      {overdueTasks.length > 0 && selectedStatus !== 'completed' && (
        <div className="p-3.5 rounded-xl bg-secondary/70 border border-border/80 flex items-center justify-between gap-4">
          <div className="text-xs">
            <span className="font-semibold text-foreground">
              {overdueTasks.length} {overdueTasks.length === 1 ? 'task needs' : 'tasks need'} attention
            </span>
            <span className="text-muted-foreground ml-1.5 hidden sm:inline">
              Scheduled for past dates.
            </span>
          </div>

          <button
            onClick={() => {
              overdueTasks.forEach((t) => updateTask(t.id, { due_date: todayStr }));
              toast.success(`Moved ${overdueTasks.length} tasks to today`);
            }}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Move all to today</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'today', label: 'Today' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id as any)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Project Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-secondary/50 border border-border/80 rounded-lg focus:outline-hidden text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-1.5">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-card border border-border/60 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">No tasks</p>
            <p>Nothing here yet.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = task.due_date && isBefore(parseISO(task.due_date), startOfToday) && !isCompleted;

            return (
              <div
                key={task.id}
                className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 group ${
                  isCompleted
                    ? 'bg-secondary/30 border-border/50 opacity-60'
                    : 'bg-card border-border/80 hover:bg-secondary/20'
                }`}
              >
                {/* Left check button & title */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id)}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    aria-label="Toggle completed"
                  >
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-muted-foreground/60 hover:border-primary transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs truncate ${
                          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground font-normal'
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.project && (
                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                          {task.project.name}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right metadata & quick actions */}
                <div className="flex items-center gap-2.5 shrink-0 text-xs text-muted-foreground">
                  {task.due_date && (
                    <span className={`text-[11px] ${isOverdue ? 'text-amber-500 font-medium' : ''}`}>
                      {task.due_date === todayStr ? 'Today' : task.due_date}
                    </span>
                  )}

                  {isOverdue && (
                    <button
                      onClick={() => handleRescheduleToToday(task.id)}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Move to today
                    </button>
                  )}

                  {!isCompleted && (
                    <button
                      onClick={() => handleScheduleTimeBlock(task.id)}
                      title="Schedule as Time Block"
                      className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 font-medium transition-opacity"
                    >
                      Schedule
                    </button>
                  )}

                  <button
                    onClick={() => {
                      deleteTask(task.id);
                      toast.success('Task removed');
                    }}
                    aria-label="Delete task"
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
