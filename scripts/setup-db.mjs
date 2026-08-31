import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgmyvnstigxfbhpbzgwy.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbXl2bnN0aWd4ZmJocGJ6Z3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE1MDk0MSwiZXhwIjoyMTAzNzI2OTQxfQ.hP6daeZFxeisQf0RUH1pDAfdUZg-xiDmaEAJiawtVuM';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export async function checkTables() {
  const tables = ['profiles', 'projects', 'tasks', 'events', 'habits', 'notes', 'focus_sessions', 'daily_reviews'];
  const results = {};
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    results[table] = error ? `Not created (${error.message})` : 'Ready';
  }
  console.table(results);
}

checkTables();
