import { asc, desc, eq, max } from 'drizzle-orm';

import { db } from '@/database/client';
import {
  exerciseTemplates,
  routines,
  routineExercises,
  sets,
  users,
  workoutExercises,
  workoutSessions,
} from '@/database/schema';

import type {
  AddSetInput,
  UpdateSetInput,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../types';

const DEFAULT_USER_EMAIL = 'default@ritmofit.local';

function toWorkout(row: typeof workoutSessions.$inferSelect): Workout {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    startedAt: row.startedAt.getTime(),
    completedAt: row.completedAt ? row.completedAt.getTime() : null,
  };
}

type WorkoutSetRow = {
  id: number;
  weightKg: number;
  reps: number;
  restSeconds: number | null;
  rpe: number | null;
  orderIndex: number;
};

function toWorkoutSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    weightKg: row.weightKg,
    reps: row.reps,
    restSeconds: row.restSeconds,
    rpe: row.rpe,
    orderIndex: row.orderIndex,
  };
}

/** Un entrenamiento por id, si existe. */
export async function getWorkout(id: number): Promise<Workout | undefined> {
  const row = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).all()[0];
  return row ? toWorkout(row) : undefined;
}

/** Todos los entrenamientos ordenados por hora de inicio, más reciente primero. */
export async function listWorkouts(): Promise<Workout[]> {
  const rows = db
    .select()
    .from(workoutSessions)
    .orderBy(desc(workoutSessions.startedAt))
    .all();
  return rows.map(toWorkout);
}

/**
 * Inicia un entrenamiento desde una rutina: crea la fila del entrenamiento más
 * una fila por ejercicio en una sola transacción. Devuelve el id del nuevo
 * entrenamiento.
 */
export async function startWorkoutFromRoutine(routineId: number): Promise<number> {
  return db.transaction((tx) => {
    const routineRow = tx.select().from(routines).where(eq(routines.id, routineId)).all()[0];
    if (!routineRow) {
      throw new Error(`Routine ${routineId} not found.`);
    }

    const routineExercisesRows = tx
      .select({
        exerciseTemplateId: routineExercises.exerciseTemplateId,
        position: routineExercises.position,
      })
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routineId))
      .orderBy(asc(routineExercises.position))
      .all();

    const existingUser = tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEFAULT_USER_EMAIL))
      .all()[0];
    const userId = existingUser
      ? existingUser.id
      : tx
          .insert(users)
          .values({ name: 'RitmoFit User', email: DEFAULT_USER_EMAIL })
          .run().lastInsertRowId;

    const insert = tx
      .insert(workoutSessions)
      .values({
        userId,
        name: routineRow.name,
        startedAt: new Date(),
      })
      .run();

    const workoutId = insert.lastInsertRowId;

    if (routineExercisesRows.length > 0) {
      tx.insert(workoutExercises)
        .values(
          routineExercisesRows.map((exercise) => ({
            workoutId,
            exerciseTemplateId: exercise.exerciseTemplateId,
            orderIndex: exercise.position,
          })),
        )
        .run();
    }

    return workoutId;
  });
}

function listSetsForWorkoutExercise(workoutExerciseId: number): WorkoutSet[] {
  return db
    .select({
      id: sets.id,
      weightKg: sets.weightKg,
      reps: sets.reps,
      restSeconds: sets.restSeconds,
      rpe: sets.rpe,
      orderIndex: sets.orderIndex,
    })
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId))
    .orderBy(asc(sets.orderIndex))
    .all()
    .map(toWorkoutSet);
}

/** Todos los ejercicios de un entrenamiento con sus detalles de template y sus series. */
export async function getWorkoutExercises(workoutId: number): Promise<WorkoutExercise[]> {
  const rows = db
    .select({
      id: workoutExercises.id,
      exerciseTemplateId: workoutExercises.exerciseTemplateId,
      name: exerciseTemplates.name,
      muscleGroup: exerciseTemplates.muscleGroup,
      orderIndex: workoutExercises.orderIndex,
      notes: workoutExercises.notes,
    })
    .from(workoutExercises)
    .innerJoin(
      exerciseTemplates,
      eq(workoutExercises.exerciseTemplateId, exerciseTemplates.id),
    )
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.orderIndex))
    .all();

  return rows.map((row) => ({
    ...row,
    sets: listSetsForWorkoutExercise(row.id),
  }));
}

/** Agrega una serie a la lista de un ejercicio del entrenamiento, usando el siguiente order index. */
export async function addSet(
  workoutExerciseId: number,
  input: AddSetInput,
): Promise<WorkoutSet> {
  const latest = db
    .select({ maxOrder: max(sets.orderIndex) })
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId))
    .all()[0];

  const orderIndex = (latest?.maxOrder === null ? -1 : latest?.maxOrder ?? -1) + 1;

  const result = db
    .insert(sets)
    .values({
      workoutExerciseId,
      orderIndex,
      weightKg: input.weightKg,
      reps: input.reps,
      restSeconds: input.restSeconds ?? null,
      rpe: input.rpe ?? null,
    })
    .run();

  return {
    id: result.lastInsertRowId,
    weightKg: input.weightKg,
    reps: input.reps,
    restSeconds: input.restSeconds ?? null,
    rpe: input.rpe ?? null,
    orderIndex,
  };
}

/** Actualiza los campos de una serie existente. Devuelve si se modificó alguna fila. */
export async function updateSet(setId: number, input: UpdateSetInput): Promise<boolean> {
  const result = db.update(sets).set(input).where(eq(sets.id, setId)).run();
  return result.changes > 0;
}

/** Elimina una serie. Devuelve si se eliminó alguna fila. */
export async function deleteSet(setId: number): Promise<boolean> {
  const result = db.delete(sets).where(eq(sets.id, setId)).run();
  return result.changes > 0;
}

/** Marca un entrenamiento como completado y devuelve el entrenamiento actualizado. */
export async function completeWorkout(workoutId: number): Promise<Workout | undefined> {
  const result = db
    .update(workoutSessions)
    .set({ completedAt: new Date() })
    .where(eq(workoutSessions.id, workoutId))
    .run();

  if (result.changes === 0) {
    return undefined;
  }

  return getWorkout(workoutId);
}

/** Elimina un entrenamiento; los ejercicios y las series se borran en cascada. */
export async function deleteWorkout(workoutId: number): Promise<boolean> {
  const result = db.delete(workoutSessions).where(eq(workoutSessions.id, workoutId)).run();
  return result.changes > 0;
}