'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Task,
  Project,
  CalendarEvent,
  Habit,
  HabitLog,
  Note,
  FocusSession,
  DailyReview,
  UserProfile,
  Subtask,
  Priority,
  TaskStatus,
  EventCategory,
} from '@/types';
import { createClient } from '@/lib/supabase/client';
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface PlannerContextType {
  // Data
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  habits: Habit[];
  habitLogs: HabitLog[];
  notes: Note[];
  focusSessions: FocusSession[];
  dailyReviews: DailyReview[];
  profile: UserProfile;
  isSupabaseConnected: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Task Actions
  addTask: (task: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;

  // Event & Time-Blocking Actions
  addEvent: (event: Partial<CalendarEvent> & { title: string; start_time: string; end_time: string }) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  scheduleTaskAsEvent: (taskId: string, startTime: string, durationMinutes?: number) => CalendarEvent | null;
  toggleEventCompletion: (id: string) => void;

  // Project Actions
  addProject: (project: Partial<Project> & { name: string }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Habit Actions
  addHabit: (habit: Partial<Habit> & { name: string }) => Habit;
  toggleHabitForDate: (habitId: string, date: string) => void;
  deleteHabit: (id: string) => void;
  getHabitStreak: (habitId: string) => number;

  // Note Actions
  addNote: (note: Partial<Note> & { title: string; content: string }) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Focus Session Actions
  logFocusSession: (session: { taskId?: string | null; durationMinutes: number; notes?: string }) => void;

  // Daily Planning & Replanning
  planMyDay: (targetDate?: string) => void;
  replanMyDay: (lostMinutes: number) => void;
  updateDailyIntention: (intention: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  saveDailyReview: (review: Partial<DailyReview> & { date: string }) => void;

  // Auth
  signOut: () => Promise<void>;

  // Quick Global Add Modal Control
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  quickAddDefaultTab: 'task' | 'event' | 'note' | 'habit';
  setQuickAddDefaultTab: (tab: 'task' | 'event' | 'note' | 'habit') => void;
  openQuickAdd: (tab?: 'task' | 'event' | 'note' | 'habit') => void;

  // Command Palette Control
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'life_os_planner_';

const DEFAULT_PROFILE: UserProfile = {
  id: 'user-default-1',
  email: 'user@example.com',
  full_name: 'Alex Johnson',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
  work_start_time: '09:00',
  work_end_time: '18:00',
  daily_intention: 'Focus on shipping InvoiceFlow MVP and completing the database assignment.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Real UUIDs are required once records need to sync to Supabase's `uuid` columns.
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [dailyReviews, setDailyReviews] = useState<DailyReview[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Effective owner id for any record created right now: the real authenticated
  // user when signed in via Supabase, otherwise the local demo profile id.
  const effectiveUserId = userId || profile.id;

  // Global dialog states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<'task' | 'event' | 'note' | 'habit'>('task');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize seed data if empty (used for the anonymous, local-only demo experience)
  const initSeedData = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = new Date();

    const seedProjects: Project[] = [
      {
        id: 'proj-1',
        user_id: DEFAULT_PROFILE.id,
        name: 'College',
        description: 'Semester coursework & assignments',
        color: '#3B82F6',
        icon: 'GraduationCap',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'proj-2',
        user_id: DEFAULT_PROFILE.id,
        name: 'InvoiceFlow',
        description: 'Next.js Invoicing SaaS product build',
        color: '#6366F1',
        icon: 'Layers',
        status: 'active',
        deadline: format(addDays(today, 14), 'yyyy-MM-dd'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'proj-3',
        user_id: DEFAULT_PROFILE.id,
        name: 'Personal & Health',
        description: 'Fitness routines & daily habits',
        color: '#10B981',
        icon: 'Heart',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const seedTasks: Task[] = [
      {
        id: 'task-1',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-1',
        title: 'Database Systems assignment submission',
        description: 'Complete SQL query optimization chapter and submit PDF.',
        priority: 'high',
        status: 'scheduled',
        due_date: todayStr,
        due_time: '12:00',
        estimated_duration: 90,
        actual_duration: 0,
        subtasks: [
          { id: 'sub-1', task_id: 'task-1', user_id: DEFAULT_PROFILE.id, title: 'Write queries for problem 4', completed: true, sort_order: 1, created_at: new Date().toISOString() },
          { id: 'sub-2', task_id: 'task-1', user_id: DEFAULT_PROFILE.id, title: 'Review explain plan results', completed: false, sort_order: 2, created_at: new Date().toISOString() },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-2',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-2',
        title: 'Implement Stripe webhook handler in InvoiceFlow',
        description: 'Verify checkout.session.completed event and update subscription table.',
        priority: 'urgent',
        status: 'scheduled',
        due_date: todayStr,
        due_time: '16:30',
        estimated_duration: 90,
        actual_duration: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-3',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-1',
        title: 'Python Lab Assignment 3',
        description: 'Write binary search tree and tree traversal functions.',
        priority: 'medium',
        status: 'todo',
        due_date: format(addDays(today, 1), 'yyyy-MM-dd'),
        estimated_duration: 60,
        actual_duration: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-4',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-3',
        title: 'Evening gym leg workout',
        description: 'Squats, lunges, and calf raises.',
        priority: 'medium',
        status: 'scheduled',
        due_date: todayStr,
        due_time: '18:00',
        estimated_duration: 60,
        actual_duration: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-5',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-2',
        title: 'Design pricing cards responsive layout',
        description: 'Support monthly and annual billing toggles with discount tags.',
        priority: 'low',
        status: 'inbox',
        due_date: format(addDays(today, 3), 'yyyy-MM-dd'),
        estimated_duration: 45,
        actual_duration: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Helper to format ISO time for today
    const makeTodayIso = (hours: number, minutes: number) => {
      const d = new Date(today);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    };

    const seedEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-1',
        title: 'Database Systems Lecture',
        start_time: makeTodayIso(10, 30),
        end_time: makeTodayIso(12, 0),
        is_all_day: false,
        color: '#3B82F6',
        category: 'class',
        location: 'Hall B / Zoom',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'event-2',
        user_id: DEFAULT_PROFILE.id,
        title: 'Lunch & Break',
        start_time: makeTodayIso(12, 30),
        end_time: makeTodayIso(13, 30),
        is_all_day: false,
        color: '#F59E0B',
        category: 'break',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'event-3',
        user_id: DEFAULT_PROFILE.id,
        task_id: 'task-1',
        project_id: 'proj-1',
        title: 'Focus Block: Database Assignment',
        start_time: makeTodayIso(14, 0),
        end_time: makeTodayIso(15, 30),
        is_all_day: false,
        color: '#6366F1',
        category: 'task_block',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'event-4',
        user_id: DEFAULT_PROFILE.id,
        task_id: 'task-2',
        project_id: 'proj-2',
        title: 'Deep Work: InvoiceFlow Webhooks',
        start_time: makeTodayIso(16, 0),
        end_time: makeTodayIso(17, 30),
        is_all_day: false,
        color: '#8B5CF6',
        category: 'focus',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'event-5',
        user_id: DEFAULT_PROFILE.id,
        task_id: 'task-4',
        project_id: 'proj-3',
        title: 'Gym — Strength Training',
        start_time: makeTodayIso(18, 0),
        end_time: makeTodayIso(19, 0),
        is_all_day: false,
        color: '#10B981',
        category: 'routine',
        location: 'Equinox Gym',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const seedHabits: Habit[] = [
      {
        id: 'habit-1',
        user_id: DEFAULT_PROFILE.id,
        name: 'Morning Hydration & Sunlight',
        description: 'Drink 500ml water and 10 mins outdoor sunlight',
        frequency: 'daily',
        target_days: 7,
        color: '#38BDF8',
        icon: 'Sun',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'habit-2',
        user_id: DEFAULT_PROFILE.id,
        name: 'Read 20 pages',
        description: 'System design and engineering books',
        frequency: 'daily',
        target_days: 7,
        color: '#818CF8',
        icon: 'BookOpen',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'habit-3',
        user_id: DEFAULT_PROFILE.id,
        name: 'Daily 45m Exercise',
        description: 'Strength training or cardio',
        frequency: 'weekdays',
        target_days: 5,
        color: '#34D399',
        icon: 'Dumbbell',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'habit-4',
        user_id: DEFAULT_PROFILE.id,
        name: 'Evening Shutdown & Review',
        description: 'Clear desk, review tomorrow schedule, 10:30 PM bed',
        frequency: 'daily',
        target_days: 7,
        color: '#F472B6',
        icon: 'Moon',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const seedHabitLogs: HabitLog[] = [
      { id: 'log-1', habit_id: 'habit-1', user_id: DEFAULT_PROFILE.id, date: todayStr, completed: true, created_at: new Date().toISOString() },
      { id: 'log-2', habit_id: 'habit-1', user_id: DEFAULT_PROFILE.id, date: format(subDays(today, 1), 'yyyy-MM-dd'), completed: true, created_at: new Date().toISOString() },
      { id: 'log-3', habit_id: 'habit-1', user_id: DEFAULT_PROFILE.id, date: format(subDays(today, 2), 'yyyy-MM-dd'), completed: true, created_at: new Date().toISOString() },
      { id: 'log-4', habit_id: 'habit-2', user_id: DEFAULT_PROFILE.id, date: format(subDays(today, 1), 'yyyy-MM-dd'), completed: true, created_at: new Date().toISOString() },
    ];

    const seedNotes: Note[] = [
      {
        id: 'note-1',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-2',
        title: 'InvoiceFlow Architecture Notes',
        content: `### Architecture Plan
- Next.js App Router with Server Actions
- Supabase Auth + Row-Level Security
- Stripe webhook signature verification on edge
- PDF generator using standard serverless canvas`,
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'note-2',
        user_id: DEFAULT_PROFILE.id,
        project_id: 'proj-1',
        title: 'DB Indexing Quick Cheatsheet',
        content: `B-tree indexes are optimal for equality and range queries. Always index foreign keys and composite filters (user_id, status, start_time).`,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const seedFocusSessions: FocusSession[] = [
      {
        id: 'focus-1',
        user_id: DEFAULT_PROFILE.id,
        task_id: 'task-2',
        start_time: makeTodayIso(9, 0),
        end_time: makeTodayIso(9, 45),
        duration_minutes: 45,
        status: 'completed',
        notes: 'Deep focus on webhook signature verification tests.',
        created_at: new Date().toISOString(),
      },
    ];

    setProjects(seedProjects);
    setTasks(seedTasks);
    setEvents(seedEvents);
    setHabits(seedHabits);
    setHabitLogs(seedHabitLogs);
    setNotes(seedNotes);
    setFocusSessions(seedFocusSessions);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}projects`, JSON.stringify(seedProjects));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}tasks`, JSON.stringify(seedTasks));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}events`, JSON.stringify(seedEvents));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}habits`, JSON.stringify(seedHabits));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}habitLogs`, JSON.stringify(seedHabitLogs));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}notes`, JSON.stringify(seedNotes));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}focusSessions`, JSON.stringify(seedFocusSessions));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}profile`, JSON.stringify(DEFAULT_PROFILE));
    }
  };

  // Save changes to localStorage (acts as the offline cache/fallback for every mode)
  const saveToLocal = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(data));
      } catch (err) {
        console.error('LocalStorage write failed:', err);
      }
    }
  };

  // --------------------------------------------------------------------------
  // SUPABASE SYNC LAYER
  // --------------------------------------------------------------------------
  // Pulls every table for the signed-in user and replaces local state + cache.
  const fetchAllFromSupabase = async (uid: string) => {
    if (!supabase) return;
    try {
      const [
        profileRes,
        projectsRes,
        tasksRes,
        subtasksRes,
        eventsRes,
        habitsRes,
        habitLogsRes,
        notesRes,
        focusRes,
        reviewsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('projects').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('task_subtasks').select('*').eq('user_id', uid).order('sort_order', { ascending: true }),
        supabase.from('events').select('*').eq('user_id', uid).order('start_time', { ascending: true }),
        supabase.from('habits').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('*').eq('user_id', uid),
        supabase.from('notes').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('focus_sessions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('daily_reviews').select('*').eq('user_id', uid),
      ]);

      const subtasksByTask = new Map<string, Subtask[]>();
      ((subtasksRes.data as Subtask[]) || []).forEach((s) => {
        const list = subtasksByTask.get(s.task_id) || [];
        list.push(s);
        subtasksByTask.set(s.task_id, list);
      });

      const fetchedTasks = ((tasksRes.data as Task[]) || []).map((t) => ({
        ...t,
        subtasks: subtasksByTask.get(t.id) || [],
      }));
      const fetchedProjects = (projectsRes.data as Project[]) || [];
      const fetchedEvents = (eventsRes.data as CalendarEvent[]) || [];
      const fetchedHabits = (habitsRes.data as Habit[]) || [];
      const fetchedHabitLogs = (habitLogsRes.data as HabitLog[]) || [];
      const fetchedNotes = (notesRes.data as Note[]) || [];
      const fetchedFocus = (focusRes.data as FocusSession[]) || [];
      const fetchedReviews = (reviewsRes.data as DailyReview[]) || [];

      if (profileRes.data) setProfile(profileRes.data as UserProfile);
      setProjects(fetchedProjects);
      setTasks(fetchedTasks);
      setEvents(fetchedEvents);
      setHabits(fetchedHabits);
      setHabitLogs(fetchedHabitLogs);
      setNotes(fetchedNotes);
      setFocusSessions(fetchedFocus);
      setDailyReviews(fetchedReviews);

      // Cache cloud data locally so it's available instantly (and offline) next load
      if (profileRes.data) saveToLocal('profile', profileRes.data);
      saveToLocal('projects', fetchedProjects);
      saveToLocal('tasks', fetchedTasks);
      saveToLocal('events', fetchedEvents);
      saveToLocal('habits', fetchedHabits);
      saveToLocal('habitLogs', fetchedHabitLogs);
      saveToLocal('notes', fetchedNotes);
      saveToLocal('focusSessions', fetchedFocus);
      saveToLocal('dailyReviews', fetchedReviews);
    } catch (err) {
      console.error('Failed to fetch data from Supabase:', err);
      toast.error('Failed to load your data from the cloud. Showing cached data instead.');
    }
  };

  // Fire-and-forget write helpers. Local state/localStorage is already updated
  // optimistically by the caller before these run, so a failure here just means
  // "saved locally, not yet synced" rather than a lost write.
  const syncInsert = async (table: string, row: Record<string, any>) => {
    if (!supabase || !isAuthenticated) return;
    try {
      const { error } = await supabase.from(table).insert(row);
      if (error) throw error;
    } catch (err) {
      console.error(`Supabase insert into "${table}" failed:`, err);
      toast.error("Saved locally, but couldn't sync to the cloud.");
    }
  };

  const syncUpdate = async (table: string, id: string, updates: Record<string, any>) => {
    if (!supabase || !isAuthenticated) return;
    try {
      const { error } = await supabase.from(table).update(updates).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(`Supabase update on "${table}" failed:`, err);
      toast.error("Saved locally, but couldn't sync your changes to the cloud.");
    }
  };

  const syncDelete = async (table: string, id: string) => {
    if (!supabase || !isAuthenticated) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(`Supabase delete from "${table}" failed:`, err);
      toast.error("Deleted locally, but couldn't sync the deletion to the cloud.");
    }
  };

  // Subtasks live in their own table — full-replace on every task save is simple and safe for small lists.
  const syncSubtasksForTask = async (taskId: string, subtasks: Subtask[] | undefined) => {
    if (!supabase || !isAuthenticated || subtasks === undefined) return;
    try {
      const { error: deleteError } = await supabase.from('task_subtasks').delete().eq('task_id', taskId);
      if (deleteError) throw deleteError;
      if (subtasks.length > 0) {
        const rows = subtasks.map((s, idx) => ({
          id: s.id,
          task_id: taskId,
          user_id: effectiveUserId,
          title: s.title,
          completed: s.completed,
          sort_order: s.sort_order ?? idx,
        }));
        const { error: insertError } = await supabase.from('task_subtasks').insert(rows);
        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Failed to sync subtasks:', err);
      toast.error("Couldn't sync subtasks to the cloud.");
    }
  };

  // Load on initial mount: local cache first (instant UI), then cloud data if signed in.
  useEffect(() => {
    let isMounted = true;

    const loadLocalCache = () => {
      try {
        if (typeof window !== 'undefined') {
          const savedProjects = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}projects`);
          const savedTasks = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}tasks`);
          const savedEvents = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}events`);
          const savedHabits = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}habits`);
          const savedHabitLogs = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}habitLogs`);
          const savedNotes = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}notes`);
          const savedFocus = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}focusSessions`);
          const savedReviews = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}dailyReviews`);
          const savedProfile = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}profile`);

          if (savedTasks && savedEvents) {
            if (savedProjects) setProjects(JSON.parse(savedProjects));
            setTasks(JSON.parse(savedTasks));
            setEvents(JSON.parse(savedEvents));
            if (savedHabits) setHabits(JSON.parse(savedHabits));
            if (savedHabitLogs) setHabitLogs(JSON.parse(savedHabitLogs));
            if (savedNotes) setNotes(JSON.parse(savedNotes));
            if (savedFocus) setFocusSessions(JSON.parse(savedFocus));
            if (savedReviews) setDailyReviews(JSON.parse(savedReviews));
            if (savedProfile) setProfile(JSON.parse(savedProfile));
          } else {
            initSeedData();
          }
        }
      } catch (e) {
        console.error('Error loading stored planner state:', e);
        initSeedData();
      }
    };

    const init = async () => {
      loadLocalCache();

      if (supabase) {
        setIsSupabaseConnected(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (isMounted && user) {
            setUserId(user.id);
            setIsAuthenticated(true);
            await fetchAllFromSupabase(user.id);
          }
        } catch (err) {
          console.error('Error checking Supabase auth session:', err);
        }
      }

      if (isMounted) setIsLoading(false);
    };

    init();

    let authSubscription: { unsubscribe: () => void } | undefined;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUserId(session.user.id);
          setIsAuthenticated(true);
          setIsLoading(true);
          await fetchAllFromSupabase(session.user.id);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setIsAuthenticated(false);
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserId(null);
    setIsAuthenticated(false);
    toast.success('Signed out');
  };

  // --------------------------------------------------------------------------
  // TASK ACTIONS
  // --------------------------------------------------------------------------
  const addTask = (taskData: Partial<Task> & { title: string }): Task => {
    const newTask: Task = {
      id: generateId(),
      user_id: effectiveUserId,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      due_date: taskData.due_date || format(new Date(), 'yyyy-MM-dd'),
      due_time: taskData.due_time || null,
      estimated_duration: taskData.estimated_duration || 30,
      actual_duration: 0,
      project_id: taskData.project_id || null,
      subtasks: taskData.subtasks || [],
      notes: taskData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => {
      const updated = [newTask, ...prev];
      saveToLocal('tasks', updated);
      return updated;
    });

    const { subtasks, tags, project, ...dbTask } = newTask;
    syncInsert('tasks', dbTask);
    if (subtasks && subtasks.length > 0) {
      syncSubtasksForTask(newTask.id, subtasks);
    }

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
      saveToLocal('tasks', updated);
      return updated;
    });

    const { subtasks, tags, project, ...dbUpdates } = updates;
    if (Object.keys(dbUpdates).length > 0) {
      syncUpdate('tasks', id, { ...dbUpdates, updated_at: new Date().toISOString() });
    }
    if (subtasks !== undefined) {
      syncSubtasksForTask(id, subtasks);
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveToLocal('tasks', updated);
      return updated;
    });
    // Remove linked event blocks if any
    setEvents((prev) => {
      const updated = prev.filter((e) => e.task_id !== id);
      saveToLocal('events', updated);
      return updated;
    });

    if (supabase && isAuthenticated) {
      (async () => {
        try {
          const { error: eventsError } = await supabase.from('events').delete().eq('task_id', id);
          if (eventsError) throw eventsError;
          const { error: taskError } = await supabase.from('tasks').delete().eq('id', id);
          if (taskError) throw taskError;
        } catch (err) {
          console.error('Failed to delete task from Supabase:', err);
          toast.error("Deleted locally, but couldn't sync the deletion to the cloud.");
        }
      })();
    }
  };

  const toggleTaskCompletion = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const isDone = task.status === 'completed';
    const newStatus: TaskStatus = isDone ? 'todo' : 'completed';
    const completedAt = isDone ? null : new Date().toISOString();

    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, status: newStatus, completed_at: completedAt, updated_at: new Date().toISOString() } : t
      );
      saveToLocal('tasks', updated);
      return updated;
    });

    // Also toggle matching event completion if linked
    setEvents((prev) => {
      const updated = prev.map((e) => {
        if (e.task_id === id) {
          return { ...e, is_completed: !e.is_completed, updated_at: new Date().toISOString() };
        }
        return e;
      });
      saveToLocal('events', updated);
      return updated;
    });

    syncUpdate('tasks', id, { status: newStatus, completed_at: completedAt, updated_at: new Date().toISOString() });

    const linkedEvent = events.find((e) => e.task_id === id);
    if (linkedEvent) {
      syncUpdate('events', linkedEvent.id, { is_completed: !linkedEvent.is_completed, updated_at: new Date().toISOString() });
    }
  };

  // --------------------------------------------------------------------------
  // EVENT & TIME-BLOCKING ACTIONS
  // --------------------------------------------------------------------------
  const addEvent = (
    eventData: Partial<CalendarEvent> & { title: string; start_time: string; end_time: string }
  ): CalendarEvent => {
    const newEvent: CalendarEvent = {
      id: generateId(),
      user_id: effectiveUserId,
      title: eventData.title,
      description: eventData.description || '',
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      is_all_day: eventData.is_all_day || false,
      color: eventData.color || '#6366F1',
      category: eventData.category || 'task_block',
      location: eventData.location || '',
      task_id: eventData.task_id || null,
      project_id: eventData.project_id || null,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEvents((prev) => {
      const updated = [...prev, newEvent].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      saveToLocal('events', updated);
      return updated;
    });

    const { task, project, ...dbEvent } = newEvent;
    syncInsert('events', dbEvent);

    // If linked to a task, update task status to scheduled
    if (eventData.task_id) {
      updateTask(eventData.task_id, { status: 'scheduled' });
    }

    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e));
      saveToLocal('events', updated);
      return updated;
    });

    const { task, project, ...dbUpdates } = updates;
    syncUpdate('events', id, { ...dbUpdates, updated_at: new Date().toISOString() });
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveToLocal('events', updated);
      return updated;
    });
    syncDelete('events', id);
  };

  const scheduleTaskAsEvent = (taskId: string, startTime: string, durationMinutes?: number): CalendarEvent | null => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const duration = durationMinutes || task.estimated_duration || 45;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    const targetProject = projects.find((p) => p.id === task.project_id);

    const event = addEvent({
      title: task.title,
      description: task.description,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      task_id: task.id,
      project_id: task.project_id,
      color: targetProject?.color || '#6366F1',
      category: 'task_block',
    });

    updateTask(taskId, {
      status: 'scheduled',
      due_date: format(start, 'yyyy-MM-dd'),
      due_time: format(start, 'HH:mm'),
    });

    return event;
  };

  const toggleEventCompletion = (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    const nextCompleted = !event.is_completed;
    updateEvent(id, { is_completed: nextCompleted });

    if (event.task_id) {
      updateTask(event.task_id, {
        status: nextCompleted ? 'completed' : 'todo',
        completed_at: nextCompleted ? new Date().toISOString() : null,
      });
    }
  };

  // --------------------------------------------------------------------------
  // PROJECT ACTIONS
  // --------------------------------------------------------------------------
  const addProject = (projectData: Partial<Project> & { name: string }): Project => {
    const newProject: Project = {
      id: generateId(),
      user_id: effectiveUserId,
      name: projectData.name,
      description: projectData.description || '',
      color: projectData.color || '#6366F1',
      icon: projectData.icon || 'Folder',
      status: 'active',
      deadline: projectData.deadline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProjects((prev) => {
      const updated = [...prev, newProject];
      saveToLocal('projects', updated);
      return updated;
    });

    syncInsert('projects', newProject);

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
      saveToLocal('projects', updated);
      return updated;
    });
    syncUpdate('projects', id, { ...updates, updated_at: new Date().toISOString() });
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToLocal('projects', updated);
      return updated;
    });
    syncDelete('projects', id);
  };

  // --------------------------------------------------------------------------
  // HABIT ACTIONS
  // --------------------------------------------------------------------------
  const addHabit = (habitData: Partial<Habit> & { name: string }): Habit => {
    const newHabit: Habit = {
      id: generateId(),
      user_id: effectiveUserId,
      name: habitData.name,
      description: habitData.description || '',
      frequency: habitData.frequency || 'daily',
      target_days: habitData.target_days || 7,
      color: habitData.color || '#10B981',
      icon: habitData.icon || 'CheckCircle',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setHabits((prev) => {
      const updated = [...prev, newHabit];
      saveToLocal('habits', updated);
      return updated;
    });

    const { logs, ...dbHabit } = newHabit;
    syncInsert('habits', dbHabit);

    return newHabit;
  };

  const toggleHabitForDate = (habitId: string, date: string) => {
    const existing = habitLogs.find((log) => log.habit_id === habitId && log.date === date);

    if (existing) {
      setHabitLogs((prev) => {
        const updated = prev.filter((log) => log.id !== existing.id);
        saveToLocal('habitLogs', updated);
        return updated;
      });
      syncDelete('habit_logs', existing.id);
    } else {
      const newLog: HabitLog = {
        id: generateId(),
        habit_id: habitId,
        user_id: effectiveUserId,
        date,
        completed: true,
        created_at: new Date().toISOString(),
      };
      setHabitLogs((prev) => {
        const updated = [...prev, newLog];
        saveToLocal('habitLogs', updated);
        return updated;
      });
      syncInsert('habit_logs', newLog);
    }
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveToLocal('habits', updated);
      return updated;
    });
    // Clean up orphaned logs locally too (the DB cascades this automatically via FK)
    setHabitLogs((prev) => {
      const updated = prev.filter((l) => l.habit_id !== id);
      saveToLocal('habitLogs', updated);
      return updated;
    });
    syncDelete('habits', id);
  };

  const getHabitStreak = (habitId: string): number => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 60; i++) {
      const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
      const isLogged = habitLogs.some((l) => l.habit_id === habitId && l.date === dateStr && l.completed);
      if (isLogged) {
        streak++;
      } else if (i === 0) {
        // If not completed today yet, check if yesterday was completed without breaking streak
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  // --------------------------------------------------------------------------
  // NOTE ACTIONS
  // --------------------------------------------------------------------------
  const addNote = (noteData: Partial<Note> & { title: string; content: string }): Note => {
    const newNote: Note = {
      id: generateId(),
      user_id: effectiveUserId,
      project_id: noteData.project_id || null,
      title: noteData.title,
      content: noteData.content,
      color: noteData.color || '#F8FAFC',
      is_pinned: noteData.is_pinned || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotes((prev) => {
      const updated = [newNote, ...prev];
      saveToLocal('notes', updated);
      return updated;
    });

    const { project, ...dbNote } = newNote;
    syncInsert('notes', dbNote);

    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n));
      saveToLocal('notes', updated);
      return updated;
    });

    const { project, ...dbUpdates } = updates;
    syncUpdate('notes', id, { ...dbUpdates, updated_at: new Date().toISOString() });
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveToLocal('notes', updated);
      return updated;
    });
    syncDelete('notes', id);
  };

  // --------------------------------------------------------------------------
  // FOCUS ACTIONS
  // --------------------------------------------------------------------------
  const logFocusSession = (session: { taskId?: string | null; durationMinutes: number; notes?: string }) => {
    const newSession: FocusSession = {
      id: generateId(),
      user_id: effectiveUserId,
      task_id: session.taskId || null,
      start_time: new Date(Date.now() - session.durationMinutes * 60000).toISOString(),
      end_time: new Date().toISOString(),
      duration_minutes: session.durationMinutes,
      status: 'completed',
      notes: session.notes || '',
      created_at: new Date().toISOString(),
    };

    setFocusSessions((prev) => {
      const updated = [newSession, ...prev];
      saveToLocal('focusSessions', updated);
      return updated;
    });

    const { task, ...dbSession } = newSession;
    syncInsert('focus_sessions', dbSession);

    // Update actual duration on task if linked
    if (session.taskId) {
      const task = tasks.find((t) => t.id === session.taskId);
      if (task) {
        updateTask(session.taskId, {
          actual_duration: (task.actual_duration || 0) + session.durationMinutes,
        });
      }
    }
  };

  // --------------------------------------------------------------------------
  // DAILY PLANNING & REPLANNING
  // --------------------------------------------------------------------------
  const planMyDay = (targetDate?: string) => {
    const dateStr = targetDate || format(new Date(), 'yyyy-MM-dd');
    const dayTasks = tasks.filter(
      (t) => (t.due_date === dateStr || t.status === 'todo') && t.status !== 'completed' && t.status !== 'cancelled'
    );

    // Existing events for today
    const dayEvents = events.filter((e) => {
      try {
        return isSameDay(parseISO(e.start_time), parseISO(dateStr));
      } catch {
        return false;
      }
    });

    // Simple intelligent slot finder starting from 09:00 to 18:00
    let currentHour = 9;
    let currentMinute = 0;

    const baseDate = new Date(dateStr);

    dayTasks.slice(0, 4).forEach((task) => {
      const isAlreadyScheduled = dayEvents.some((e) => e.task_id === task.id);
      if (isAlreadyScheduled) return;

      const duration = task.estimated_duration || 45;

      const start = new Date(baseDate);
      start.setHours(currentHour, currentMinute, 0, 0);

      const end = new Date(start.getTime() + duration * 60000);

      scheduleTaskAsEvent(task.id, start.toISOString(), duration);

      // Increment clock + 15 min buffer
      const nextTime = new Date(end.getTime() + 15 * 60000);
      currentHour = nextTime.getHours();
      currentMinute = nextTime.getMinutes();
    });
  };

  const replanMyDay = (lostMinutes: number) => {
    const now = new Date();
    const changedEvents: { id: string; start_time: string; end_time: string }[] = [];

    setEvents((prev) => {
      const updated = prev.map((e) => {
        const eventStart = new Date(e.start_time);
        // Only shift future, non-completed, flexible task blocks
        if (
          isSameDay(eventStart, now) &&
          eventStart > now &&
          !e.is_completed &&
          (e.category === 'task_block' || e.category === 'focus')
        ) {
          const newStart = new Date(eventStart.getTime() + lostMinutes * 60000);
          const newEnd = new Date(new Date(e.end_time).getTime() + lostMinutes * 60000);
          changedEvents.push({ id: e.id, start_time: newStart.toISOString(), end_time: newEnd.toISOString() });
          return {
            ...e,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return e;
      });
      saveToLocal('events', updated);
      return updated;
    });

    changedEvents.forEach(({ id, start_time, end_time }) => {
      syncUpdate('events', id, { start_time, end_time, updated_at: new Date().toISOString() });
    });
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
      saveToLocal('profile', updated);
      return updated;
    });
    if (supabase && isAuthenticated) {
      syncUpdate('profiles', effectiveUserId, { ...updates, updated_at: new Date().toISOString() });
    }
  };

  const updateDailyIntention = (intention: string) => {
    updateProfile({ daily_intention: intention });
  };

  const saveDailyReview = (reviewData: Partial<DailyReview> & { date: string }) => {
    const existing = dailyReviews.find((r) => r.date === reviewData.date);
    const newReview: DailyReview = existing
      ? { ...existing, ...reviewData }
      : {
          id: generateId(),
          user_id: effectiveUserId,
          date: reviewData.date,
          tasks_completed_count: reviewData.tasks_completed_count || 0,
          focus_minutes_total: reviewData.focus_minutes_total || 0,
          habits_completed_count: reviewData.habits_completed_count || 0,
          what_went_well: reviewData.what_went_well || '',
          what_didnt_get_done: reviewData.what_didnt_get_done || '',
          action_for_tomorrow: reviewData.action_for_tomorrow || '',
          rating: reviewData.rating || 5,
          created_at: new Date().toISOString(),
        };

    setDailyReviews((prev) => {
      const updated = existing ? prev.map((r) => (r.date === reviewData.date ? newReview : r)) : [...prev, newReview];
      saveToLocal('dailyReviews', updated);
      return updated;
    });

    if (supabase && isAuthenticated) {
      (async () => {
        try {
          const { error } = await supabase.from('daily_reviews').upsert(newReview, { onConflict: 'user_id,date' });
          if (error) throw error;
        } catch (err) {
          console.error('Failed to sync daily review:', err);
          toast.error("Couldn't sync your daily review to the cloud.");
        }
      })();
    }
  };

  const openQuickAdd = (tab: 'task' | 'event' | 'note' | 'habit' = 'task') => {
    setQuickAddDefaultTab(tab);
    setIsQuickAddOpen(true);
  };

  // Hydrate runtime joins (task.project, event.task, event.project)
  const hydratedTasks = useMemo(() => {
    return tasks.map((t) => ({
      ...t,
      project: projects.find((p) => p.id === t.project_id),
    }));
  }, [tasks, projects]);

  const hydratedEvents = useMemo(() => {
    return events.map((e) => ({
      ...e,
      task: tasks.find((t) => t.id === e.task_id),
      project: projects.find((p) => p.id === e.project_id),
    }));
  }, [events, tasks, projects]);

  const value = {
    tasks: hydratedTasks,
    projects,
    events: hydratedEvents,
    habits,
    habitLogs,
    notes,
    focusSessions,
    dailyReviews,
    profile,
    isSupabaseConnected,
    isAuthenticated,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    addEvent,
    updateEvent,
    deleteEvent,
    scheduleTaskAsEvent,
    toggleEventCompletion,
    addProject,
    updateProject,
    deleteProject,
    addHabit,
    toggleHabitForDate,
    deleteHabit,
    getHabitStreak,
    addNote,
    updateNote,
    deleteNote,
    logFocusSession,
    planMyDay,
    replanMyDay,
    updateDailyIntention,
    updateProfile,
    saveDailyReview,
    signOut,
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddDefaultTab,
    setQuickAddDefaultTab,
    openQuickAdd,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}
