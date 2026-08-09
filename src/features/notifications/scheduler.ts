import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo';

import { resolveNextOccurrence } from './domain/occurrence';
import {
  getReminderConfigs,
  updateReminderScheduledFor,
} from './repository/notificationsRepository';
import { REMINDER_CONTENT } from './types';
import type { ReminderType } from './types';

/**
 * Adapter over expo-notifications (D6). Identifiers are deterministic per
 * reminder type (`reminder-<type>`) so the reconcile pass can always match a
 * type against its local pending schedule without extra metadata.
 */

export function reminderIdentifier(type: ReminderType): string {
  return `reminder-${type}`;
}

let androidChannelReady = false;

/** Create the default Android channel once per process (REMINDERS-1 naming). */
async function ensureAndroidChannel(): Promise<void> {
  if (androidChannelReady) {
    return;
  }
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  androidChannelReady = true;
}

/** Schedule the single pending local notification for a reminder type. */
export async function scheduleReminder(type: ReminderType, date: Date): Promise<void> {
  await ensureAndroidChannel();
  const content = REMINDER_CONTENT[type];
  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier(type),
    content: { title: content.title, body: content.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

/** Cancel the pending local notification of a reminder type, if any. */
export async function cancelScheduledReminder(type: ReminderType): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(type));
}

/** Epoch millis of a DATE trigger, or null when it is not one. */
function dateOfTrigger(trigger: unknown): number | null {
  if (trigger === null || typeof trigger !== 'object') {
    return null;
  }
  const candidate = trigger as { type?: unknown; date?: Date | number };
  if (candidate.type !== 'date' || candidate.date === undefined || candidate.date === null) {
    return null;
  }
  return typeof candidate.date === 'number' ? candidate.date : new Date(candidate.date).getTime();
}

/**
 * Boot reconciliation (REMINDERS-5): for every enabled type, if its pending
 * schedule is missing or its date already passed, cancel it, recompute the
 * next occurrence and persist the new date. Denied permission => no restore.
 */
export async function reconcileReminders(now: Date): Promise<void> {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status === PermissionStatus.DENIED) {
    return;
  }

  const [configs, pending] = await Promise.all([
    getReminderConfigs(),
    Notifications.getAllScheduledNotificationsAsync(),
  ]);

  for (const config of configs) {
    if (!config.enabled) {
      continue;
    }
    const request = pending.find(
      (notification) => notification.identifier === reminderIdentifier(config.type),
    );
    const scheduledAt = request ? dateOfTrigger(request.trigger) : null;
    if (scheduledAt !== null && scheduledAt > now.getTime()) {
      continue; // schedule consistent -> no-op
    }

    // A stale pending exists only when a date was found; a missing identifier
    // is recreated by scheduling with the same deterministic id (no OS dups).
    if (scheduledAt !== null) {
      await cancelScheduledReminder(config.type);
    }
    const next = resolveNextOccurrence(config.type, config.hour, config.minute, now);
    await scheduleReminder(config.type, next);
    await updateReminderScheduledFor(config.type, next);
  }
}