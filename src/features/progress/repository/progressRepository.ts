import {
  getLoadSeries,
  getWeeklyStats,
  listExercisesWithSessions,
  type WeeklyStats,
} from '@/features/workouts/repository/statisticsRepository';

import type { LoadPoint } from '../types';

export type ExerciseOption = { id: number; name: string };

/**
 * Thin wrapper over `statisticsRepository` (D1): Progress KPIs must be
 * identical to the dashboard (PROGRESS-1) and the load series/picker reuse
 * the aggregated queries so the SQL lives in exactly one place.
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