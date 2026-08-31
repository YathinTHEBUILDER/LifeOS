import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/notifications/server-push';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendPushToUser(
      supabase,
      user.id,
      {
        title: 'LifeOS notifications are working.',
        body: 'Your device is connected and ready to receive schedule reminders.',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: `test-notif-${Date.now()}`,
        data: {
          url: '/settings',
          type: 'test',
          priority: 'normal',
        },
      },
      {
        createInAppRecord: true,
        priority: 'normal',
        idempotencyKey: `test:${user.id}:${Date.now()}`,
      }
    );

    return NextResponse.json({
      success: result.success,
      devicesAttempted: result.devicesAttempted,
      devicesSucceeded: result.devicesSucceeded,
      devicesFailed: result.devicesFailed,
      errors: result.errors,
      message: result.devicesAttempted > 0
        ? `Test notification sent to ${result.devicesSucceeded} of ${result.devicesAttempted} registered device(s).`
        : 'No active push devices registered for this account. Enable notifications on this device first.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send test notification' }, { status: 500 });
  }
}
