import { asc, eq } from 'drizzle-orm';

import { db } from '@/database/client';
import { exerciseTemplates, routines, routineExercises } from '@/database/schema';

import type {
  CreateRoutineInput,
  Routine,
  RoutineExercise,
  UpdateRoutineInput,
} from '../types';

function listExercisesForRoutine(routineId: number): RoutineExercise[] {
  return db
    .select({
      id: routineExercises.id,
      exerciseTemplateId: routineExercises.exerciseTemplateId,
      exerciseName: exerciseTemplates.name,
      muscleGroup: exerciseTemplates.muscleGroup,
      position: routineExercises.position,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      restSeconds: routineExercises.restSeconds,
    })
    .from(routineExercises)
    .innerJoin(
      exerciseTemplates,
      eq(routineExercises.exerciseTemplateId, exerciseTemplates.id),
    )
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(asc(routineExercises.position))
    .all();
}

function toRoutine(row: typeof routines.$inferSelect, exercises: RoutineExercise[]): Routine {
  return {
    id: row.id,
    name: row.name,
    note: row.note,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    exercises,
  };
}

function toRoutineExerciseRow(exercise: CreateRoutineInput['exercises'][number], position: number) {
  return {
    exerciseTemplateId: exercise.exerciseTemplateId,
    position,
    targetSets: exercise.targetSets,
    targetReps: exercise.targetReps,
    restSeconds: exercise.restSeconds,
  };
}

/** All routines with their exercises, ordered by name. */
export async function listRoutines(): Promise<Routine[]> {
  const rows = db.select().from(routines).orderBy(asc(routines.name)).all();
  return rows.map((row) => toRoutine(row, listExercisesForRoutine(row.id)));
}

/** A single routine with its exercises, if it exists. */
export async function getRoutine(id: number): Promise<Routine | undefined> {
  const row = db.select().from(routines).where(eq(routines.id, id)).all()[0];
  return row ? toRoutine(row, listExercisesForRoutine(row.id)) : undefined;
}

/** Create a routine and its exercise rows in one transaction. */
export async function createRoutine(input: CreateRoutineInput): Promise<Routine> {
  const created = db.transaction((tx) => {
    const [row] = tx
      .insert(routines)
      .values({ name: input.name, note: input.note })
      .returning()
      .all();

    if (input.exercises.length > 0) {
      tx.insert(routineExercises)
        .values(
          input.exercises.map((exercise, position) => ({
            routineId: row.id,
            ...toRoutineExerciseRow(exercise, position),
          })),
        )
        .run();
    }

    return row;
  });

  return toRoutine(created, listExercisesForRoutine(created.id));
}

/** Update routine fields and (optionally) replace its exercise rows. */
export async function updateRoutine(
  id: number,
  input: UpdateRoutineInput,
): Promise<Routine | undefined> {
  db.transaction((tx) => {
    const current = tx.select().from(routines).where(eq(routines.id, id)).all()[0];
    if (!current) {
      return undefined;
    }

    const name = input.name?.trim() || current.name;
    const note = input.note !== undefined ? (input.note?.trim() || null) : current.note;

    tx.update(routines)
      .set({ name, note, updatedAt: new Date() })
      .where(eq(routines.id, id))
      .run();

    if (input.exercises !== undefined) {
      tx.delete(routineExercises).where(eq(routineExercises.routineId, id)).run();
      if (input.exercises.length > 0) {
        tx.insert(routineExercises)
          .values(
            input.exercises.map((exercise, position) => ({
              routineId: id,
              ...toRoutineExerciseRow(exercise, position),
            })),
          )
          .run();
      }
    }

    return current;
  });

  return getRoutine(id);
}

/** Delete a routine and its exercise rows (cascade). */
export async function deleteRoutine(id: number): Promise<boolean> {
  return db.transaction((tx) => {
    tx.delete(routineExercises).where(eq(routineExercises.routineId, id)).run();
    const result = tx.delete(routines).where(eq(routines.id, id)).run();
    return result.changes > 0;
  });
}

/** Duplicate a routine together with its exercise rows, suffixed "(copy)". */
export async function duplicateRoutine(id: number): Promise<Routine | undefined> {
  const source = await getRoutine(id);
  if (!source) {
    return undefined;
  }

  return createRoutine({
    name: `${source.name} (copia)`,
    note: source.note,
    exercises: source.exercises.map((exercise) => ({
      exerciseTemplateId: exercise.exerciseTemplateId,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      restSeconds: exercise.restSeconds,
    })),
  });
}