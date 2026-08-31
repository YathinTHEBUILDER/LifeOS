'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  RecurrenceRule,
  RecurringCompletion,
  SyncQueueItem,
  RealtimeSyncStatus,
} from '@/types';
import { createClient } from '@/lib/supabase/client';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  getDay,
  getDate,
  isWeekend,
  subWeeks,
} from 'date-fns';
import { scheduleSessionReminders } from '@/lib/notifications';
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
  recurringCompletions: RecurringCompletion[];
  isSupabaseConnected: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  realtimeStatus: RealtimeSyncStatus;
  refreshData: () => Promise<void>;

  // Task Actions
  addTask: (task: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string, occurrenceDate?: string) => void;
  getExpandedTasksForDate: (dateStr: string) => Task[];

  // Event & Time-Blocking Actions
  addEvent: (event: Partial<CalendarEvent> & { title: string; start_time: string; end_time: string }) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  scheduleTaskAsEvent: (taskId: string, startTime: string, durationMinutes?: number) => CalendarEvent | null;
  toggleEventCompletion: (id: string, occurrenceDate?: string) => void;
  getExpandedEventsForRange: (startDate: Date, endDate: Date) => CalendarEvent[];

  // Project Actions
  addProject: (project: Partial<Project> & { name: string }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Habit Actions
  addHabit: (habit: Partial<Habit> & { name: string }) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  cycleHabitLogState: (habitId: string, date: string) => void;
  toggleHabitForDate: (habitId: string, date: string) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
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

  // Data Import / Export
  importData: (jsonPayload: any) => boolean;

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
  id: 'owner-default',
  email: '',
  full_name: 'Owner',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  work_start_time: '09:00',
  work_end_time: '18:00',
  daily_intention: '',
  notifications_enabled: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

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
  const [recurringCompletions, setRecurringCompletions] = useState<RecurringCompletion[]>([]);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveUserId = userId || profile.id;

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<'task' | 'event' | 'note' | 'habit'>('task');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const saveToLocal = useCallback((key: string, data: any, explicitUid?: string) => {
    const uid = explicitUid || userId;
    if (typeof window !== 'undefined' && uid) {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${uid}_${key}`, JSON.stringify(data));
      } catch (err) {
        console.error('LocalStorage write failed:', err);
      }
    }
  }, [userId]);

  const loadUserCache = (uid: string) => {
    if (typeof window === 'undefined' || !uid) return;
    try {
      const savedProjects = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_projects`);
      const savedTasks = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_tasks`);
      const savedEvents = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_events`);
      const savedHabits = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_habits`);
      const savedHabitLogs = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_habitLogs`);
      const savedNotes = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_notes`);
      const savedFocus = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_focusSessions`);
      const savedReviews = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_dailyReviews`);
      const savedRecurringCompletions = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_recurringCompletions`);
      const savedProfile = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}_profile`);

      if (savedProjects) setProjects(JSON.parse(savedProjects));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedEvents) setEvents(JSON.parse(savedEvents));
      if (savedHabits) setHabits(JSON.parse(savedHabits));
      if (savedHabitLogs) setHabitLogs(JSON.parse(savedHabitLogs));
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedFocus) setFocusSessions(JSON.parse(savedFocus));
      if (savedReviews) setDailyReviews(JSON.parse(savedReviews));
      if (savedRecurringCompletions) setRecurringCompletions(JSON.parse(savedRecurringCompletions));
      if (savedProfile) setProfile(JSON.parse(savedProfile));
    } catch (e) {
      console.error('Error loading stored user cache:', e);
    }
  };

  const enqueueSyncOperation = (table: string, op: 'insert' | 'update' | 'delete' | 'upsert', payload: any) => {
    const item: SyncQueueItem = {
      id: generateId(),
      table,
      op,
      payload,
      created_at: new Date().toISOString(),
    };
    setPendingSyncQueue((prev) => {
      const next = [...prev, item];
      saveToLocal('syncQueue', next);
      return next;
    });
  };

  const drainSyncQueue = useCallback(async () => {
    if (!supabase || !isAuthenticated) return;
    const queue = pendingSyncQueue;
    if (queue.length === 0) return;

    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.op === 'insert') {
          const { error } = await supabase.from(item.table).insert(item.payload);
          if (error) throw error;
        } else if (item.op === 'update') {
          const { id, ...updates } = item.payload;
          const { error } = await supabase.from(item.table).update(updates).eq('id', id);
          if (error) throw error;
        } else if (item.op === 'delete') {
          const { error } = await supabase.from(item.table).delete().eq('id', item.payload.id);
          if (error) throw error;
        } else if (item.op === 'upsert') {
          const { error } = await supabase.from(item.table).upsert(item.payload);
          if (error) throw error;
        }
      } catch (err) {
        console.error(`Retry sync failed for ${item.table}:`, err);
        remaining.push(item);
      }
    }

    setPendingSyncQueue(remaining);
    saveToLocal('syncQueue', remaining);
  }, [supabase, isAuthenticated, pendingSyncQueue, saveToLocal]);

  useEffect(() => {
    const handleOnline = () => {
      drainSyncQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [drainSyncQueue]);

  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeSyncStatus>('DISCONNECTED');

  const fetchAllFromSupabase = useCallback(async (uid: string) => {
    if (!supabase || !uid) return;
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
        supabase.from('projects').select('*').eq('user_id', uid),
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('task_subtasks').select('*').eq('user_id', uid).order('sort_order', { ascending: true }),
        supabase.from('events').select('*').eq('user_id', uid),
        supabase.from('habits').select('*').eq('user_id', uid),
        supabase.from('habit_logs').select('*').eq('user_id', uid),
        supabase.from('notes').select('*').eq('user_id', uid),
        supabase.from('focus_sessions').select('*').eq('user_id', uid),
        supabase.from('daily_reviews').select('*').eq('user_id', uid),
      ]);

      let rawTasks = (tasksRes.data as Task[]) || [];

      // Safe local-to-cloud migration: if server has 0 tasks on first login, migrate existing unauthenticated localStorage tasks
      if (rawTasks.length === 0 && typeof window !== 'undefined') {
        try {
          const legacySavedTasks = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}tasks`);
          if (legacySavedTasks) {
            const parsedLegacy: Task[] = JSON.parse(legacySavedTasks);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
              const toInsert = parsedLegacy.map((t) => {
                const { subtasks, tags, project, is_recurring_instance, occurrence_date, ...rest } = t;
                return {
                  ...rest,
                  user_id: uid,
                  created_at: rest.created_at || new Date().toISOString(),
                  updated_at: rest.updated_at || new Date().toISOString(),
                };
              });
              const { error: insertErr } = await supabase.from('tasks').insert(toInsert);
              if (!insertErr) {
                rawTasks = parsedLegacy.map((t) => ({ ...t, user_id: uid }));
                localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}tasks`);
              }
            }
          }
        } catch (migErr) {
          console.warn('Legacy tasks migration skipped:', migErr);
        }
      }

      const subtasksByTask = new Map<string, Subtask[]>();
      ((subtasksRes.data as Subtask[]) || []).forEach((s) => {
        const list = subtasksByTask.get(s.task_id) || [];
        list.push(s);
        subtasksByTask.set(s.task_id, list);
      });

      const fetchedTasks = rawTasks.map((t) => ({
        ...t,
        subtasks: subtasksByTask.get(t.id) || t.subtasks || [],
      }));

      if (profileRes.data) {
        setProfile(profileRes.data as UserProfile);
        saveToLocal('profile', profileRes.data, uid);
      }
      if (projectsRes.data) {
        setProjects(projectsRes.data as Project[]);
        saveToLocal('projects', projectsRes.data, uid);
      }
      setTasks(fetchedTasks);
      saveToLocal('tasks', fetchedTasks, uid);
      if (eventsRes.data) {
        setEvents(eventsRes.data as CalendarEvent[]);
        saveToLocal('events', eventsRes.data, uid);
      }
      if (habitsRes.data) {
        setHabits(habitsRes.data as Habit[]);
        saveToLocal('habits', habitsRes.data, uid);
      }
      if (habitLogsRes.data) {
        setHabitLogs(habitLogsRes.data as HabitLog[]);
        saveToLocal('habitLogs', habitLogsRes.data, uid);
      }
      if (notesRes.data) {
        setNotes(notesRes.data as Note[]);
        saveToLocal('notes', notesRes.data, uid);
      }
      if (focusRes.data) {
        setFocusSessions(focusRes.data as FocusSession[]);
        saveToLocal('focusSessions', focusRes.data, uid);
      }
      if (reviewsRes.data) {
        setDailyReviews(reviewsRes.data as DailyReview[]);
        saveToLocal('dailyReviews', reviewsRes.data, uid);
      }
    } catch (err) {
      console.error('Failed to fetch authoritative data from Supabase:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchTasksDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const [tasksRes, subtasksRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('task_subtasks').select('*').eq('user_id', uid).order('sort_order', { ascending: true }),
      ]);
      if (tasksRes.data) {
        const subtasksByTask = new Map<string, Subtask[]>();
        ((subtasksRes.data as Subtask[]) || []).forEach((s) => {
          const list = subtasksByTask.get(s.task_id) || [];
          list.push(s);
          subtasksByTask.set(s.task_id, list);
        });
        const fetchedTasks = (tasksRes.data as Task[]).map((t) => ({
          ...t,
          subtasks: subtasksByTask.get(t.id) || [],
        }));
        setTasks(fetchedTasks);
        saveToLocal('tasks', fetchedTasks, uid);
      }
    } catch (err) {
      console.error('Realtime tasks fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchEventsDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('events').select('*').eq('user_id', uid);
      if (data) {
        setEvents(data as CalendarEvent[]);
        saveToLocal('events', data, uid);
      }
    } catch (err) {
      console.error('Realtime events fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchHabitsDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('habits').select('*').eq('user_id', uid);
      if (data) {
        setHabits(data as Habit[]);
        saveToLocal('habits', data, uid);
      }
    } catch (err) {
      console.error('Realtime habits fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchHabitLogsDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('habit_logs').select('*').eq('user_id', uid);
      if (data) {
        setHabitLogs(data as HabitLog[]);
        saveToLocal('habitLogs', data, uid);
      }
    } catch (err) {
      console.error('Realtime habit_logs fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchProjectsDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('projects').select('*').eq('user_id', uid);
      if (data) {
        setProjects(data as Project[]);
        saveToLocal('projects', data, uid);
      }
    } catch (err) {
      console.error('Realtime projects fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchNotesDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('notes').select('*').eq('user_id', uid);
      if (data) {
        setNotes(data as Note[]);
        saveToLocal('notes', data, uid);
      }
    } catch (err) {
      console.error('Realtime notes fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchFocusDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('focus_sessions').select('*').eq('user_id', uid);
      if (data) {
        setFocusSessions(data as FocusSession[]);
        saveToLocal('focusSessions', data, uid);
      }
    } catch (err) {
      console.error('Realtime focus fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchReviewsDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('daily_reviews').select('*').eq('user_id', uid);
      if (data) {
        setDailyReviews(data as DailyReview[]);
        saveToLocal('dailyReviews', data, uid);
      }
    } catch (err) {
      console.error('Realtime daily_reviews fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const fetchProfileDomain = useCallback(async (uid: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (data) {
        setProfile(data as UserProfile);
        saveToLocal('profile', data, uid);
      }
    } catch (err) {
      console.error('Realtime profile fetch failed:', err);
    }
  }, [supabase, saveToLocal]);

  const refreshData = useCallback(async () => {
    if (userId) {
      await fetchAllFromSupabase(userId);
    }
  }, [userId, fetchAllFromSupabase]);

  // Centralized Realtime Subscription for all LifeOS tables
  useEffect(() => {
    if (!supabase || !isAuthenticated || !userId) {
      setRealtimeStatus('DISCONNECTED');
      return;
    }

    setRealtimeStatus('CONNECTING');

    const debounceTimers: Record<string, NodeJS.Timeout> = {};
    const triggerDebounced = (domain: string, fn: () => void) => {
      if (debounceTimers[domain]) clearTimeout(debounceTimers[domain]);
      debounceTimers[domain] = setTimeout(fn, 50);
    };

    const channel = supabase
      .channel(`planner-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('tasks', () => fetchTasksDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_subtasks', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('tasks', () => fetchTasksDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_tags' },
        () => triggerDebounced('tasks', () => fetchTasksDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('events', () => fetchEventsDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('habits', () => fetchHabitsDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_logs', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('habit_logs', () => fetchHabitLogsDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('projects', () => fetchProjectsDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('notes', () => fetchNotesDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('focus', () => fetchFocusDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_reviews', filter: `user_id=eq.${userId}` },
        () => triggerDebounced('reviews', () => fetchReviewsDomain(userId))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => triggerDebounced('profile', () => fetchProfileDomain(userId))
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('CONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error:', err);
          setRealtimeStatus('ERROR');
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('DISCONNECTED');
        }
      });

    return () => {
      Object.values(debounceTimers).forEach((t) => clearTimeout(t));
      supabase.removeChannel(channel);
    };
  }, [
    supabase,
    isAuthenticated,
    userId,
    fetchTasksDomain,
    fetchEventsDomain,
    fetchHabitsDomain,
    fetchHabitLogsDomain,
    fetchProjectsDomain,
    fetchNotesDomain,
    fetchFocusDomain,
    fetchReviewsDomain,
    fetchProfileDomain,
  ]);

  // Visibility changes (iPhone PWA backgrounding / tab switching) and network reconnection recovery
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let lastSyncTime = Date.now();

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastSyncTime > 1500) {
          lastSyncTime = now;
          fetchAllFromSupabase(userId);
        }
      }
    };

    const handleOnlineRecovery = () => {
      drainSyncQueue();
      fetchAllFromSupabase(userId);
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnlineRecovery);

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnlineRecovery);
    };
  }, [isAuthenticated, userId, drainSyncQueue, fetchAllFromSupabase]);

  const syncInsert = async (table: string, row: Record<string, any>) => {
    if (!supabase || !isAuthenticated) return;
    try {
      const { error } = await supabase.from(table).insert(row);
      if (error) throw error;
    } catch (err) {
      console.error(`Supabase insert into "${table}" failed:`, err);
      enqueueSyncOperation(table, 'insert', row);
    }
  };

  const syncUpdate = async (table: string, id: string, updates: Record<string, any>) => {
    if (!supabase || !isAuthenticated) return;
    try {
      const { error } = await supabase.from(table).update(updates).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(`Supabase update on "${table}" failed:`, err);
      enqueueSyncOperation(table, 'update', { id, ...updates });
    }
  };

  const syncDelete = async (table: string, id: string) => {
    if (!supabase || !isAuthenticated) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(`Supabase delete from "${table}" failed:`, err);
      enqueueSyncOperation(table, 'delete', { id });
    }
  };

  const syncSubtasksForTask = async (taskId: string, subtasks: Subtask[] | undefined) => {
    if (!supabase || !isAuthenticated || subtasks === undefined) return;
    try {
      await supabase.from('task_subtasks').delete().eq('task_id', taskId);
      if (subtasks.length > 0) {
        const rows = subtasks.map((s, idx) => ({
          ...s,
          task_id: taskId,
          user_id: effectiveUserId,
          sort_order: s.sort_order ?? idx,
        }));
        await supabase.from('task_subtasks').insert(rows);
      }
    } catch (err) {
      console.error('Failed to sync subtasks:', err);
    }
  };

  const initSeedData = () => {
    setProjects([]);
    setTasks([]);
    setHabits([]);
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (supabase) {
        setIsSupabaseConnected(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (isMounted) {
            if (user) {
              setUserId(user.id);
              setIsAuthenticated(true);
              loadUserCache(user.id);
              await fetchAllFromSupabase(user.id);
            } else {
              setUserId(null);
              setIsAuthenticated(false);
              setTasks([]);
              setEvents([]);
              setHabits([]);
              setProjects([]);
              setNotes([]);
              setFocusSessions([]);
              setDailyReviews([]);
            }
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
          loadUserCache(session.user.id);
          await fetchAllFromSupabase(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setIsAuthenticated(false);
          setTasks([]);
          setEvents([]);
          setHabits([]);
          setProjects([]);
          setNotes([]);
          setFocusSessions([]);
          setDailyReviews([]);
          setProfile(DEFAULT_PROFILE);
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, [supabase, fetchAllFromSupabase]);

  useEffect(() => {
    scheduleSessionReminders(events, habits);
  }, [events, habits]);

  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setUserId(null);
    setIsAuthenticated(false);
    setTasks([]);
    setProjects([]);
    setEvents([]);
    setHabits([]);
    setHabitLogs([]);
    setNotes([]);
    setFocusSessions([]);
    setDailyReviews([]);
    setProfile(DEFAULT_PROFILE);

    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(LOCAL_STORAGE_PREFIX))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
      window.location.href = '/auth/login';
    }
    toast.success('Signed out');
  };

  const isRuleActiveOnDate = (rule: RecurrenceRule, baseDateStr: string | null | undefined, targetDateStr: string): boolean => {
    if (!rule) return false;
    const target = parseISO(targetDateStr);
    const base = baseDateStr ? parseISO(baseDateStr) : target;
    if (target < base) return false;
    if (rule === 'daily') return true;
    if (rule === 'weekdays') return !isWeekend(target);
    if (rule === 'weekly') return getDay(target) === getDay(base);
    if (rule === 'monthly') return getDate(target) === getDate(base);
    return false;
  };

  const getExpandedTasksForDate = (dateStr: string): Task[] => {
    const result: Task[] = [];
    tasks.forEach((task) => {
      if (!task.recurrence_rule) {
        if (task.due_date === dateStr || (!task.due_date && dateStr === format(new Date(), 'yyyy-MM-dd') && task.status !== 'completed')) {
          result.push(task);
        }
      } else {
        const baseDate = task.due_date || task.created_at.split('T')[0];
        if (isRuleActiveOnDate(task.recurrence_rule, baseDate, dateStr)) {
          const isCompleted = recurringCompletions.some(
            (rc) => rc.item_id === task.id && rc.date === dateStr && rc.item_type === 'task' && rc.completed
          );
          result.push({
            ...task,
            id: `${task.id}_${dateStr}`,
            is_recurring_instance: true,
            occurrence_date: dateStr,
            status: isCompleted ? 'completed' : 'todo',
            completed_at: isCompleted ? dateStr : null,
          });
        }
      }
    });
    return result;
  };

  const getExpandedEventsForRange = (startDate: Date, endDate: Date): CalendarEvent[] => {
    const result: CalendarEvent[] = [];
    const days: string[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      days.push(format(curr, 'yyyy-MM-dd'));
      curr = addDays(curr, 1);
    }

    events.forEach((event) => {
      if (!event.recurrence_rule) {
        try {
          const eventStart = parseISO(event.start_time);
          if (eventStart >= startDate && eventStart <= endDate) result.push(event);
        } catch {}
      } else {
        const baseDateStr = format(parseISO(event.start_time), 'yyyy-MM-dd');
        const startTimeStr = event.start_time.split('T')[1] || '09:00:00';
        const endTimeStr = event.end_time.split('T')[1] || '10:00:00';
        days.forEach((dayStr) => {
          if (isRuleActiveOnDate(event.recurrence_rule || null, baseDateStr, dayStr)) {
            const isCompleted = recurringCompletions.some(
              (rc) => rc.item_id === event.id && rc.date === dayStr && rc.item_type === 'event' && rc.completed
            );
            result.push({
              ...event,
              id: `${event.id}_${dayStr}`,
              start_time: `${dayStr}T${startTimeStr}`,
              end_time: `${dayStr}T${endTimeStr}`,
              is_recurring_instance: true,
              occurrence_date: dayStr,
              is_completed: isCompleted,
            });
          }
        });
      }
    });
    return result;
  };

  const addTask = (taskData: Partial<Task> & { title: string }): Task => {
    const newTask: Task = {
      id: generateId(),
      user_id: effectiveUserId,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      due_date: taskData.due_date || null,
      due_time: taskData.due_time || null,
      estimated_duration: taskData.estimated_duration || 30,
      actual_duration: 0,
      recurrence_rule: taskData.recurrence_rule || null,
      notes: taskData.notes || '',
      subtasks: taskData.subtasks || [],
      tags: taskData.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => {
      const updated = [newTask, ...prev];
      saveToLocal('tasks', updated);
      return updated;
    });

    const { subtasks, tags, project, is_recurring_instance, occurrence_date, ...dbTask } = newTask;
    syncInsert('tasks', dbTask);
    if (subtasks && subtasks.length > 0) syncSubtasksForTask(newTask.id, subtasks);

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const baseId = id.includes('_') ? id.split('_')[0] : id;
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === baseId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
      saveToLocal('tasks', updated);
      return updated;
    });

    const { subtasks, tags, project, is_recurring_instance, occurrence_date, ...dbUpdates } = updates;
    if (Object.keys(dbUpdates).length > 0) syncUpdate('tasks', baseId, { ...dbUpdates, updated_at: new Date().toISOString() });
    if (subtasks !== undefined) syncSubtasksForTask(baseId, subtasks);
  };

  const deleteTask = (id: string) => {
    const baseId = id.includes('_') ? id.split('_')[0] : id;
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== baseId);
      saveToLocal('tasks', updated);
      return updated;
    });
    setEvents((prev) => {
      const updated = prev.filter((e) => e.task_id !== baseId);
      saveToLocal('events', updated);
      return updated;
    });
    if (supabase && isAuthenticated) {
      (async () => {
        try {
          await supabase.from('events').delete().eq('task_id', baseId);
          await supabase.from('tasks').delete().eq('id', baseId);
        } catch (err) {
          enqueueSyncOperation('tasks', 'delete', { id: baseId });
        }
      })();
    }
  };

  const toggleTaskCompletion = (id: string, occurrenceDate?: string) => {
    const isVirtual = id.includes('_');
    const baseId = isVirtual ? id.split('_')[0] : id;
    const task = tasks.find((t) => t.id === baseId);
    if (!task) return;

    const targetDate = occurrenceDate || (isVirtual ? id.split('_')[1] : task.due_date) || format(new Date(), 'yyyy-MM-dd');

    if (task.recurrence_rule) {
      const existing = recurringCompletions.find((rc) => rc.item_id === baseId && rc.date === targetDate && rc.item_type === 'task');
      setRecurringCompletions((prev) => {
        let updated: RecurringCompletion[];
        if (existing) updated = prev.filter((rc) => rc.id !== existing.id);
        else updated = [...prev, { id: generateId(), user_id: effectiveUserId, item_id: baseId, date: targetDate, item_type: 'task', completed: true, completed_at: new Date().toISOString() }];
        saveToLocal('recurringCompletions', updated);
        return updated;
      });
      return;
    }

    const isDone = task.status === 'completed';
    const newStatus: TaskStatus = isDone ? 'todo' : 'completed';
    const completedAt = isDone ? null : new Date().toISOString();
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === baseId ? { ...t, status: newStatus, completed_at: completedAt, updated_at: new Date().toISOString() } : t));
      saveToLocal('tasks', updated);
      return updated;
    });
    setEvents((prev) => {
      const updated = prev.map((e) => (e.task_id === baseId ? { ...e, is_completed: !isDone } : e));
      saveToLocal('events', updated);
      return updated;
    });
    syncUpdate('tasks', baseId, { status: newStatus, completed_at: completedAt, updated_at: new Date().toISOString() });
  };

  const addEvent = (eventData: Partial<CalendarEvent> & { title: string; start_time: string; end_time: string }): CalendarEvent => {
    const newEvent: CalendarEvent = {
      id: generateId(),
      user_id: effectiveUserId,
      task_id: eventData.task_id || null,
      project_id: eventData.project_id || null,
      title: eventData.title,
      description: eventData.description || '',
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      is_all_day: eventData.is_all_day || false,
      color: eventData.color || '#3B82F6',
      category: eventData.category || 'task_block',
      location: eventData.location || '',
      is_completed: false,
      recurrence_rule: eventData.recurrence_rule || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEvents((prev) => {
      const updated = [...prev, newEvent];
      saveToLocal('events', updated);
      return updated;
    });
    const { task, project, is_recurring_instance, occurrence_date, ...dbEvent } = newEvent;
    syncInsert('events', dbEvent);
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    const baseId = id.includes('_') ? id.split('_')[0] : id;
    setEvents((prev) => {
      const updated = prev.map((e) => (e.id === baseId ? { ...e, ...updates, updated_at: new Date().toISOString() } : e));
      saveToLocal('events', updated);
      return updated;
    });
    const { task, project, is_recurring_instance, occurrence_date, ...dbUpdates } = updates;
    syncUpdate('events', baseId, { ...dbUpdates, updated_at: new Date().toISOString() });
  };

  const deleteEvent = (id: string) => {
    const baseId = id.includes('_') ? id.split('_')[0] : id;
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== baseId);
      saveToLocal('events', updated);
      return updated;
    });
    syncDelete('events', baseId);
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
      color: targetProject?.color || '#0071e3',
      category: 'task_block',
    });
    updateTask(taskId, { status: 'scheduled', due_date: format(start, 'yyyy-MM-dd'), due_time: format(start, 'HH:mm') });
    return event;
  };

  const toggleEventCompletion = (id: string, occurrenceDate?: string) => {
    const isVirtual = id.includes('_');
    const baseId = isVirtual ? id.split('_')[0] : id;
    const event = events.find((e) => e.id === baseId);
    if (!event) return;
    const targetDate = occurrenceDate || (isVirtual ? id.split('_')[1] : format(parseISO(event.start_time), 'yyyy-MM-dd'));
    if (event.recurrence_rule) {
      const existing = recurringCompletions.find((rc) => rc.item_id === baseId && rc.date === targetDate && rc.item_type === 'event');
      setRecurringCompletions((prev) => {
        let updated: RecurringCompletion[];
        if (existing) updated = prev.filter((rc) => rc.id !== existing.id);
        else updated = [...prev, { id: generateId(), user_id: effectiveUserId, item_id: baseId, date: targetDate, item_type: 'event', completed: true, completed_at: new Date().toISOString() }];
        saveToLocal('recurringCompletions', updated);
        return updated;
      });
      return;
    }
    const nextCompleted = !event.is_completed;
    updateEvent(baseId, { is_completed: nextCompleted });
    if (event.task_id) {
      updateTask(event.task_id, {
        status: nextCompleted ? 'completed' : 'todo',
        completed_at: nextCompleted ? new Date().toISOString() : null,
      });
    }
  };

  const addProject = (projectData: Partial<Project> & { name: string }): Project => {
    const newProject: Project = {
      id: generateId(),
      user_id: effectiveUserId,
      name: projectData.name,
      description: projectData.description || '',
      color: projectData.color || '#0071e3',
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

  const addHabit = (habitData: Partial<Habit> & { name: string }): Habit => {
    const newHabit: Habit = {
      id: generateId(),
      user_id: effectiveUserId,
      name: habitData.name,
      description: habitData.description || '',
      frequency: habitData.frequency || 'daily',
      target_days: habitData.target_days || 7,
      color: habitData.color || '#34c759',
      icon: habitData.icon || 'CheckCircle',
      is_active: true,
      reminder_time: habitData.reminder_time || '09:00',
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

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, ...updates, updated_at: new Date().toISOString() } : h));
      saveToLocal('habits', updated);
      return updated;
    });
    const { logs, ...dbUpdates } = updates;
    syncUpdate('habits', id, { ...dbUpdates, updated_at: new Date().toISOString() });
  };

  const cycleHabitLogState = (habitId: string, date: string) => {
    const existing = habitLogs.find((log) => log.habit_id === habitId && log.date === date);

    if (!existing || (!existing.completed && !existing.excused)) {
      // Clear -> Done
      const newLog: HabitLog = {
        id: existing?.id || generateId(),
        habit_id: habitId,
        user_id: effectiveUserId,
        date,
        completed: true,
        excused: false,
        created_at: new Date().toISOString(),
      };
      setHabitLogs((prev) => {
        const filtered = prev.filter((l) => !(l.habit_id === habitId && l.date === date));
        const updated = [...filtered, newLog];
        saveToLocal('habitLogs', updated);
        return updated;
      });
      syncInsert('habit_logs', newLog);
    } else if (existing.completed && !existing.excused) {
      // Done -> Rest Day (Excused)
      const updatedLog: HabitLog = {
        ...existing,
        completed: false,
        excused: true,
      };
      setHabitLogs((prev) => {
        const updated = prev.map((l) => (l.id === existing.id ? updatedLog : l));
        saveToLocal('habitLogs', updated);
        return updated;
      });
      syncUpdate('habit_logs', existing.id, { completed: false, excused: true });
    } else {
      // Rest Day -> Clear
      setHabitLogs((prev) => {
        const updated = prev.filter((l) => l.id !== existing.id);
        saveToLocal('habitLogs', updated);
        return updated;
      });
      syncDelete('habit_logs', existing.id);
    }
  };

  const toggleHabitForDate = (habitId: string, date: string) => {
    cycleHabitLogState(habitId, date);
  };

  const archiveHabit = (id: string) => {
    updateHabit(id, { is_active: false });
  };

  const restoreHabit = (id: string) => {
    updateHabit(id, { is_active: true });
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveToLocal('habits', updated);
      return updated;
    });
    setHabitLogs((prev) => {
      const updated = prev.filter((l) => l.habit_id !== id);
      saveToLocal('habitLogs', updated);
      return updated;
    });
    syncDelete('habits', id);
  };

  const getHabitStreak = (habitId: string): number => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    const today = new Date();
    let streak = 0;

    if (habit.frequency === 'weekdays') {
      for (let i = 0; i < 180; i++) {
        const checkDate = subDays(today, i);
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const log = habitLogs.find((l) => l.habit_id === habitId && l.date === dateStr);
        const isDone = Boolean(log && log.completed && !log.excused);
        const isExcused = Boolean(log && log.excused);
        const isWeekendDay = isWeekend(checkDate);

        if (isWeekendDay) {
          if (isDone) streak++;
          continue;
        }

        if (isDone) {
          streak++;
        } else if (isExcused) {
          // Neutral rest day on weekday: does not break streak
          continue;
        } else if (i === 0) {
          // Today not done yet: do not break streak yet, check earlier days
          continue;
        } else {
          // Missed weekday: streak breaks
          break;
        }
      }
      return streak;
    }

    if (habit.frequency === 'weekly') {
      const target = habit.target_days || 1;
      for (let w = 0; w < 52; w++) {
        const weekDate = subWeeks(today, w);
        const start = startOfWeek(weekDate, { weekStartsOn: 1 });
        const end = endOfWeek(weekDate, { weekStartsOn: 1 });
        const weekLogs = habitLogs.filter((l) => {
          if (l.habit_id !== habitId) return false;
          const logDate = parseISO(l.date);
          return logDate >= start && logDate <= end;
        });

        const completedCount = weekLogs.filter((l) => l.completed && !l.excused).length;
        const excusedCount = weekLogs.filter((l) => l.excused).length;
        const effectiveTarget = Math.max(1, target - excusedCount);

        if (completedCount >= target || (excusedCount > 0 && completedCount >= effectiveTarget)) {
          streak++;
        } else if (w === 0) {
          // Current week still in progress
          continue;
        } else {
          break;
        }
      }
      return streak;
    }

    // Default: 'daily'
    for (let i = 0; i < 180; i++) {
      const checkDate = subDays(today, i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const log = habitLogs.find((l) => l.habit_id === habitId && l.date === dateStr);
      const isDone = Boolean(log && log.completed && !log.excused);
      const isExcused = Boolean(log && log.excused);

      if (isDone) {
        streak++;
      } else if (isExcused) {
        // Neutral rest day: does not increment streak, does not break streak
        continue;
      } else if (i === 0) {
        // Today not logged yet: continue to check yesterday
        continue;
      } else {
        // Missed day: streak broke
        break;
      }
    }
    return streak;
  };

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
    syncInsert('notes', newNote);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n));
      saveToLocal('notes', updated);
      return updated;
    });
    syncUpdate('notes', id, { ...updates, updated_at: new Date().toISOString() });
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveToLocal('notes', updated);
      return updated;
    });
    syncDelete('notes', id);
  };

  const logFocusSession = (session: { taskId?: string | null; durationMinutes: number; notes?: string }) => {
    const newSession: FocusSession = {
      id: generateId(),
      user_id: effectiveUserId,
      task_id: session.taskId || null,
      duration_minutes: session.durationMinutes,
      start_time: new Date(Date.now() - session.durationMinutes * 60000).toISOString(),
      end_time: new Date().toISOString(),
      status: 'completed',
      notes: session.notes || '',
      created_at: new Date().toISOString(),
    };
    setFocusSessions((prev) => {
      const updated = [newSession, ...prev];
      saveToLocal('focusSessions', updated);
      return updated;
    });
    syncInsert('focus_sessions', newSession);
    if (session.taskId) {
      const task = tasks.find((t) => t.id === session.taskId);
      if (task) updateTask(session.taskId, { actual_duration: (task.actual_duration || 0) + session.durationMinutes });
    }
  };

  const planMyDay = (targetDate?: string) => {
    const dateStr = targetDate || format(new Date(), 'yyyy-MM-dd');
    const dayTasks = tasks.filter(
      (t) => (t.due_date === dateStr || t.status === 'todo') && t.status !== 'completed' && t.status !== 'cancelled'
    );
    const dayEvents = events.filter((e) => {
      try {
        return isSameDay(parseISO(e.start_time), parseISO(dateStr));
      } catch {
        return false;
      }
    });
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
      const nextTime = new Date(end.getTime() + 15 * 60000);
      currentHour = nextTime.getHours();
      currentMinute = nextTime.getMinutes();
    });
  };

  const replanMyDay = (lostMinutes: number) => {
    const now = new Date();
    setEvents((prev) => {
      const updated = prev.map((e) => {
        const eventStart = new Date(e.start_time);
        if (isSameDay(eventStart, now) && eventStart > now && !e.is_completed && (e.category === 'task_block' || e.category === 'focus')) {
          const newStart = new Date(eventStart.getTime() + lostMinutes * 60000);
          const newEnd = new Date(new Date(e.end_time).getTime() + lostMinutes * 60000);
          return { ...e, start_time: newStart.toISOString(), end_time: newEnd.toISOString(), updated_at: new Date().toISOString() };
        }
        return e;
      });
      saveToLocal('events', updated);
      return updated;
    });
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
      saveToLocal('profile', updated);
      return updated;
    });
    if (supabase && isAuthenticated) syncUpdate('profiles', effectiveUserId, { ...updates, updated_at: new Date().toISOString() });
  };

  const updateDailyIntention = (intention: string) => updateProfile({ daily_intention: intention });

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
          await supabase.from('daily_reviews').upsert(newReview, { onConflict: 'user_id,date' });
        } catch (err) {
          enqueueSyncOperation('daily_reviews', 'upsert', newReview);
        }
      })();
    }
  };

  const importData = (payload: any): boolean => {
    try {
      if (!payload || typeof payload !== 'object') return false;
      if (Array.isArray(payload.projects)) {
        setProjects(payload.projects);
        saveToLocal('projects', payload.projects);
        payload.projects.forEach((p: Project) => syncInsert('projects', p));
      }
      if (Array.isArray(payload.tasks)) {
        setTasks(payload.tasks);
        saveToLocal('tasks', payload.tasks);
        payload.tasks.forEach((t: Task) => syncInsert('tasks', t));
      }
      if (Array.isArray(payload.events)) {
        setEvents(payload.events);
        saveToLocal('events', payload.events);
        payload.events.forEach((e: CalendarEvent) => syncInsert('events', e));
      }
      if (Array.isArray(payload.habits)) {
        setHabits(payload.habits);
        saveToLocal('habits', payload.habits);
        payload.habits.forEach((h: Habit) => syncInsert('habits', h));
      }
      if (Array.isArray(payload.notes)) {
        setNotes(payload.notes);
        saveToLocal('notes', payload.notes);
        payload.notes.forEach((n: Note) => syncInsert('notes', n));
      }
      if (payload.profile && typeof payload.profile === 'object') {
        setProfile((prev) => ({ ...prev, ...payload.profile }));
        saveToLocal('profile', { ...profile, ...payload.profile });
      }
      toast.success('Planner data imported successfully');
      return true;
    } catch (err) {
      toast.error('Invalid backup file format');
      return false;
    }
  };

  const openQuickAdd = (tab: 'task' | 'event' | 'note' | 'habit' = 'task') => {
    setQuickAddDefaultTab(tab);
    setIsQuickAddOpen(true);
  };

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
    recurringCompletions,
    isSupabaseConnected,
    isAuthenticated,
    isLoading,
    realtimeStatus,
    refreshData,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    getExpandedTasksForDate,
    addEvent,
    updateEvent,
    deleteEvent,
    scheduleTaskAsEvent,
    toggleEventCompletion,
    getExpandedEventsForRange,
    addProject,
    updateProject,
    deleteProject,
    addHabit,
    updateHabit,
    cycleHabitLogState,
    toggleHabitForDate,
    archiveHabit,
    restoreHabit,
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
    importData,
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
  if (!context) throw new Error('usePlanner must be used within a PlannerProvider');
  return context;
}
