import { asc, eq, inArray } from 'drizzle-orm';

import { db } from '@/database/client';
import { exerciseTemplates, routines, routineExercises } from '@/database/schema';
import type { Goal } from '@/database/schema';

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
    goal: row.goal,
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

/** Todas las rutinas con sus ejercicios, ordenadas por nombre. */
export async function listRoutines(): Promise<Routine[]> {
  const rows = db.select().from(routines).orderBy(asc(routines.name)).all();
  return rows.map((row) => toRoutine(row, listExercisesForRoutine(row.id)));
}

/** Una rutina con sus ejercicios, si existe. */
export async function getRoutine(id: number): Promise<Routine | undefined> {
  const row = db.select().from(routines).where(eq(routines.id, id)).all()[0];
  return row ? toRoutine(row, listExercisesForRoutine(row.id)) : undefined;
}

/** Crea una rutina y sus filas de ejercicio en una sola transacción. */
export async function createRoutine(input: CreateRoutineInput): Promise<Routine> {
  const created = db.transaction((tx) => {
    const [row] = tx
      .insert(routines)
      .values({ name: input.name, note: input.note, goal: input.goal })
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

/** Actualiza los campos de una rutina y (opcionalmente) reemplaza sus filas de ejercicio. */
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
    const goal = input.goal ?? current.goal;

    tx.update(routines)
      .set({ name, note, goal, updatedAt: new Date() })
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

/** Elimina una rutina y sus filas de ejercicio (en cascada). */
export async function deleteRoutine(id: number): Promise<boolean> {
  return db.transaction((tx) => {
    tx.delete(routineExercises).where(eq(routineExercises.routineId, id)).run();
    const result = tx.delete(routines).where(eq(routines.id, id)).run();
    return result.changes > 0;
  });
}

/** Duplica una rutina junto con sus filas de ejercicio, con sufijo "(copia)". */
export async function duplicateRoutine(id: number): Promise<Routine | undefined> {
  const source = await getRoutine(id);
  if (!source) {
    return undefined;
  }

  return createRoutine({
    name: `${source.name} (copia)`,
    note: source.note,
    goal: source.goal,
    exercises: source.exercises.map((exercise) => ({
      exerciseTemplateId: exercise.exerciseTemplateId,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      restSeconds: exercise.restSeconds,
    })),
  });
}

type ExampleRoutineExercise = {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

type ExampleRoutine = {
  name: string;
  goal: Goal;
  exercises: ExampleRoutineExercise[];
};

/**
 * Rutinas de ejemplo cargadas bajo demanda desde el estado vacío de la lista.
 * Son solo una referencia (etiqueta + filtro): no alteran series/reps sugeridos.
 */
const EXAMPLE_ROUTINES: ExampleRoutine[] = [
  {
    name: 'Full Body',
    goal: 'strength',
    exercises: [
      { exerciseName: 'Sentadilla', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseName: 'Press de banca', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseName: 'Remo con barra', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseName: 'Plancha', targetSets: 3, targetReps: 30, restSeconds: 60 },
    ],
  },
  {
    name: 'Push',
    goal: 'hypertrophy',
    exercises: [
      { exerciseName: 'Press de banca', targetSets: 4, targetReps: 8, restSeconds: 90 },
      { exerciseName: 'Press militar', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseName: 'Fondos', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseName: 'Extensión de tríceps en polea', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
  },
  {
    name: 'Pull',
    goal: 'hypertrophy',
    exercises: [
      { exerciseName: 'Dominadas', targetSets: 4, targetReps: 8, restSeconds: 90 },
      { exerciseName: 'Remo con barra', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseName: 'Jalón al pecho', targetSets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseName: 'Curl con barra', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
  },
];

/**
 * Inserta las rutinas de ejemplo solo si no existe una con el mismo nombre.
 * Resuelve cada ejercicio contra el catálogo sembrado por nombre; si un
 * template no existe (catálogo ausente) el ejercicio se omite sin romper la
 * rutina. Idempotente: repetir la llamada no duplica rutinas ni ejercicios.
 * Devuelve cuántas rutinas se insertaron.
 */
export async function seedExampleRoutines(): Promise<number> {
  const exerciseNames = Array.from(
    new Set(
      EXAMPLE_ROUTINES.flatMap((routine) => routine.exercises.map((exercise) => exercise.exerciseName)),
    ),
  );

  return db.transaction((tx) => {
    const templates = tx
      .select({ id: exerciseTemplates.id, name: exerciseTemplates.name })
      .from(exerciseTemplates)
      .where(inArray(exerciseTemplates.name, exerciseNames))
      .all();
    const templateIdByName = new Map(templates.map((template) => [template.name, template.id]));

    let inserted = 0;

    for (const example of EXAMPLE_ROUTINES) {
      const existing = tx
        .select({ id: routines.id })
        .from(routines)
        .where(eq(routines.name, example.name))
        .all();
      if (existing.length > 0) {
        continue;
      }

      const exercises = example.exercises
        .map((exercise, position) => {
          const templateId = templateIdByName.get(exercise.exerciseName);
          if (templateId === undefined) {
            return null;
          }
          return {
            exerciseTemplateId: templateId,
            position,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            restSeconds: exercise.restSeconds,
          };
        })
        .filter(
          (exercise): exercise is NonNullable<typeof exercise> => exercise !== null,
        );

      const [row] = tx
        .insert(routines)
        .values({ name: example.name, note: null, goal: example.goal })
        .returning()
        .all();

      if (exercises.length > 0) {
        tx.insert(routineExercises)
          .values(exercises.map((exercise) => ({ routineId: row.id, ...exercise })))
          .run();
      }

      inserted += 1;
    }

    return inserted;
  });
}
