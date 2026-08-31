'use client';

import React, { useState } from 'react';
import { FileText, Plus, Pin, Trash2, Search } from 'lucide-react';
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
    toast.success(note.is_pinned ? 'Unpinned note' : 'Pinned note to top');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Lightweight Notes</h1>
            <p className="text-xs text-muted-foreground">Quick capture for project thoughts and references</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 bg-secondary/50 border border-border rounded-xl focus:outline-hidden text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={() => openQuickAdd('note')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" /> Pinned Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={deleteNote} />
            ))}
          </div>
        </div>
      )}

      {/* All Other Notes */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && (
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Other Notes</h3>
        )}
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border text-xs text-muted-foreground">
            No notes found. Create your first note with the button above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 group">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground truncate flex-1">{note.title}</h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePin(note)}
              className={`p-1 rounded-lg transition-colors ${
                note.is_pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-5 leading-relaxed font-mono">
          {note.content}
        </p>
      </div>

      {note.project && (
        <div className="pt-2 border-t border-border">
          <span
            className="text-[10px] px-2 py-0.5 rounded font-semibold"
            style={{ backgroundColor: `${note.project.color}15`, color: note.project.color }}
          >
            {note.project.name}
          </span>
        </div>
      )}
    </div>
  );
}
