import webpush from 'web-push';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  NotificationDevice,
  PushPayload,
  NotificationPriority,
  InAppNotification,
} from '@/types/notifications';

// Initialize VAPID details once
let vapidInitialized = false;
export function initVapid() {
  if (vapidInitialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:notifications@lifeos.app';

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
  }
}

export interface SendPushOptions {
  idempotencyKey?: string;
  createInAppRecord?: boolean;
  priority?: NotificationPriority;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface PushDeliveryResult {
  success: boolean;
  devicesAttempted: number;
  devicesSucceeded: number;
  devicesFailed: number;
  errors: string[];
}

/**
 * Send push notification to a specific device
 */
export async function sendPushToDevice(
  supabase: SupabaseClient,
  device: NotificationDevice,
  payload: PushPayload,
  options?: SendPushOptions
): Promise<{ success: boolean; error?: string }> {
  initVapid();

  const subscription = {
    endpoint: device.endpoint,
    keys: {
      p256dh: device.subscription_data.keys.p256dh,
      auth: device.subscription_data.keys.auth,
    },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));

    // Update device last_seen_at
    await supabase
      .from('notification_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', device.id);

    return { success: true };
  } catch (err: any) {
    const statusCode = err.statusCode || (err.response && err.response.status);
    const errorMessage = err.message || 'Push delivery failed';

    // If subscription is expired or unregistered, deactivate or remove it
    if (statusCode === 404 || statusCode === 410) {
      console.warn(`Device ${device.id} subscription expired (${statusCode}), deactivating...`);
      await supabase
        .from('notification_devices')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq('id', device.id);
    }

    return { success: false, error: `${statusCode || 'Error'}: ${errorMessage}` };
  }
}

/**
 * Send push notification to all active devices of a user and record in-app history + delivery audit
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
  options?: SendPushOptions
): Promise<PushDeliveryResult> {
  initVapid();

  const result: PushDeliveryResult = {
    success: false,
    devicesAttempted: 0,
    devicesSucceeded: 0,
    devicesFailed: 0,
    errors: [],
  };

  const idempotencyKey = options?.idempotencyKey || `manual:${userId}:${Date.now()}`;
  const scheduledFor = options?.scheduledFor ? options.scheduledFor.toISOString() : new Date().toISOString();
  const notificationType = payload.data.type || 'info';

  // 1. Check idempotency: if already delivered, skip to avoid spam
  if (options?.idempotencyKey) {
    const { data: existingDelivery } = await supabase
      .from('notification_deliveries')
      .select('id, status')
      .eq('user_id', userId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingDelivery && existingDelivery.status === 'sent') {
      return {
        success: true,
        devicesAttempted: 0,
        devicesSucceeded: 0,
        devicesFailed: 0,
        errors: ['Already delivered (idempotency key matched)'],
      };
    }
  }

  // 2. Fetch all enabled devices for user
  const { data: devices, error: deviceError } = await supabase
    .from('notification_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true);

  if (deviceError) {
    result.errors.push(`Failed to fetch devices: ${deviceError.message}`);
  }

  const activeDevices: NotificationDevice[] = (devices as any) || [];
  result.devicesAttempted = activeDevices.length;

  let primaryDeviceId: string | null = null;
  let hasSuccessfulPush = false;

  for (const device of activeDevices) {
    const sendRes = await sendPushToDevice(supabase, device, payload, options);
    if (sendRes.success) {
      result.devicesSucceeded++;
      hasSuccessfulPush = true;
      if (!primaryDeviceId) primaryDeviceId = device.id;
    } else {
      result.devicesFailed++;
      if (sendRes.error) result.errors.push(sendRes.error);
    }
  }

  result.success = hasSuccessfulPush || activeDevices.length === 0;

  // 3. Create In-App Notification entry (if requested or default true)
  if (options?.createInAppRecord !== false) {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: payload.title,
        message: payload.body,
        type: notificationType,
        priority: options?.priority || 'normal',
        is_read: false,
        link: payload.data.url || '/',
        metadata: options?.metadata || payload.data,
      });
    } catch (err: any) {
      console.error('Failed to create in-app notification record:', err);
    }
  }

  // 4. Record delivery in notification_deliveries table
  try {
    await supabase.from('notification_deliveries').upsert(
      {
        user_id: userId,
        device_id: primaryDeviceId,
        idempotency_key: idempotencyKey,
        notification_type: notificationType,
        scheduled_for: scheduledFor,
        sent_at: new Date().toISOString(),
        status: result.success ? 'sent' : 'failed',
        failure_reason: result.errors.length > 0 ? result.errors.join('; ') : null,
      },
      { onConflict: 'user_id, idempotency_key' }
    );
  } catch (err: any) {
    console.error('Failed to record delivery audit log:', err);
  }

  return result;
}
