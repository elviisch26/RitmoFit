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

/** A single workout by id, if it exists. */
export async function getWorkout(id: number): Promise<Workout | undefined> {
  const row = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).all()[0];
  return row ? toWorkout(row) : undefined;
}

/** All workouts ordered by start time, most recent first. */
export async function listWorkouts(): Promise<Workout[]> {
  const rows = db
    .select()
    .from(workoutSessions)
    .orderBy(desc(workoutSessions.startedAt))
    .all();
  return rows.map(toWorkout);
}

/**
 * Start a workout from a routine: creates the workout row plus one
 * work per exercise in one transaction. Returns the new workout id.
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

/** All exercises of a workout with their template details and sets. */
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

/** Append a set to a workout exercise' list, using the next order index. */
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

/** Update fields of an existing set. Returns whether a row was changed. */
export async function updateSet(setId: number, input: UpdateSetInput): Promise<boolean> {
  const result = db.update(sets).set(input).where(eq(sets.id, setId)).run();
  return result.changes > 0;
}

/** Delete a set. Returns whether a row was removed. */
export async function deleteSet(setId: number): Promise<boolean> {
  const result = db.delete(sets).where(eq(sets.id, setId)).run();
  return result.changes > 0;
}

/** Mark a workout as completed and return the updated workout. */
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

/** Delete a workout; the exercises and sets cascade. */
export async function deleteWorkout(workoutId: number): Promise<boolean> {
  const result = db.delete(workoutSessions).where(eq(workoutSessions.id, workoutId)).run();
  return result.changes > 0;
}