-- ============================================================================
-- 05_REALTIME.SQL - ENABLE SUPABASE REALTIME FOR LIFEOS TABLES
-- ============================================================================

-- Safely add all LifeOS user-facing tables to the supabase_realtime publication
DO $$
BEGIN
  -- 1. Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  -- 2. Projects
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;

  -- 3. Tags
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tags') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
  END IF;

  -- 4. Tasks
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;

  -- 5. Task Subtasks
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'task_subtasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_subtasks;
  END IF;

  -- 6. Task Tags Junction
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'task_tags') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_tags;
  END IF;

  -- 7. Events (Calendar & Time Blocks)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;

  -- 8. Habits
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
  END IF;

  -- 9. Habit Logs
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habit_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs;
  END IF;

  -- 10. Notes
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;

  -- 11. Focus Sessions
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'focus_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;
  END IF;

  -- 12. Daily Reviews
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'daily_reviews') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reviews;
  END IF;
END $$;
