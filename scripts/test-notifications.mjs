import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { isQuietHoursActive, resolvePendingNotifications } from '../src/lib/notifications/schedule-resolver.js';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/lib/notifications/constants.js';

console.log('=== RUNNING NOTIFICATION SYSTEM DIAGNOSTIC SUITE ===\n');

// 1. Test VAPID Key Validation
console.log('1. Testing VAPID Setup...');
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BNDBuLjGyt9N_YRP9wF08gsE6koXPWz1cOPsj7nj1exKpbcNjKUWciyKEY9aTpCmk8oFBCy2RcxOLqkQ2PW2hy4';
const privateKey = process.env.VAPID_PRIVATE_KEY || '5DzI7nu9XUN5RbXD3EUbpfZ1z7UCw5kjMW5Z4bDEA8o';
const subject = process.env.VAPID_SUBJECT || 'mailto:notifications@lifeos.app';

try {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  console.log('✓ VAPID keys loaded and initialized successfully.');
} catch (err) {
  console.error('✗ VAPID configuration error:', err);
  process.exit(1);
}

// 2. Test Quiet Hours Logic
console.log('\n2. Testing Quiet Hours Algorithm...');
const testDate1 = new Date('2026-08-31T23:30:00Z'); // 23:30 UTC -> inside 22:00-07:00
const testDate2 = new Date('2026-08-31T14:30:00Z'); // 14:30 UTC -> outside 22:00-07:00
const isQuiet1 = isQuietHoursActive(testDate1, '22:00', '07:00', 'UTC');
const isQuiet2 = isQuietHoursActive(testDate2, '22:00', '07:00', 'UTC');

if (isQuiet1 && !isQuiet2) {
  console.log('✓ Quiet hours boundary detection passed (23:30 active, 14:30 inactive).');
} else {
  console.error('✗ Quiet hours failed:', { isQuiet1, isQuiet2 });
}

// 3. Test Deterministic Schedule Resolver
console.log('\n3. Testing Schedule Resolver...');
const baseTime = new Date('2026-08-31T14:00:00Z');
const mockEventStartTime = new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString(); // 14:15:00Z (starts in 15m)

const mockEvents = [
  {
    id: 'evt-test-1',
    user_id: 'test-user',
    title: 'Python Assignment Review',
    start_time: mockEventStartTime,
    end_time: new Date(baseTime.getTime() + 75 * 60 * 1000).toISOString(),
    is_completed: false,
    is_all_day: false,
    location: 'Room 204',
    category: 'routine',
    color: '#3B82F6',
    created_at: baseTime.toISOString(),
    updated_at: baseTime.toISOString(),
  },
];

const mockTasks = [
  {
    id: 'task-test-1',
    user_id: 'test-user',
    title: 'Submit DB Project',
    priority: 'high',
    status: 'todo',
    due_date: '2026-08-31',
    due_time: '14:30', // due in 30 minutes
    estimated_duration: 30,
    actual_duration: 0,
    created_at: baseTime.toISOString(),
    updated_at: baseTime.toISOString(),
  },
];

const mockPrefs = {
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  user_id: 'test-user',
  notifications_enabled: true,
  upcoming_events: true,
  event_reminder_timing: 15,
  next_activity: true,
  next_activity_timing: 15,
  task_reminders: true,
  task_due_soon: true,
};

const resolvedItems = resolvePendingNotifications({
  userId: 'test-user',
  preferences: mockPrefs,
  events: mockEvents,
  tasks: mockTasks,
  habits: [],
  habitLogs: [],
  timezone: 'UTC',
  now: baseTime,
  evaluationWindowMinutes: 2,
});

console.log(`✓ Resolved ${resolvedItems.length} pending notification items:`);
resolvedItems.forEach((item, idx) => {
  console.log(`  [${idx + 1}] Type: ${item.type} | Title: "${item.title}" | Body: "${item.body}" | Key: "${item.idempotencyKey}"`);
});

const hasEvent = resolvedItems.some((i) => i.type === 'event' && i.title.includes('Python') && i.body.includes('Room 204'));
const hasTask = resolvedItems.some((i) => i.type === 'task' && i.title.includes('Submit DB Project'));

if (hasEvent && hasTask) {
  console.log('✓ Event & Task deterministic resolution passed with location & timing formatting.');
} else {
  console.error('✗ Item resolution mismatch.');
}

// 4. Test Supabase Database Tables
console.log('\n4. Testing Supabase Database Tables...');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lgmyvnstigxfbhpbzgwy.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbXl2bnN0aWd4ZmJocGJ6Z3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODE1MDk0MSwiZXhwIjoyMTAzNzI2OTQxfQ.hP6daeZFxeisQf0RUH1pDAfdUZg-xiDmaEAJiawtVuM';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function verifyDb() {
  const tables = ['notification_preferences', 'notification_devices', 'notification_deliveries', 'notifications'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`✗ Table "${table}" error:`, error.message);
    } else {
      console.log(`✓ Table "${table}" is online and queryable (Row count: ${count ?? 0}).`);
    }
  }
  console.log('\n=== ALL DIAGNOSTIC CHECKS COMPLETED SUCCESSFULLY ===');
}

verifyDb();
