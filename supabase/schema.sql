-- ============================================================================
-- PERSONAL PLANNER / LIFE OS DATABASE SCHEMA
-- PostgreSQL with Supabase Row Level Security (RLS)
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  work_start_time text default '09:00',
  work_end_time text default '18:00',
  daily_intention text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 2. PROJECTS TABLE
-- ============================================================================
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text default '',
  color text default '#6366F1',
  icon text default 'Folder',
  status text default 'active' check (status in ('active', 'archived', 'completed', 'on_hold')),
  deadline date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 3. TAGS TABLE
-- ============================================================================
create table if not exists public.tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text default '#64748B',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 4. TASKS TABLE
-- ============================================================================
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_id uuid references public.projects on delete set null,
  title text not null,
  description text default '',
  priority text default 'medium' check (priority in ('none', 'low', 'medium', 'high', 'urgent')),
  status text default 'todo' check (status in ('inbox', 'todo', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  due_time text,
  estimated_duration integer default 30, -- minutes
  actual_duration integer default 0, -- minutes
  recurrence_rule text, -- e.g. 'daily', 'weekdays', 'weekly', 'monthly'
  notes text default '',
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 5. TASK SUBTASKS TABLE
-- ============================================================================
create table if not exists public.task_subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  completed boolean default false not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 6. TASK TAGS JUNCTION
-- ============================================================================
create table if not exists public.task_tags (
  task_id uuid references public.tasks on delete cascade not null,
  tag_id uuid references public.tags on delete cascade not null,
  primary key (task_id, tag_id)
);

-- ============================================================================
-- 7. CALENDAR EVENTS & TIME BLOCKS TABLE
-- ============================================================================
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete set null,
  project_id uuid references public.projects on delete set null,
  title text not null,
  description text default '',
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_all_day boolean default false not null,
  color text default '#3B82F6',
  category text default 'routine' check (category in ('task_block', 'routine', 'meeting', 'focus', 'break', 'personal', 'class')),
  location text default '',
  is_completed boolean default false not null,
  recurrence_rule text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 8. HABITS TABLE
-- ============================================================================
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text default '',
  frequency text default 'daily' check (frequency in ('daily', 'weekdays', 'weekly', 'custom')),
  target_days integer default 7, -- days per week
  color text default '#10B981',
  icon text default 'CheckCircle',
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 9. HABIT LOGS TABLE
-- ============================================================================
create table if not exists public.habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  completed boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (habit_id, date)
);

-- ============================================================================
-- 10. NOTES TABLE
-- ============================================================================
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_id uuid references public.projects on delete set null,
  title text not null,
  content text default '',
  color text default '#F8FAFC',
  is_pinned boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 11. FOCUS SESSIONS TABLE
-- ============================================================================
create table if not exists public.focus_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete set null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_minutes integer not null,
  status text default 'completed' check (status in ('completed', 'cancelled', 'in_progress')),
  notes text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 12. DAILY REVIEWS TABLE
-- ============================================================================
create table if not exists public.daily_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  tasks_completed_count integer default 0,
  focus_minutes_total integer default 0,
  habits_completed_count integer default 0,
  what_went_well text default '',
  what_didnt_get_done text default '',
  action_for_tomorrow text default '',
  rating integer check (rating between 1 and 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_project_id on public.tasks(project_id);

create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_start_time on public.events(start_time);
create index if not exists idx_events_end_time on public.events(end_time);
create index if not exists idx_events_task_id on public.events(task_id);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_focus_sessions_user_id on public.focus_sessions(user_id);
create index if not exists idx_daily_reviews_user_date on public.daily_reviews(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tags enable row level security;
alter table public.tasks enable row level security;
alter table public.task_subtasks enable row level security;
alter table public.task_tags enable row level security;
alter table public.events enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.notes enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.daily_reviews enable row level security;

-- Profiles: users can select and update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Standard isolation policies for all tables
create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own tags" on public.tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own task_subtasks" on public.task_subtasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own events" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own habit_logs" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own focus_sessions" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own daily_reviews" on public.daily_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-profile trigger on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
