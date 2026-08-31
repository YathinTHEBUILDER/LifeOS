import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateAndDispatchForUser } from '@/lib/notifications/schedule-resolver';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecretHeader = req.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;

  const isCronAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` ||
    cronSecretHeader === cronSecret
  );

  // If authorized as cron / admin, evaluate for all active users
  if (isCronAuthorized) {
    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });
    }

    const { data: users, error } = await adminSupabase
      .from('notification_preferences')
      .select('user_id')
      .eq('notifications_enabled', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = [];
    for (const u of users || []) {
      try {
        const evalRes = await evaluateAndDispatchForUser(adminSupabase, u.user_id);
        results.push({ userId: u.user_id, ...evalRes });
      } catch (err: any) {
        results.push({ userId: u.user_id, error: err.message });
      }
    }

    return NextResponse.json({ success: true, processedUsers: results.length, results });
  }

  // Otherwise, evaluate for the authenticated user
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const evalRes = await evaluateAndDispatchForUser(supabase, user.id);
    return NextResponse.json({ success: true, userId: user.id, ...evalRes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Dispatch failed' }, { status: 500 });
  }
}
