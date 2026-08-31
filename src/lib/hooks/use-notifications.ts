'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  isIOS,
  isStandalone,
  getNotificationPermission,
  registerServiceWorker,
  getCurrentPushSubscription,
  subscribeDeviceToPush,
  unsubscribeDeviceFromPush,
  getDevicePlatformInfo,
} from '@/lib/notifications';
import { NotificationPreferences, NotificationDevice } from '@/types/notifications';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications/constants';
import { usePlanner } from '@/lib/store/planner-context';
import { toast } from 'sonner';

export function useNotifications() {
  const { isAuthenticated, profile, updateProfile } = usePlanner();

  const [supported, setSupported] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [standaloneMode, setStandaloneMode] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [devices, setDevices] = useState<NotificationDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Initial detection
  useEffect(() => {
    setSupported(isPushSupported());
    setIosDevice(isIOS());
    setStandaloneMode(isStandalone());
    setPermission(getNotificationPermission());

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  // Fetch preferences and registered devices from API
  const fetchNotificationData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Check current subscription in browser
      const sub = await getCurrentPushSubscription();
      if (sub) {
        setIsSubscribed(true);
        setCurrentEndpoint(sub.endpoint);
      } else {
        setIsSubscribed(false);
        setCurrentEndpoint(null);
      }

      // Fetch preferences & devices in parallel
      const [prefRes, devRes] = await Promise.all([
        fetch('/api/notifications/preferences'),
        fetch('/api/notifications/devices'),
      ]);

      if (prefRes.ok) {
        const { preferences: fetchedPrefs } = await prefRes.json();
        if (fetchedPrefs) setPreferences(fetchedPrefs);
      }

      if (devRes.ok) {
        const { devices: fetchedDevices } = await devRes.json();
        if (fetchedDevices) setDevices(fetchedDevices);
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  // Enable Notifications Flow
  const enablePushNotifications = async () => {
    setIsActionLoading(true);
    try {
      // 1. Get VAPID public key
      const keyRes = await fetch('/api/notifications/vapid-public-key');
      if (!keyRes.ok) {
        throw new Error('Could not retrieve VAPID key from server');
      }
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        throw new Error('VAPID public key missing');
      }

      // 2. Request browser permission and subscribe via PushManager
      const subscription = await subscribeDeviceToPush(publicKey);
      setPermission(getNotificationPermission());

      if (!subscription) {
        if (getNotificationPermission() === 'denied') {
          toast.error('Notifications blocked by browser. Please enable permissions in site settings.');
        } else {
          toast.error('Failed to enable push notifications on this device.');
        }
        return false;
      }

      // 3. Register device with API
      const platformInfo = getDevicePlatformInfo();
      const regRes = await fetch('/api/notifications/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          ...platformInfo,
        }),
      });

      if (!regRes.ok) {
        const { error } = await regRes.json();
        throw new Error(error || 'Failed to save device registration');
      }

      // 4. Update preferences
      const updatedPrefs = { ...preferences, notifications_enabled: true };
      setPreferences(updatedPrefs);
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPrefs),
      });

      // Update planner profile state
      updateProfile({ notifications_enabled: true });

      setIsSubscribed(true);
      setCurrentEndpoint(subscription.endpoint);
      await fetchNotificationData();

      toast.success('Notifications enabled successfully!');
      return true;
    } catch (err: any) {
      console.error('Error enabling notifications:', err);
      toast.error(err.message || 'Error enabling notifications');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Disable Notifications Flow
  const disablePushNotifications = async () => {
    setIsActionLoading(true);
    try {
      // 1. Unsubscribe from browser PushManager
      await unsubscribeDeviceFromPush();

      // 2. Remove device from API if endpoint known
      if (currentEndpoint) {
        await fetch(`/api/notifications/devices?endpoint=${encodeURIComponent(currentEndpoint)}`, {
          method: 'DELETE',
        });
      }

      // 3. Update preferences
      const updatedPrefs = { ...preferences, notifications_enabled: false };
      setPreferences(updatedPrefs);
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPrefs),
      });

      updateProfile({ notifications_enabled: false });

      setIsSubscribed(false);
      setCurrentEndpoint(null);
      setPermission(getNotificationPermission());
      await fetchNotificationData();

      toast.success('Notifications disabled on this device.');
      return true;
    } catch (err: any) {
      console.error('Error disabling notifications:', err);
      toast.error('Error disabling notifications');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Update specific preferences
  const updateNotificationPreferences = async (updates: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        throw new Error('Failed to save preferences');
      }

      if ('notifications_enabled' in updates) {
        updateProfile({ notifications_enabled: updates.notifications_enabled });
      }

      toast.success('Preferences saved');
    } catch (err: any) {
      console.error('Failed to update preferences:', err);
      toast.error('Failed to save preferences');
      // Revert
      fetchNotificationData();
    }
  };

  // Send Test Notification
  const sendTestNotification = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Test notification failed');
      }

      if (data.devicesAttempted === 0) {
        toast.info('No registered devices found. Enable notifications first.');
      } else {
        toast.success(data.message || 'Test notification dispatched!');
      }
      return data;
    } catch (err: any) {
      console.error('Error sending test notification:', err);
      toast.error(err.message || 'Failed to send test notification');
      return null;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle Device Enabled State
  const toggleDevice = async (deviceId: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/notifications/devices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deviceId, enabled }),
      });

      if (!res.ok) throw new Error('Failed to update device');
      await fetchNotificationData();
      toast.success(enabled ? 'Device enabled' : 'Device disabled');
    } catch (err: any) {
      toast.error('Error updating device');
    }
  };

  // Remove Device
  const removeDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/notifications/devices?id=${deviceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove device');
      await fetchNotificationData();
      toast.success('Device removed');
    } catch (err: any) {
      toast.error('Error removing device');
    }
  };

  return {
    supported,
    iosDevice,
    standaloneMode,
    permission,
    isSubscribed,
    currentEndpoint,
    preferences,
    devices,
    isLoading,
    isActionLoading,
    enablePushNotifications,
    disablePushNotifications,
    updateNotificationPreferences,
    sendTestNotification,
    toggleDevice,
    removeDevice,
    refreshState: fetchNotificationData,
  };
}
