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
 * Thin wrapper (D1): aggregates the weekly KPIs and combines them with the
 * streak computed over the full completion history. No SQL lives here.
 */
export async function getDashboardSummary(now: Date): Promise<DashboardSummary> {
  const [stats, completedMs] = await Promise.all([getWeeklyStats(now), getWorkoutCompletedMs()]);
  return {
    ...stats,
    streak: computeStreak(completedMs, now),
  };
}