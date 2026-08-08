import { and, asc, count, eq, gte, gt, isNotNull, lt, max } from 'drizzle-orm';

import { db } from '@/database/client';
import {
  exerciseTemplates,
  sets,
  workoutExercises,
  workoutSessions,
} from '@/database/schema';

/**
 * Aggregate statistics over persisted workout data. A single source of
 * aggregated queries (D1): Dashboard and Progress both delegate here so KPIs
 * stay identical and the SQL stays in one place.
 */

export type WeeklyStats = {
  workouts: number;
  sets: number;
  minutes: number;
};

export type LoadPoint = {
  date: string;
  weightKg: number;
};

/** Monday 00:00 in the local timezone that contains `now`. */
function startOfWeekLocal(now: Date): Date {
  const daysSinceMonday = (now.getDay() + 6) % 7; // Sunday -> 6, Monday -> 0
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday, 0, 0, 0, 0);
}

function formatLocalDate(ms: number): string {
  const date = new Date(ms);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * KPI of the current local week (Monday-Sunday): completed workouts, total
 * sets and total minutes (floor of (completedAt - startedAt) / 60000).
 * Workouts with NULL completedAt never count; workouts without sets count
 * towards workouts/minutes but 0 sets.
 */
export async function getWeeklyStats(now: Date): Promise<WeeklyStats> {
  const weekStart = startOfWeekLocal(now);
  const nextMonday = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + 7,
    0,
    0,
    0,
    0,
  );

  const rows = db
    .select({
      workoutId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      completedAt: workoutSessions.completedAt,
      setCount: count(sets.id),
    })
    .from(workoutSessions)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workoutSessions.id))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        isNotNull(workoutSessions.completedAt),
        gte(workoutSessions.completedAt, weekStart),
        lt(workoutSessions.completedAt, nextMonday),
      ),
    )
    .groupBy(workoutSessions.id)
    .all();

  return rows.reduce<WeeklyStats>(
    (stats, row) => {
      const completedMs = row.completedAt?.getTime() ?? row.startedAt.getTime();
      const startedMs = row.startedAt.getTime();
      stats.workouts += 1;
      stats.sets += row.setCount ?? 0;
      stats.minutes += Math.floor((completedMs - startedMs) / 60000);
      return stats;
    },
    { workouts: 0, sets: 0, minutes: 0 },
  );
}

/**
 * Millis of every completed workout (full history, chronological). Used to
 * compute the streak: "best" is the longest historical run, so it cannot be
 * scoped to the current week.
 */
export async function getWorkoutCompletedMs(): Promise<number[]> {
  const rows = db
    .select({ completedAt: workoutSessions.completedAt })
    .from(workoutSessions)
    .where(isNotNull(workoutSessions.completedAt))
    .orderBy(asc(workoutSessions.completedAt))
    .all();

  return rows
    .map((row) => row.completedAt?.getTime())
    .filter((ms): ms is number => ms !== undefined);
}

/**
 * Chronological load series for one exercise: one point per completed
 * workout, y = the max weight among sets with weightKg > 0. Bodyweight-only
 * sessions (weight 0) are filtered out by SQL, so a bodyweight exercise
 * yields no points instead of false zeros.
 */
export async function getLoadSeries(exerciseId: number): Promise<LoadPoint[]> {
  const rows = db
    .select({
      workoutId: workoutSessions.id,
      completedAt: workoutSessions.completedAt,
      weightKg: max(sets.weightKg),
    })
    .from(workoutSessions)
    .innerJoin(workoutExercises, eq(workoutExercises.workoutId, workoutSessions.id))
    .innerJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workoutExercises.exerciseTemplateId, exerciseId),
        isNotNull(workoutSessions.completedAt),
        gt(sets.weightKg, 0),
      ),
    )
    .groupBy(workoutSessions.id)
    .orderBy(asc(workoutSessions.completedAt))
    .all();

  return rows.map((row) => ({
    date: formatLocalDate(row.completedAt!.getTime()),
    weightKg: row.weightKg ?? 0,
  }));
}

/**
 * Exercise templates that have at least one completed session, ordered by
 * name (Spanish catalog). Ordered so the first entry is the default picker.
 */
export async function listExercisesWithSessions(): Promise<{ id: number; name: string }[]> {
  const rows = db
    .selectDistinct({ id: exerciseTemplates.id, name: exerciseTemplates.name })
    .from(exerciseTemplates)
    .innerJoin(workoutExercises, eq(workoutExercises.exerciseTemplateId, exerciseTemplates.id))
    .innerJoin(workoutSessions, eq(workoutExercises.workoutId, workoutSessions.id))
    .where(isNotNull(workoutSessions.completedAt))
    .orderBy(asc(exerciseTemplates.name))
    .all();

  return rows;
}