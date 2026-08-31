'use client';

import React, { useState } from 'react';
import { FolderKanban, Plus, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { Project } from '@/types';
import { toast } from 'sonner';

export function ProjectManager() {
  const { projects, tasks, addProject, deleteProject, openQuickAdd } = usePlanner();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [deadline, setDeadline] = useState('');

  const colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      name: name.trim(),
      description: desc.trim(),
      color,
      deadline: deadline || undefined,
    });

    toast.success(`Project "${name}" created!`);
    setName('');
    setDesc('');
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Projects Hub</h1>
            <p className="text-xs text-muted-foreground">{projects.length} active strategic projects</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.project_id === project.id);
          const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
          const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

          return (
            <div
              key={project.id}
              className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {project.status}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      deleteProject(project.id);
                      toast.success('Project deleted');
                    }}
                    className="p-1 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-foreground">{project.name}</h3>
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Progress</span>
                  <span className="font-bold text-foreground">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: project.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>
                    {completedCount} / {projectTasks.length} tasks done
                  </span>
                  {project.deadline && <span>Due {project.deadline}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Create New Project</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                <textarea
                  placeholder="Goals and key outcomes..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Color Accent</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-foreground/20' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
