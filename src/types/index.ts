export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'inbox' | 'todo' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type EventCategory = 'task_block' | 'routine' | 'meeting' | 'focus' | 'break' | 'personal' | 'class';

export type HabitFrequency = 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  timezone: string;
  work_start_time: string;
  work_end_time: string;
  daily_intention?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  status: 'active' | 'archived' | 'completed' | 'on_hold';
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id?: string | null;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  due_date?: string | null; // YYYY-MM-DD
  due_time?: string | null; // HH:mm
  estimated_duration: number; // minutes
  actual_duration: number; // minutes
  recurrence_rule?: string | null;
  notes?: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  tags?: Tag[];
  // Joined or runtime properties
  project?: Project;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  task_id?: string | null;
  project_id?: string | null;
  title: string;
  description?: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  is_all_day: boolean;
  color: string;
  category: EventCategory;
  location?: string;
  is_completed: boolean;
  recurrence_rule?: string | null;
  created_at: string;
  updated_at: string;
  // Joined or runtime
  task?: Task;
  project?: Project;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  target_days: number;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  project_id?: string | null;
  title: string;
  content: string;
  color?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  project?: Project;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string | null;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  status: 'completed' | 'cancelled' | 'in_progress';
  notes?: string;
  created_at: string;
  task?: Task;
}

export interface DailyReview {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  tasks_completed_count: number;
  focus_minutes_total: number;
  habits_completed_count: number;
  what_went_well?: string;
  what_didnt_get_done?: string;
  action_for_tomorrow?: string;
  rating?: number; // 1-5
  created_at: string;
}
