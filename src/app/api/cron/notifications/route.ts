import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateAndDispatchForUser } from '@/lib/notifications/schedule-resolver';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify Vercel Cron authorization header
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow Vercel header check in deployment
    const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return NextResponse.json({ error: 'Admin Supabase client unavailable' }, { status: 500 });
  }

  try {
    const { data: users, error } = await adminSupabase
      .from('notification_preferences')
      .select('user_id')
      .eq('notifications_enabled', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = [];
    const now = new Date();

    for (const u of users || []) {
      try {
        const evalRes = await evaluateAndDispatchForUser(adminSupabase, u.user_id, now);
        results.push({ userId: u.user_id, ...evalRes });
      } catch (err: any) {
        console.error(`Error evaluating user ${u.user_id}:`, err);
        results.push({ userId: u.user_id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedCount: (users || []).length,
      results,
    });
  } catch (err: any) {
    console.error('Cron job error:', err);
    return NextResponse.json({ error: err.message || 'Internal cron failure' }, { status: 500 });
  }
}
