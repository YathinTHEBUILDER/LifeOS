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
  Plus,
  Flame,
  ArrowRight,
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
  } = usePlanner();

  const [search, setSearch] = useState('');

  // Keyboard shortcut listener for Cmd+K and global navigation keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <div className="fixed inset-0 z-50 apple-sheet-backdrop flex items-start justify-center pt-24 p-4">
      <div className="absolute inset-0" onClick={() => setIsCommandPaletteOpen(false)} />

      <div className="relative w-full max-w-xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Box */}
        <div className="p-3.5 border-b border-border/80 flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
          <input
            type="text"
            placeholder="Search commands, tasks, projects, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full text-sm bg-transparent border-0 focus:outline-hidden text-foreground placeholder:text-muted-foreground/60"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* Quick Actions */}
          <div>
            <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </div>
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => handleAction(() => openQuickAdd('task'))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>New Task</span>
                </div>
                <kbd className="text-[10px] text-muted-foreground font-mono">Q</kbd>
              </button>

              <button
                onClick={() => handleAction(() => openQuickAdd('event'))}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Schedule Event</span>
                </div>
              </button>

              <button
                onClick={() => handleAction(() => planMyDay())}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Plan Day</span>
                </div>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </div>
            <div className="grid grid-cols-2 gap-0.5 mt-0.5">
              {[
                { name: 'Today', path: '/', key: 'T' },
                { name: 'Calendar', path: '/calendar', key: 'C' },
                { name: 'Tasks', path: '/tasks', key: '' },
                { name: 'Focus', path: '/focus', key: 'F' },
                { name: 'Habits', path: '/habits', key: '' },
                { name: 'Projects', path: '/projects', key: '' },
                { name: 'Notes', path: '/notes', key: '' },
                { name: 'Review', path: '/review', key: '' },
              ].map((nav) => (
                <button
                  key={nav.path}
                  onClick={() => handleNavigate(nav.path)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors text-left"
                >
                  <span>{nav.name}</span>
                  {nav.key && <kbd className="text-[10px] text-muted-foreground font-mono">{nav.key}</kbd>}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks Result */}
          {filteredTasks.length > 0 && query && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tasks
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleNavigate('/tasks')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors text-left"
                  >
                    <span className="truncate">{task.title}</span>
                    <span className="text-[10px] text-muted-foreground capitalize shrink-0 ml-2">
                      {task.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects Result */}
          {filteredProjects.length > 0 && query && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Projects
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNavigate('/projects')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors text-left"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize shrink-0 ml-2">
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes Result */}
          {filteredNotes.length > 0 && query && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNavigate('/notes')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors text-left"
                  >
                    <span className="truncate">{n.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
