/** Reminder kinds supported by the settings panel (REMINDERS-1). */
export type ReminderType = 'workout_reminder' | 'hydration' | 'rest';

/** Canonical order of the reminder types (declaration order = UI order). */
export const REMINDER_TYPES: readonly ReminderType[] = [
  'workout_reminder',
  'hydration',
  'rest',
];

/** Spanish labels shown in the settings panel (REMINDERS-1, neutral es). */
export const LABELS: Record<ReminderType, string> = {
  workout_reminder: 'Entrenamiento',
  hydration: 'Hidratación',
  rest: 'Descanso',
};

/** Title/body texts used on the local notification (REMINDERS-1/2). */
export const REMINDER_CONTENT: Record<
  ReminderType,
  { title: string; body: string }
> = {
  workout_reminder: {
    title: 'Hora de entrenar',
    body: 'Es momento de completar el entrenamiento de hoy. ¡A darle!',
  },
  hydration: {
    title: 'Hidratación',
    body: 'Momento de beber agua para mantenerse hidratado.',
  },
  rest: {
    title: 'Descanso',
    body: 'Es momento de descansar. El cuerpo se recupera mientras duermes.',
  },
};

/** Fallback time per type used when no row exists yet (REMINDERS-2). */
export const DEFAULT_REMINDER_TIME: Record<
  ReminderType,
  { hour: number; minute: number }
> = {
  workout_reminder: { hour: 8, minute: 0 },
  hydration: { hour: 14, minute: 0 },
  rest: { hour: 22, minute: 0 },
};

/**
 * Runtime config of a reminder type, derived from its `notifications` row
 * (S2: the daily time comes from `scheduledFor`, no schema change).
 */
export type ReminderConfig = {
  type: ReminderType;
  title: string;
  body: string;
  hour: number;
  minute: number;
  enabled: boolean;
};