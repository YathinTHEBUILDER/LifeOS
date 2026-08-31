'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Trash2,
  CalendarPlus,
  Sparkles,
  Search,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { Priority, TaskStatus, Task } from '@/types';
import confetti from 'canvas-confetti';
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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all'
        ? true
        : selectedStatus === 'completed'
        ? t.status === 'completed'
        : selectedStatus === 'pending'
        ? t.status !== 'completed'
        : t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' ? true : t.priority === selectedPriority;
    const matchesProject = selectedProjectId === 'all' ? true : t.project_id === selectedProjectId;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const handleToggle = (id: string, currentStatus: string) => {
    toggleTaskCompletion(id);
    if (currentStatus !== 'completed') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
      });
      toast.success('Task marked completed!');
    }
  };

  const handleScheduleToday = (taskId: string) => {
    const now = new Date();
    scheduleTaskAsEvent(taskId, now.toISOString());
    toast.success('Scheduled task into Today timeline');
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Task Master</h1>
            <p className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.status === 'completed').length} completed ·{' '}
              {tasks.filter((t) => t.status !== 'completed').length} pending
            </p>
          </div>
        </div>

        <button
          onClick={() => openQuickAdd('task')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
        {/* Search */}
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-secondary/50 border border-border rounded-xl focus:outline-hidden text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="todo">Todo</option>
            <option value="scheduled">Scheduled</option>
            <option value="inbox">Inbox</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent 🔥</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Project Filter */}
        <div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border text-xs text-muted-foreground space-y-2">
            <CheckSquare className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">No tasks match your filters</p>
            <p>Try clearing your search or add a new task.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                  isCompleted
                    ? 'bg-secondary/30 border-border opacity-70'
                    : 'bg-card border-border hover:border-primary/40 shadow-xs'
                }`}
              >
                {/* Checkbox and Task Title */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Priority Tag */}
                      {task.priority !== 'none' && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-500/10 text-rose-500'
                              : task.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-500'
                              : task.priority === 'medium'
                              ? 'bg-sky-500/10 text-sky-500'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}

                      {/* Project Tag */}
                      {task.project && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            backgroundColor: `${task.project.color}15`,
                            color: task.project.color,
                          }}
                        >
                          {task.project.name}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {task.estimated_duration}m est.
                      </span>

                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {task.due_date}
                        </span>
                      )}

                      {task.subtasks && task.subtasks.length > 0 && (
                        <span>
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!isCompleted && (
                    <button
                      onClick={() => handleScheduleToday(task.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Block Time</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      deleteTask(task.id);
                      toast.success('Task removed');
                    }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
