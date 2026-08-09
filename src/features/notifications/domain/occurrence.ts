import type { ReminderType } from '../types';

/**
 * Pure resolver of the next local occurrence for a reminder (REMINDERS-6).
 * Today at hour:minute when that instant is still ahead of `now`, otherwise
 * the same time tomorrow. Equal instants roll to tomorrow (D6 injectable clock).
 */
export function resolveNextOccurrence(
  _type: ReminderType,
  hour: number,
  minute: number,
  now: Date,
): Date {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}