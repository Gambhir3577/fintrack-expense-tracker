import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NotificationPreferences } from '../types';

export const isNative = Capacitor.isNativePlatform();

/**
 * Initializes notification channels for Android 8.0+
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (!isNative) return;

  try {
    await LocalNotifications.createChannel({
      id: 'fintrack_alerts',
      name: 'FinTrack Budget & Bill Alerts',
      description: 'Notifications for budget thresholds and upcoming recurring bills',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: 'default',
    });

    await LocalNotifications.createChannel({
      id: 'fintrack_daily',
      name: 'FinTrack Daily Reminders',
      description: 'Daily expense logging reminders',
      importance: 3,
      visibility: 1,
      vibration: true,
      sound: 'default',
    });
  } catch (err) {
    console.warn('Failed to create notification channels:', err);
  }
}

/**
 * Checks current notification permission
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (isNative) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } catch {
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }

  return false;
}

/**
 * Requests notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative) {
    try {
      await initializeNotificationChannels();
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('Native notification permission request failed:', err);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (err) {
      console.warn('Web notification permission request failed:', err);
      return false;
    }
  }

  return false;
}

/**
 * Sends or schedules an immediate or test notification
 */
export async function sendNotification(
  id: number,
  title: string,
  body: string,
  channelId: 'fintrack_alerts' | 'fintrack_daily' = 'fintrack_alerts'
): Promise<boolean> {
  const hasPerm = await checkNotificationPermission();
  if (!hasPerm) return false;

  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            channelId,
            smallIcon: 'ic_launcher',
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
      return true;
    } catch (err) {
      console.error('Failed to schedule native notification:', err);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
      });
      return true;
    } catch (err) {
      console.warn('Web notification dispatch error:', err);
      return false;
    }
  }

  return false;
}

/**
 * Sync all scheduled reminders based on user preferences
 */
export async function syncScheduledNotifications(prefs?: NotificationPreferences): Promise<void> {
  if (!prefs || !prefs.enabled) {
    if (isNative) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }
      } catch (err) {
        console.warn('Failed to clear pending notifications:', err);
      }
    }
    return;
  }

  const hasPerm = await checkNotificationPermission();
  if (!hasPerm) return;

  if (!isNative) return; // Background repeating scheduling is native-specific

  try {
    await initializeNotificationChannels();

    // Daily Reminder (ID 9999)
    if (prefs.dailyReminder && prefs.dailyReminderTime) {
      const [hourStr, minStr] = prefs.dailyReminderTime.split(':');
      const hour = parseInt(hourStr, 10) || 20;
      const minute = parseInt(minStr, 10) || 0;

      await LocalNotifications.cancel({ notifications: [{ id: 9999 }] }).catch(() => {});

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: '🌙 FinTrack Expense Check-in',
            body: 'Take 30 seconds to log today’s expenses and stay within your budget.',
            channelId: 'fintrack_daily',
            smallIcon: 'ic_launcher',
            schedule: {
              on: {
                hour,
                minute,
              },
              repeats: true,
            },
          },
        ],
      });
    } else {
      await LocalNotifications.cancel({ notifications: [{ id: 9999 }] }).catch(() => {});
    }
  } catch (err) {
    console.warn('Failed to sync scheduled notifications:', err);
  }
}

// In-memory set to prevent alert spamming within the same session
const notifiedAlertKeys = new Set<string>();

/**
 * Checks budget limits and sends alerts if a category exceeds 80% or 100%
 */
export async function checkAndTriggerBudgetAlerts(
  categoryName: string,
  categoryId: string,
  spent: number,
  limit: number,
  prefs?: NotificationPreferences
): Promise<void> {
  if (!prefs?.enabled || !prefs?.budgetAlerts || limit <= 0) return;

  const percentage = (spent / limit) * 100;
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  if (percentage >= 100) {
    const alertKey = `over-budget-${categoryId}-${currentMonthKey}`;
    if (!notifiedAlertKeys.has(alertKey)) {
      notifiedAlertKeys.add(alertKey);
      await sendNotification(
        Math.abs(hashString(alertKey)),
        `🚨 Budget Exceeded: ${categoryName}`,
        `You have spent 100%+ of your ${categoryName} budget (₹${spent.toFixed(0)} of ₹${limit.toFixed(0)}).`,
        'fintrack_alerts'
      );
    }
  } else if (percentage >= 80) {
    const alertKey = `near-budget-${categoryId}-${currentMonthKey}`;
    if (!notifiedAlertKeys.has(alertKey)) {
      notifiedAlertKeys.add(alertKey);
      await sendNotification(
        Math.abs(hashString(alertKey)),
        `⚠️ Budget Alert: ${categoryName}`,
        `You have used ${Math.round(percentage)}% of your monthly budget for ${categoryName}.`,
        'fintrack_alerts'
      );
    }
  }
}

/**
 * Simple numeric hash for notification IDs
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100000);
}

