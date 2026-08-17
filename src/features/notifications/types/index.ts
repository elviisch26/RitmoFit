/** Tipos de recordatorio soportados por el panel de ajustes (REMINDERS-1). */
export type ReminderType = 'workout_reminder' | 'hydration' | 'rest';

/** Orden canónico de los tipos de recordatorio (orden de declaración = orden de UI). */
export const REMINDER_TYPES: readonly ReminderType[] = [
  'workout_reminder',
  'hydration',
  'rest',
];

/** Etiquetas en español mostradas en el panel de ajustes (REMINDERS-1, es neutro). */
export const LABELS: Record<ReminderType, string> = {
  workout_reminder: 'Entrenamiento',
  hydration: 'Hidratación',
  rest: 'Descanso',
};

/** Textos de título/cuerpo usados en la notificación local (REMINDERS-1/2). */
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

/** Hora de respaldo por tipo usada cuando todavía no existe una fila (REMINDERS-2). */
export const DEFAULT_REMINDER_TIME: Record<
  ReminderType,
  { hour: number; minute: number }
> = {
  workout_reminder: { hour: 8, minute: 0 },
  hydration: { hour: 14, minute: 0 },
  rest: { hour: 22, minute: 0 },
};

/**
 * Configuración runtime de un tipo de recordatorio, derivada de su fila
 * `notifications` (S2: la hora diaria sale de `scheduledFor`, sin cambio de
 * esquema).
 */
export type ReminderConfig = {
  type: ReminderType;
  title: string;
  body: string;
  hour: number;
  minute: number;
  enabled: boolean;
};