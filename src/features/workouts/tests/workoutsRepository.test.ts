import { expoSqliteMock } from './support/sqliteMock';

jest.mock('expo-sqlite', () => {
  const { expoSqliteMock: mock } = jest.requireActual('./support/sqliteMock');
  return { openDatabaseSync: mock.openDatabaseSync };
});

import {
  addSet,
  completeWorkout,
  deleteSet,
  deleteWorkout,
  getWorkoutExercises,
  listWorkouts,
  startWorkoutFromRoutine,
  updateSet,
} from '../repository/workoutsRepository';

import { db } from '@/database/client';
import { seedExerciseCatalog } from '@/database/seed';
import { seedExampleRoutines } from '../repository/routinesRepository';

const STARTED_AT = Date.UTC(2026, 0, 1, 10, 0, 0);
const COMPLETED_AT = Date.UTC(2026, 0, 1, 11, 30, 0);

describe('workoutsRepository', () => {
  beforeEach(() => {
    expoSqliteMock.reset();
  });

  describe('startWorkoutFromRoutine', () => {
    it('creates a workout row and one workout_exercise per routine exercise', async () => {
      expoSqliteMock.rule({ match: /from "routines"/, rows: [[1, 'Push Day', null, STARTED_AT, STARTED_AT]] });
      expoSqliteMock.rule({
        match: /from "routine_exercises"/,
        rows: [
          [100, 0],
          [101, 1],
        ],
      });
      expoSqliteMock.rule({ match: /from "users"/, rows: [] });
      expoSqliteMock.rule({ match: /insert into "users"/, changes: 1, lastInsertRowId: 9001 });
      expoSqliteMock.rule({ match: /insert into "workouts"/, changes: 1, lastInsertRowId: 500 });
      expoSqliteMock.rule({ match: /insert into "workout_exercises"/, changes: 2, lastInsertRowId: 501 });

      const workoutId = await startWorkoutFromRoutine(7);

      expect(workoutId).toBe(500);

      const workoutInserts = expoSqliteMock.callsMatching(/insert into "workouts"/, 'run');
      expect(workoutInserts).toHaveLength(1);
      const workoutParams = workoutInserts[0].params as unknown[];
      expect(workoutParams[0]).toBe(9001);
      expect(workoutParams[1]).toBe('Push Day');

      const exerciseInserts = expoSqliteMock.callsMatching(/insert into "workout_exercises"/, 'run');
      expect(exerciseInserts).toHaveLength(1);
      const exerciseParams = exerciseInserts[0].params as unknown[];
      expect(exerciseParams).toContain(500);
      expect(exerciseParams).toContain(100);
      expect(exerciseParams).toContain(101);
      expect(exerciseParams).toContain(0);
      expect(exerciseParams).toContain(1);
    });

    it('throws when the routine does not exist', async () => {
      expoSqliteMock.rule({ match: /from "routines"/, rows: [] });

      await expect(startWorkoutFromRoutine(999)).rejects.toThrow(/not found/i);
    });
  });

  describe('listWorkouts', () => {
    it('returns workouts ordered by started_at desc', async () => {
      expoSqliteMock.rule({
        match: /from "workouts"/,
        rows: [
          [501, 9001, 'Upper', null, COMPLETED_AT, COMPLETED_AT, STARTED_AT, STARTED_AT],
          [500, 9001, 'Push Day', null, STARTED_AT, null, STARTED_AT, STARTED_AT],
        ],
      });

      const workouts = await listWorkouts();

      expect(workouts).toHaveLength(2);
      expect(workouts[0].name).toBe('Upper');
      expect(workouts[0].completedAt).not.toBeNull();
      expect(workouts[1].name).toBe('Push Day');
      expect(workouts[1].completedAt).toBeNull();
      expect(workouts[1].startedAt).toBe(STARTED_AT);
    });
  });

  describe('getWorkoutExercises', () => {
    it('returns exercises with their template details and ordered sets', async () => {
      expoSqliteMock.rule({
        match: /from "workout_exercises"/,
        rows: [[10, 1, 'Bench Press', 'chest', 0, null]],
      });
      expoSqliteMock.rule({
        match: /from "sets"/,
        rows: [
          [20, 60, 10, 60, 8, 0],
          [21, 60, 9, null, null, 1],
        ],
      });

      const exercises = await getWorkoutExercises(500);

      expect(exercises).toHaveLength(1);
      expect(exercises[0]).toMatchObject({
        id: 10,
        exerciseTemplateId: 1,
        name: 'Bench Press',
        muscleGroup: 'chest',
        orderIndex: 0,
      });
      expect(exercises[0].sets).toEqual([
        { id: 20, weightKg: 60, reps: 10, restSeconds: 60, rpe: 8, orderIndex: 0 },
        { id: 21, weightKg: 60, reps: 9, restSeconds: null, rpe: null, orderIndex: 1 },
      ]);
    });
  });

  describe('addSet', () => {
    it('appends a set using the next order index', async () => {
      expoSqliteMock.rule({ match: /max\("order_index"\)/, rows: [[0]] });
      expoSqliteMock.rule({ match: /insert into "sets"/, changes: 1, lastInsertRowId: 77 });

      const set = await addSet(10, { weightKg: 60, reps: 10, restSeconds: 60, rpe: 8 });

      expect(set).toMatchObject({
        id: 77,
        orderIndex: 1,
        weightKg: 60,
        reps: 10,
        restSeconds: 60,
        rpe: 8,
      });

      const inserts = expoSqliteMock.callsMatching(/insert into "sets"/, 'run');
      expect(inserts).toHaveLength(1);
      const params = inserts[0].params as unknown[];
      expect(params.slice(0, 6)).toEqual([10, 1, 60, 10, 60, 8]);
    });

    it('starts at order index 0 when no sets exist', async () => {
      expoSqliteMock.rule({ match: /max\("order_index"\)/, rows: [[null]] });
      expoSqliteMock.rule({ match: /insert into "sets"/, changes: 1, lastInsertRowId: 78 });

      const set = await addSet(10, { weightKg: 30, reps: 12 });

      expect(set.orderIndex).toBe(0);
    });
  });

  describe('updateSet', () => {
    it('updates the provided fields', async () => {
      expoSqliteMock.rule({ match: /update "sets"/, changes: 1 });

      const result = await updateSet(20, { reps: 12 });

      expect(result).toBe(true);
      const updates = expoSqliteMock.callsMatching(/update "sets"/, 'run');
      expect(updates).toHaveLength(1);
      expect(updates[0].params).toEqual([12, 20]);
    });

    it('returns false when no row changed', async () => {
      expoSqliteMock.rule({ match: /update "sets"/, changes: 0 });

      await expect(updateSet(999, { reps: 1 })).resolves.toBe(false);
    });
  });

describe('deleteSet', () => {
    it('deletes a row and reports the change', async () => {
      expoSqliteMock.rule({ match: /delete from "sets"/, changes: 1 });
      await expect(deleteSet(20)).resolves.toBe(true);
    });

    it('returns false when the set does not exist', async () => {
      expoSqliteMock.rule({ match: /delete from "sets"/, changes: 0 });
      await expect(deleteSet(999)).resolves.toBe(false);
    });
  });

  describe('completeWorkout', () => {
    it('sets completed_at and returns the updated workout', async () => {
      expoSqliteMock.rule({ match: /update "workouts"/, changes: 1 });
      expoSqliteMock.rule({
        match: /from "workouts"/,
        rows: [[500, 9001, 'Push Day', null, STARTED_AT, COMPLETED_AT, STARTED_AT, STARTED_AT]],
      });

      const workout = await completeWorkout(500);

      expect(workout).toBeDefined();
      expect(workout!.id).toBe(500);
      expect(workout!.completedAt).toBe(COMPLETED_AT);

      const updates = expoSqliteMock.callsMatching(/update "workouts"/, 'run');
      expect(updates).toHaveLength(1);
      expect(typeof updates[0].params[0]).toBe('number');
      expect(updates[0].params[1]).toBe(500);
    });

    it('returns undefined when the workout does not exist', async () => {
      expoSqliteMock.rule({ match: /update "workouts"/, changes: 0 });

      await expect(completeWorkout(999)).resolves.toBeUndefined();
    });
  });

  describe('deleteWorkout', () => {
    it('deletes the workout row', async () => {
      expoSqliteMock.rule({ match: /delete from "workouts"/, changes: 1 });
      await expect(deleteWorkout(500)).resolves.toBe(true);
    });

    it('returns false when the workout does not exist', async () => {
      expoSqliteMock.rule({ match: /delete from "workouts"/, changes: 0 });
      await expect(deleteWorkout(999)).resolves.toBe(false);
    });
  });
});

describe('seedExerciseCatalog', () => {
  beforeEach(() => {
    expoSqliteMock.reset();
  });

  it('renames legacy English catalog rows to Spanish, keeping their ids', () => {
    expoSqliteMock.rule({
      match: /from "exercise_templates"/,
      rows: [
        [1, 'Bench Press'],
        [2, 'Squat'],
      ],
    });
    expoSqliteMock.rule({ match: /update "exercise_templates"/, changes: 1 });
    expoSqliteMock.rule({ match: /insert into "exercise_templates"/, rows: [] });

    seedExerciseCatalog(db);

    const updates = expoSqliteMock.callsMatching(/update "exercise_templates"/, 'run');
    expect(updates).toHaveLength(2);
    expect(updates[0].params).toEqual(['Press de banca', 1]);
    expect(updates[1].params).toEqual(['Sentadilla', 2]);
  });

  it('skips migration when the Spanish name already exists', () => {
    expoSqliteMock.rule({
      match: /from "exercise_templates"/,
      rows: [
        [1, 'Bench Press'],
        [2, 'Press de banca'],
      ],
    });
    expoSqliteMock.rule({ match: /update "exercise_templates"/, changes: 1 });

    seedExerciseCatalog(db);

    const updates = expoSqliteMock.callsMatching(/update "exercise_templates"/, 'run');
    expect(updates).toHaveLength(0);
  });

  it('inserts catalog rows that are not already present', () => {
    expoSqliteMock.rule({ match: /from "exercise_templates"/, rows: [] });
    expoSqliteMock.rule({ match: /insert into "exercise_templates"/, rows: [] });

    seedExerciseCatalog(db);

    const inserts = expoSqliteMock.callsMatching(/insert into "exercise_templates"/);
    expect(inserts).toHaveLength(1);
    const params = inserts[0].params as unknown[];
    expect(params).toContain('Press de banca');
    expect(params).toContain('Flexiones');
  });
});

describe('seedExampleRoutines', () => {
  const TEMPLATE_ROWS = [
    [1, 'Sentadilla'],
    [2, 'Press de banca'],
    [3, 'Remo con barra'],
    [4, 'Plancha'],
    [5, 'Press militar'],
    [6, 'Fondos'],
    [7, 'Extensión de tríceps en polea'],
    [8, 'Dominadas'],
    [9, 'Jalón al pecho'],
    [10, 'Curl con barra'],
  ];

  beforeEach(() => {
    expoSqliteMock.reset();
  });

  it('inserts the three example routines and resolves templates by name', async () => {
    expoSqliteMock.rule({ match: /from "exercise_templates"/, rows: TEMPLATE_ROWS });
    expoSqliteMock.rule({ match: /from "routines"/, rows: [] });
    expoSqliteMock.rule({ match: /insert into "routines"/, rows: [[1]] });
    expoSqliteMock.rule({ match: /insert into "routine_exercises"/, changes: 12 });

    const inserted = await seedExampleRoutines();

    expect(inserted).toBe(3);

    const routineInserts = expoSqliteMock.callsMatching(/insert into "routines"/);
    expect(routineInserts).toHaveLength(3);
    // Los dos últimos params son created_at/updated_at (timestamps); se validan
    // solo los tres primeros para no depender de la hora exacta.
    expect(routineInserts[0].params.slice(0, 3)).toEqual(['Full Body', null, 'strength']);
    expect(routineInserts[1].params.slice(0, 3)).toEqual(['Push', null, 'hypertrophy']);
    expect(routineInserts[2].params.slice(0, 3)).toEqual(['Pull', null, 'hypertrophy']);

    const exerciseInserts = expoSqliteMock.callsMatching(/insert into "routine_exercises"/);
    expect(exerciseInserts).toHaveLength(3);
    const fullBodyParams = exerciseInserts[0].params as unknown[];
    expect(fullBodyParams).toContain(4);
    expect(fullBodyParams).toContain(30);
  });

  it('does not duplicate routines that already exist', async () => {
    expoSqliteMock.rule({ match: /from "exercise_templates"/, rows: TEMPLATE_ROWS });
    expoSqliteMock.rule({ match: /from "routines"/, rows: [] });
    expoSqliteMock.rule({ match: /insert into "routines"/, rows: [[1]] });
    expoSqliteMock.rule({ match: /insert into "routine_exercises"/, changes: 12 });

    await expect(seedExampleRoutines()).resolves.toBe(3);

    expoSqliteMock.reset();

    expoSqliteMock.rule({ match: /from "exercise_templates"/, rows: TEMPLATE_ROWS });
    expoSqliteMock.rule({ match: /from "routines"/, rows: [[1], [2], [3]] });
    expoSqliteMock.rule({ match: /insert into "routines"/, rows: [[1]] });
    expoSqliteMock.rule({ match: /insert into "routine_exercises"/, changes: 12 });

    const inserted = await seedExampleRoutines();

    expect(inserted).toBe(0);
    expect(expoSqliteMock.callsMatching(/insert into "routines"/)).toHaveLength(0);
    expect(expoSqliteMock.callsMatching(/insert into "routine_exercises"/)).toHaveLength(0);
  });

  it('skips exercises whose template is missing from the catalog', async () => {
    const rowsWithoutPlancha = TEMPLATE_ROWS.filter((row) => row[1] !== 'Plancha');
    expoSqliteMock.rule({ match: /from "exercise_templates"/, rows: rowsWithoutPlancha });
    expoSqliteMock.rule({ match: /from "routines"/, rows: [] });
    expoSqliteMock.rule({ match: /insert into "routines"/, rows: [[1]] });
    expoSqliteMock.rule({ match: /insert into "routine_exercises"/, changes: 11 });

    const inserted = await seedExampleRoutines();

    expect(inserted).toBe(3);

    const fullBodyInsert = expoSqliteMock.callsMatching(/insert into "routine_exercises"/)[0];
    // Full Body queda con 3 ejercicios (se omite Plancha): 3 filas x 6 columnas.
    expect(fullBodyInsert.params).toHaveLength(18);
    expect(fullBodyInsert.params).not.toContain(4);
  });
});