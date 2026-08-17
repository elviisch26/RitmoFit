import { expoSqliteMock } from '../tests/support/sqliteMock';

jest.mock('expo-sqlite', () => {
  const { expoSqliteMock: mock } = jest.requireActual('../tests/support/sqliteMock');
  return { openDatabaseSync: mock.openDatabaseSync };
});

import {
  getLoadSeries,
  getWeeklyStats,
  getWorkoutCompletedMs,
  listExercisesWithSessions,
} from './statisticsRepository';

/** Helper de millis locales (evita la deriva UTC en las aserciones de límites de semana). */
function at(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

const NOW = new Date(2026, 0, 15, 10, 0, 0); // Jueves 15 de enero de 2026
// Semana actual (lun-dom local): Lun 12 ene -> Dom 18 ene 2026

describe('statisticsRepository', () => {
  beforeEach(() => {
    expoSqliteMock.reset();
  });

  describe('getWeeklyStats', () => {
    it('aggregates 3 completed workouts, 13 sets and 180 minutes (floor)', async () => {
      expoSqliteMock.rule({
        match: /count\("sets"\."id"\)/,
        rows: [
          // [id, startedAt, completedAt, setCount]
          [10, at(2026, 1, 12, 9), at(2026, 1, 12, 10, 30), 4],
          [11, at(2026, 1, 13, 9), at(2026, 1, 13, 10), 4],
          [12, at(2026, 1, 14, 9), at(2026, 1, 14, 9, 30), 5],
        ],
      });

      const stats = await getWeeklyStats(NOW);

      expect(stats).toEqual({ workouts: 3, sets: 13, minutes: 180 });

      // La ventana semanal debe ser LOCALmente lunes 00:00 -> lunes siguiente 00:00.
      const call = expoSqliteMock.callsMatching(/count\("sets"\."id"\)/)[0];
      const params = call.params as number[];
      expect(params).toHaveLength(2);
      expect(params[0]).toBe(at(2026, 1, 12, 0));
      expect(params[1]).toBe(at(2026, 1, 19, 0));
      expect(call.sql).toContain('is not null');
    });

    it('floors partial minutes of a session', async () => {
      // Transcurren 90 minutos y 30 segundos -> piso -> 90
      const partialEnd = new Date(2026, 0, 12, 10, 30, 30, 0).getTime();
      expoSqliteMock.rule({
        match: /count\("sets"\."id"\)/,
        rows: [[13, at(2026, 1, 12, 9), partialEnd, 2]],
      });

      const stats = await getWeeklyStats(NOW);

      expect(stats.minutes).toBe(90);
    });

    it('bounds the week window to Monday so the previous Sunday never counts', async () => {
      // El motor SQL aplica la ventana >= lunes / < lunes siguiente; el mock
      // devuelve filas ya filtradas, por lo que solo está el entrenamiento del lunes.
      expoSqliteMock.rule({
        match: /count\("sets"\."id"\)/,
        rows: [[21, at(2026, 1, 12, 9), at(2026, 1, 12, 10), 3]],
      });

      const stats = await getWeeklyStats(NOW);

      expect(stats).toEqual({ workouts: 1, sets: 3, minutes: 60 });

      const call = expoSqliteMock.callsMatching(/count\("sets"\."id"\)/)[0];
      expect(call.sql).toContain('"completed_at" >= ?');
      expect(call.sql).toContain('"completed_at" < ?');
      expect(call.params).toEqual([at(2026, 1, 12, 0), at(2026, 1, 19, 0)]);
    });

    it('excludes workouts with a NULL completedAt', async () => {
      expoSqliteMock.rule({
        match: /count\("sets"\."id"\)/,
        rows: [[30, at(2026, 1, 12, 9), at(2026, 1, 12, 10), 3]],
      });

      const stats = await getWeeklyStats(NOW);

      expect(stats).toEqual({ workouts: 1, sets: 3, minutes: 60 });

      const call = expoSqliteMock.callsMatching(/count\("sets"\."id"\)/)[0];
      expect(call.sql).toContain('is not null');
    });

    it('reports 0 sets for a completed workout without sets', async () => {
      expoSqliteMock.rule({
        match: /count\("sets"\."id"\)/,
        rows: [[40, at(2026, 1, 12, 9), at(2026, 1, 12, 10), 0]],
      });

      const stats = await getWeeklyStats(NOW);

      expect(stats).toEqual({ workouts: 1, sets: 0, minutes: 60 });
    });
  });

  describe('getWorkoutCompletedMs', () => {
    it('returns the local millis of every completed workout', async () => {
      expoSqliteMock.rule({
        match: /from "workouts"/,
        rows: [[at(2026, 1, 12, 10)], [at(2026, 1, 14, 11)]],
      });

      const ms = await getWorkoutCompletedMs();

      expect(ms).toEqual([at(2026, 1, 12, 10), at(2026, 1, 14, 11)]);

      const call = expoSqliteMock.callsMatching(/from "workouts"/)[0];
      expect(call.sql).toContain('is not null');
    });

    it('returns an empty list when no workout is completed', async () => {
      expoSqliteMock.rule({ match: /from "workouts"/, rows: [] });

      await expect(getWorkoutCompletedMs()).resolves.toEqual([]);
    });
  });

  describe('getLoadSeries', () => {
    it('returns the max weight per session in chronological order', async () => {
      expoSqliteMock.rule({
        match: /max\("sets"\."weight_kg"\)/,
        rows: [
          [10, at(2026, 1, 12, 19), 60],
          [11, at(2026, 1, 14, 19), 65],
          [12, at(2026, 1, 16, 19), 70],
        ],
      });

      const series = await getLoadSeries(1);

      expect(series).toEqual([
        { date: '12/01', weightKg: 60 },
        { date: '14/01', weightKg: 65 },
        { date: '16/01', weightKg: 70 },
      ]);

      const call = expoSqliteMock.callsMatching(/max\("sets"\."weight_kg"\)/)[0];
      expect(call.params[0]).toBe(1); // filtro por id de ejercicio
      expect(call.sql).toContain('group by');
      expect(call.sql).toMatch(/order by "workouts"\."completed_at"/);
    });

    it('uses the session max when a session mixes weights', async () => {
      expoSqliteMock.rule({
        match: /max\("sets"\."weight_kg"\)/,
        rows: [[50, at(2026, 1, 13, 19), 70]],
      });

      const series = await getLoadSeries(5);

      expect(series).toEqual([{ date: '13/01', weightKg: 70 }]);
      expect(expoSqliteMock.callsMatching(/max\("sets"\."weight_kg"\)/)).toHaveLength(1);
    });

    it('filters weight 0 and returns no points for bodyweight-only sessions', async () => {
      expoSqliteMock.rule({ match: /max\("sets"\."weight_kg"\)/, rows: [] });

      const series = await getLoadSeries(2);

      expect(series).toEqual([]);

      const call = expoSqliteMock.callsMatching(/max\("sets"\."weight_kg"\)/)[0];
      expect(call.sql).toMatch(/weight_kg" >/);
    });

    it('excludes incomplete workouts from the series', async () => {
      expoSqliteMock.rule({
        match: /max\("sets"\."weight_kg"\)/,
        rows: [[60, at(2026, 1, 15, 19), 65]],
      });

      const series = await getLoadSeries(8);

      expect(series).toEqual([{ date: '15/01', weightKg: 65 }]);

      const call = expoSqliteMock.callsMatching(/max\("sets"\."weight_kg"\)/)[0];
      expect(call.sql).toContain('is not null');
    });
  });

  describe('listExercisesWithSessions', () => {
    it('returns distinct templates with at least one completed session, ordered by name', async () => {
      expoSqliteMock.rule({
        match: /from "exercise_templates"/,
        rows: [
          [1, 'Flexiones'],
          [2, 'Press de banca'],
        ],
      });

      const exercises = await listExercisesWithSessions();

      expect(exercises).toEqual([
        { id: 1, name: 'Flexiones' },
        { id: 2, name: 'Press de banca' },
      ]);

      const call = expoSqliteMock.callsMatching(/from "exercise_templates"/)[0];
      expect(call.sql).toContain('is not null');
      expect(call.sql.toLowerCase()).toContain('order by');
    });

    it('returns an empty list when no exercise has sessions', async () => {
      expoSqliteMock.rule({ match: /from "exercise_templates"/, rows: [] });

      await expect(listExercisesWithSessions()).resolves.toEqual([]);
    });
  });
});