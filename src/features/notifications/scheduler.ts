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
 * Adaptador sobre expo-notifications (D6). Los identificadores son
 * deterministas por tipo de recordatorio (`reminder-<type>`) para que el paso
 * de reconciliación siempre pueda emparejar un tipo con su programación local
 * pendiente sin metadatos adicionales.
 */

export function reminderIdentifier(type: ReminderType): string {
  return `reminder-${type}`;
}

let androidChannelReady = false;

/** Crea el canal de Android por defecto una vez por proceso (nomenclatura REMINDERS-1). */
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

/** Programa la única notificación local pendiente para un tipo de recordatorio. */
export async function scheduleReminder(type: ReminderType, date: Date): Promise<void> {
  await ensureAndroidChannel();
  const content = REMINDER_CONTENT[type];
  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier(type),
    content: { title: content.title, body: content.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

/** Cancela la notificación local pendiente de un tipo de recordatorio, si existe. */
export async function cancelScheduledReminder(type: ReminderType): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(type));
}

/** Millis epoch de un trigger DATE, o null cuando no lo es. */
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
 * Reconciliación al arranque (REMINDERS-5): por cada tipo habilitado, si su
 * programación pendiente falta o su fecha ya pasó, se cancela, se recalcula la
 * próxima ocurrencia y se persiste la nueva fecha. Permiso denegado => no se
 * restaura nada.
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
      continue; // cronograma consistente -> no-op
    }

    // Un pendiente obsoleto solo existe cuando se encontró una fecha; un
    // identificador ausente se recrea programando con el mismo id determinista
    // (sin duplicados del SO).
    if (scheduledAt !== null) {
      await cancelScheduledReminder(config.type);
    }
    const next = resolveNextOccurrence(config.type, config.hour, config.minute, now);
    await scheduleReminder(config.type, next);
    await updateReminderScheduledFor(config.type, next);
  }
}