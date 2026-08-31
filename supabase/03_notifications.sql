-- ============================================================================
-- 03_NOTIFICATIONS.SQL - PRODUCTION NOTIFICATION SYSTEM SCHEMA
-- ============================================================================

-- 1. NOTIFICATION PREFERENCES TABLE
create table if not exists public.notification_preferences (
  user_id uuid references auth.users on delete cascade primary key,
  notifications_enabled boolean default true not null,
  upcoming_events boolean default true not null,
  event_reminder_timing integer default 15 not null, -- in minutes: 5, 10, 15, 30, 60
  task_reminders boolean default true not null,
  task_due_soon boolean default true not null,
  next_activity boolean default true not null,
  next_activity_timing integer default 15 not null, -- in minutes: 5, 10, 15, 30
  daily_planning boolean default false not null,
  daily_planning_time text default '07:30' not null,
  focus_reminders boolean default true not null,
  habit_reminders boolean default false not null,
  quiet_hours_enabled boolean default true not null,
  quiet_hours_start text default '22:00' not null,
  quiet_hours_end text default '07:00' not null,
  smart_free_time boolean default false not null,
  missed_tasks boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. NOTIFICATION DEVICES TABLE
create table if not exists public.notification_devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  device_type text default 'desktop' check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  browser text default 'unknown',
  device_label text default 'Browser',
  endpoint text not null unique,
  subscription_data jsonb not null,
  enabled boolean default true not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. NOTIFICATION DELIVERIES TABLE (Idempotency & Audit Logs)
create table if not exists public.notification_deliveries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  device_id uuid references public.notification_devices on delete cascade,
  idempotency_key text not null,
  notification_type text not null,
  scheduled_for timestamp with time zone not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'sent' check (status in ('sent', 'failed', 'skipped_quiet_hours', 'skipped_completed', 'skipped_deleted')),
  failure_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, idempotency_key)
);

-- 4. NOTIFICATIONS (In-app history) column updates if missing
alter table public.notifications add column if not exists priority text default 'normal' check (priority in ('low', 'normal', 'high'));
alter table public.notifications add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.notifications add column if not exists read_at timestamp with time zone;

-- 5. INDEXES FOR FAST QUERYING
create index if not exists idx_notif_pref_user on public.notification_preferences(user_id);
create index if not exists idx_notif_devices_user on public.notification_devices(user_id);
create index if not exists idx_notif_devices_endpoint on public.notification_devices(endpoint);
create index if not exists idx_notif_deliveries_user_key on public.notification_deliveries(user_id, idempotency_key);
create index if not exists idx_notif_user_created on public.notifications(user_id, created_at desc);

-- 6. ENABLE ROW LEVEL SECURITY
alter table public.notification_preferences enable row level security;
alter table public.notification_devices enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notifications enable row level security;

-- 7. RLS POLICIES
-- Drop existing policies if needed to avoid conflicts
drop policy if exists "Users manage own notification_preferences" on public.notification_preferences;
create policy "Users manage own notification_preferences" on public.notification_preferences 
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own notification_devices" on public.notification_devices;
create policy "Users manage own notification_devices" on public.notification_devices 
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own notification_deliveries" on public.notification_deliveries;
create policy "Users manage own notification_deliveries" on public.notification_deliveries 
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications" on public.notifications 
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
