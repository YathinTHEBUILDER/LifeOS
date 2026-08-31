'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckSquare,
  Calendar,
  FolderKanban,
  FileText,
  Timer,
  Sparkles,
  Flame,
  Plus,
  ArrowRight,
  X,
} from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';

export function CommandPalette() {
  const router = useRouter();
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    tasks,
    projects,
    events,
    notes,
    openQuickAdd,
    planMyDay,
    replanMyDay,
  } = usePlanner();

  const [search, setSearch] = useState('');

  // Keyboard shortcut listener for Cmd+K and global navigation keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      } else if (!isInput) {
        if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          openQuickAdd('task');
        } else if (e.key === 't' || e.key === 'T') {
          router.push('/');
        } else if (e.key === 'c' || e.key === 'C') {
          router.push('/calendar');
        } else if (e.key === 'f' || e.key === 'F') {
          router.push('/focus');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, openQuickAdd, router]);

  if (!isCommandPaletteOpen) return null;

  const query = search.toLowerCase().trim();

  // Filtered lists
  const filteredTasks = tasks.filter((t) => t.title.toLowerCase().includes(query)).slice(0, 4);
  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 3);
  const filteredEvents = events.filter((e) => e.title.toLowerCase().includes(query)).slice(0, 3);
  const filteredNotes = notes.filter((n) => n.title.toLowerCase().includes(query)).slice(0, 3);

  const handleNavigate = (path: string) => {
    setIsCommandPaletteOpen(false);
    setSearch('');
    router.push(path);
  };

  const handleAction = (action: () => void) => {
    setIsCommandPaletteOpen(false);
    setSearch('');
    action();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-card w-full max-w-xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Box */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Type a command, task, project, note, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full text-sm bg-transparent border-0 focus:outline-hidden text-foreground placeholder:text-muted-foreground/60"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">ESC</kbd>
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4 flex-1">
          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="space-y-1 mt-1">
              <button
                onClick={() => handleAction(() => openQuickAdd('task'))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Create new task</span>
                </div>
                <kbd className="text-[10px] text-muted-foreground font-mono">Q</kbd>
              </button>

              <button
                onClick={() => handleAction(() => openQuickAdd('event'))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>Schedule event or time block</span>
                </div>
              </button>

              <button
                onClick={() => handleAction(() => planMyDay())}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Plan My Day automatically</span>
                </div>
              </button>

              <button
                onClick={() => handleNavigate('/focus')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 text-emerald-500" />
                  <span>Start a Focus Timer Session</span>
                </div>
                <kbd className="text-[10px] text-muted-foreground font-mono">F</kbd>
              </button>
            </div>
          </div>

          {/* Tasks Results */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tasks
              </div>
              <div className="space-y-1 mt-1">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleNavigate('/tasks')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <CheckSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          task.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground'
                        }`}
                      />
                      <span className={`truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                    {task.project && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ backgroundColor: `${task.project.color}20`, color: task.project.color }}
                      >
                        {task.project.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects Results */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Projects
              </div>
              <div className="space-y-1 mt-1">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNavigate('/projects')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="w-3.5 h-3.5" style={{ color: p.color }} />
                      <span>{p.name}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes Results */}
          {filteredNotes.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </div>
              <div className="space-y-1 mt-1">
                {filteredNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNavigate('/notes')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{n.title}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-secondary/30 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1 py-0.5 rounded bg-card border border-border font-mono">T</kbd> Today
            <kbd className="px-1 py-0.5 rounded bg-card border border-border font-mono">C</kbd> Calendar
            <kbd className="px-1 py-0.5 rounded bg-card border border-border font-mono">F</kbd> Focus
          </div>
          <span>LifeOS Intelligence</span>
        </div>
      </div>
    </div>
  );
}
