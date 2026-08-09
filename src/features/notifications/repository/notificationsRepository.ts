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
 * Config source of truth: exactly one `notifications` row per type
 * (REMINDERS-2). The daily time is derived from the row's `scheduledFor`
 * (S2) so no schema change is required; rows are never deleted, disabling
 * only flips the status to `cancelled` (S3).
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

/** All reminder configs, one per type; missing rows fall back to defaults. */
export async function getReminderConfigs(): Promise<ReminderConfig[]> {
  const rows = db.select().from(notifications).all();
  const byType = new Map<ReminderType, ReminderConfig>();
  for (const row of rows) {
    byType.set(row.type as ReminderType, toConfig(row));
  }
  return REMINDER_TYPES.map((type) => byType.get(type) ?? defaultConfig(type));
}

/** Upsert a reminder row as `scheduled` and return its stored occurrence. */
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

/** Turn a reminder on (REMINDERS-2): row → `scheduled` + next occurrence. */
export async function activateReminder(
  type: ReminderType,
  hour: number,
  minute: number,
  now: Date,
): Promise<void> {
  upsertScheduled(type, hour, minute, now);
}

/**
 * Re-arm a reminder after a time change (REMINDERS-4): same upsert with a
 * freshly resolved occurrence.
 */
export async function reactivateReminder(
  type: ReminderType,
  hour: number,
  minute: number,
  now: Date,
): Promise<void> {
  upsertScheduled(type, hour, minute, now);
}

/** Turn a reminder off (S3): row is kept, only the status flips. */
export async function cancelReminder(type: ReminderType): Promise<void> {
  db.update(notifications)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(notifications.type, type))
    .run();
}

/** Persist a rescheduled occurrence after boot reconciliation (REMINDERS-5). */
export async function updateReminderScheduledFor(
  type: ReminderType,
  scheduledFor: Date,
): Promise<void> {
  db.update(notifications)
    .set({ scheduledFor, updatedAt: new Date() })
    .where(eq(notifications.type, type))
    .run();
}