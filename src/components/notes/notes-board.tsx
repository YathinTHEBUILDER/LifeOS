'use client';

import React, { useState } from 'react';
import { Plus, Pin, Trash2, Search } from 'lucide-react';
import { usePlanner } from '@/lib/store/planner-context';
import { Note } from '@/types';
import { toast } from 'sonner';

export function NotesBoard() {
  const { notes, deleteNote, updateNote, openQuickAdd } = usePlanner();
  const [search, setSearch] = useState('');

  const filteredNotes = notes.filter(
    (n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const otherNotes = filteredNotes.filter((n) => !n.is_pinned);

  const togglePin = (note: Note) => {
    updateNote(note.id, { is_pinned: !note.is_pinned });
    toast.success(note.is_pinned ? 'Unpinned note' : 'Pinned note');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-secondary/50 border border-border/80 rounded-lg focus:outline-hidden text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={() => openQuickAdd('note')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 tactile-btn shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Pin className="w-3 h-3" /> Pinned
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={deleteNote} />
            ))}
          </div>
        </div>
      )}

      {/* All Other Notes */}
      <div className="space-y-2">
        {pinnedNotes.length > 0 && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</span>
        )}
        {filteredNotes.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-card border border-border/60 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">No notes found</p>
            <p>Capture thoughts, ideas, or quick references.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherNotes.map((note) => (
              <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={deleteNote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  onTogglePin: (note: Note) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border/80 flex flex-col justify-between space-y-3 group hover:bg-secondary/20 transition-colors">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground truncate flex-1">{note.title}</h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePin(note)}
              aria-label="Pin note"
              className={`p-1 rounded-md transition-colors ${
                note.is_pinned ? 'text-primary' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              aria-label="Delete note"
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed font-sans">
          {note.content}
        </p>
      </div>

      {note.project && (
        <div className="pt-2 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground font-medium">
            {note.project.name}
          </span>
        </div>
      )}
    </div>
  );
}
