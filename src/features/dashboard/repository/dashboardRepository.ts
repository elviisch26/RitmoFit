import { computeStreak, type StreakResult } from '@/features/workouts/domain/streak';
import {
  getWeeklyStats,
  getWorkoutCompletedMs,
  type WeeklyStats,
} from '@/features/workouts/repository/statisticsRepository';

export type DashboardSummary = WeeklyStats & {
  streak: StreakResult;
};

/**
 * Wrapper fino (D1): agrega los KPIs semanales y los combina con la racha
 * calculada sobre el historial completo de entrenamientos. No hay SQL aquí.
 */
export async function getDashboardSummary(now: Date): Promise<DashboardSummary> {
  const [stats, completedMs] = await Promise.all([getWeeklyStats(now), getWorkoutCompletedMs()]);
  return {
    ...stats,
    streak: computeStreak(completedMs, now),
  };
}