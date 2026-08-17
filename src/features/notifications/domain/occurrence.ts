import type { ReminderType } from '../types';

/**
 * Resolvedor puro de la próxima ocurrencia local de un recordatorio (REMINDERS-6).
 * Hoy a hour:minute cuando ese instante todavía está por delante de `now`, en
 * caso contrario la misma hora mañana. Los instantes iguales pasan a mañana
 * (D6: reloj inyectable).
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