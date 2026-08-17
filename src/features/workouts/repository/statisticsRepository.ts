import { and, asc, count, eq, gte, gt, isNotNull, lt, max } from 'drizzle-orm';

import { db } from '@/database/client';
import {
  exerciseTemplates,
  sets,
  workoutExercises,
  workoutSessions,
} from '@/database/schema';

/**
 * Estadísticas agregadas sobre los datos de entrenamiento persistidos. Una sola
 * fuente de consultas agregadas (D1): Dashboard y Progreso delegan aquí para
 * que los KPIs se mantengan idénticos y el SQL quede en un solo lugar.
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

/** Lunes 00:00 en la zona horaria local que contiene `now`. */
function startOfWeekLocal(now: Date): Date {
  const daysSinceMonday = (now.getDay() + 6) % 7; // domingo -> 6, lunes -> 0
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday, 0, 0, 0, 0);
}

function formatLocalDate(ms: number): string {
  const date = new Date(ms);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * KPI de la semana local actual (lunes-domingo): entrenamientos completados,
 * total de series y total de minutos (piso de (completedAt - startedAt) / 60000).
 * Los entrenamientos con completedAt NULL nunca cuentan; los entrenamientos sin
 * series cuentan para entrenamientos/minutos pero con 0 series.
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
 * Millis de cada entrenamiento completado (historial completo, cronológico). Se
 * usa para calcular la racha: "best" es la racha histórica más larga, por lo
 * que no puede limitarse a la semana actual.
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
 * Serie de cargas cronológica para un ejercicio: un punto por entrenamiento
 * completado, y = el peso máximo entre las series con weightKg > 0. Las sesiones
 * solo con peso corporal (peso 0) se filtran por SQL, por lo que un ejercicio
 * de peso corporal no produce puntos en lugar de falsos ceros.
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
 * Templates de ejercicio con al menos una sesión completada, ordenados por
 * nombre (catálogo en español). Se ordenan para que la primera entrada sea el
 * default del picker.
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