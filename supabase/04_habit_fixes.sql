-- ============================================================================
-- 04_HABIT_FIXES.SQL - HABITS SYSTEM REPAIR & ENHANCEMENTS
-- ============================================================================

-- 1. Add reminder_time to habits table if not exists
alter table public.habits 
  add column if not exists reminder_time text default '09:00';

-- 2. Add excused to habit_logs table if not exists
alter table public.habit_logs 
  add column if not exists excused boolean default false not null;

-- 3. Update frequency constraint on habits table to remove obsolete 'custom'
alter table public.habits 
  drop constraint if exists habits_frequency_check;

-- Ensure any existing 'custom' rows are migrated to 'daily' before reapplying constraint
update public.habits 
  set frequency = 'daily' 
  where frequency = 'custom';

alter table public.habits 
  add constraint habits_frequency_check 
  check (frequency in ('daily', 'weekdays', 'weekly'));

-- 4. Create index on habit_logs for faster lookup by habit and date
create index if not exists idx_habit_logs_habit_date 
  on public.habit_logs(habit_id, date);
