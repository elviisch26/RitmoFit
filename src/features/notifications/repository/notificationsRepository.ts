import { eq } from 'drizzle-orm';

import { db } from '@/database/client';
import { notifications } from '@/database/schema';

import { resolveNextOccurrence } from '../domain/occurrence';
import {
  DEFAULT_REMINDER_TIME,
  REMINDER_CONTENT,
  REMINDER_TYPES,
} from '../types';
import type { ReminderConfig, ReminderType } from '../types';

/**
 * Fuente de verdad de la configuración: exactamente una fila `notifications`
 * por tipo (REMINDERS-2). La hora diaria se deriva de `scheduledFor` de la fila
 * (S2) por lo que no se requiere cambio de esquema; las filas nunca se eliminan,
 * deshabilitar solo cambia el estado a `cancelled` (S3).
 */

function toConfig(row: typeof notifications.$inferSelect): ReminderConfig {
  const localTime = new Date(row.scheduledFor.getTime());
  return {
    type: row.type as ReminderType,
    title: row.title,
    body: row.body,
    hour: localTime.getHours(),
    minute: localTime.getMinutes(),
    enabled: row.status === 'scheduled',
  };
}

function defaultConfig(type: ReminderType): ReminderConfig {
  const defaultTime = DEFAULT_REMINDER_TIME[type];
  const content = REMINDER_CONTENT[type];
  return {
    type,
    title: content.title,
    body: content.body,
    hour: defaultTime.hour,
    minute: defaultTime.minute,
    enabled: false,
  };
}

/** Todas las configuraciones de recordatorios, una por tipo; las filas faltantes usan los defaults. */
export async function getReminderConfigs(): Promise<ReminderConfig[]> {
  const rows = db.select().from(notifications).all();
  const byType = new Map<ReminderType, ReminderConfig>();
  for (const row of rows) {
    byType.set(row.type as ReminderType, toConfig(row));
  }
  return REMINDER_TYPES.map((type) => byType.get(type) ?? defaultConfig(type));
}

/** Hace upsert de una fila de recordatorio como `scheduled` y devuelve su ocurrencia guardada. */
function upsertScheduled(
  type: ReminderType,
  hour: number,
  minute: number,
  now: Date,
): Date {
  const scheduledFor = resolveNextOccurrence(type, hour, minute, now);
  const content = REMINDER_CONTENT[type];

  const existing = db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.type, type))
    .all()[0];

  if (existing) {
    db.update(notifications)
      .set({
        title: content.title,
        body: content.body,
        scheduledFor,
        status: 'scheduled',
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, existing.id))
      .run();
  } else {
    db.insert(notifications)
      .values({
        type,
        title: content.title,
        body: content.body,
        scheduledFor,
        status: 'scheduled',
      })
      .run();
  }

  return scheduledFor;
}

/** Enciende un recordatorio (REMINDERS-2): fila → `scheduled` + próxima ocurrencia. */
export async function activateReminder(
  type: ReminderType,
  hour: number,
  minute: number,
  now: Date,
): Promise<void> {
  upsertScheduled(type, hour, minute, now);
}

/**
 * Re-arma un recordatorio tras un cambio de hora (REMINDERS-4): el mismo upsert
 * con una ocurrencia recién resuelta.
 */
export async function reactivateReminder(
  type: ReminderType,
  hour: number,
  minute: number,
  now: Date,
): Promise<void> {
  upsertScheduled(type, hour, minute, now);
}

/** Apaga un recordatorio (S3): la fila se conserva, solo cambia el estado. */
export async function cancelReminder(type: ReminderType): Promise<void> {
  db.update(notifications)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(notifications.type, type))
    .run();
}

/** Persiste una ocurrencia reprogramada tras la reconciliación de arranque (REMINDERS-5). */
export async function updateReminderScheduledFor(
  type: ReminderType,
  scheduledFor: Date,
): Promise<void> {
  db.update(notifications)
    .set({ scheduledFor, updatedAt: new Date() })
    .where(eq(notifications.type, type))
    .run();
}