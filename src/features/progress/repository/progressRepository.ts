import {
  getLoadSeries,
  getWeeklyStats,
  listExercisesWithSessions,
  type WeeklyStats,
} from '@/features/workouts/repository/statisticsRepository';

import type { LoadPoint } from '../types';

export type ExerciseOption = { id: number; name: string };

/**
 * Wrapper fino sobre `statisticsRepository` (D1): los KPIs de Progreso deben
 * ser idénticos a los del dashboard (PROGRESS-1) y la serie de cargas/picker
 * reutilizan las consultas agregadas para que el SQL viva en exactamente un
 * solo lugar.
 */
export function getProgressKpis(now: Date): Promise<WeeklyStats> {
  return getWeeklyStats(now);
}

export async function listExerciseOptions(): Promise<ExerciseOption[]> {
  return listExercisesWithSessions();
}

export async function getExerciseLoadSeries(exerciseId: number): Promise<LoadPoint[]> {
  return getLoadSeries(exerciseId);
}