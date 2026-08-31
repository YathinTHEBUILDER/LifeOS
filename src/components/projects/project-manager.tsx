'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { toast } from 'sonner';

export function ProjectManager() {
  const { projects, tasks, addProject, deleteProject } = usePlanner();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#0071e3');
  const [deadline, setDeadline] = useState('');

  const colors = ['#0071e3', '#34c759', '#ff9500', '#ff2d55', '#af52de', '#5856d6'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      name: name.trim(),
      description: desc.trim(),
      color,
      deadline: deadline || undefined,
    });

    toast.success(`Project "${name}" created`);
    setName('');
    setDesc('');
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects.length} active
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-card border border-border/60 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">No projects yet</p>
          <p className="text-muted-foreground text-[11px]">Group your tasks and goals into focus areas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.project_id === project.id);
          const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
          const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

          return (
            <div
              key={project.id}
              className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col justify-between space-y-4 hover:bg-secondary/20 transition-colors group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color || '#0071e3' }} />
                    <span className="text-[11px] font-medium text-muted-foreground capitalize">
                      {project.status}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      deleteProject(project.id);
                      toast.success('Project deleted');
                    }}
                    aria-label="Delete project"
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-foreground tracking-tight">{project.name}</h3>
                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: project.color || '#0071e3' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span>
                    {completedCount} of {projectTasks.length} tasks done
                  </span>
                  {project.deadline && <span>Due {project.deadline}</span>}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* New Project Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">New Project</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Description</label>
                <textarea
                  placeholder="Goals or context..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1.5">Color</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-foreground/20' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Target Date</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-normal text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs"
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
