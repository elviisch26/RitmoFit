import { expoSqliteMock } from '@/features/workouts/tests/support/sqliteMock';

jest.mock('expo-sqlite', () => {
  const { expoSqliteMock: mock } = jest.requireActual(
    '@/features/workouts/tests/support/sqliteMock',
  );
  return { openDatabaseSync: mock.openDatabaseSync };
});

import { getExerciseLoadSeries, getProgressKpis, listExerciseOptions } from '../repository/progressRepository';

/** Helper de millis locales (evita la deriva UTC en las aserciones de límites de semana). */
function at(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

const NOW = new Date(2026, 0, 15, 10, 0, 0); // Jueves 15 de enero de 2026

describe('progressRepository (PROG-1: thin wrapper over statisticsRepository)', () => {
  beforeEach(() => {
    expoSqliteMock.reset();
  });

  it('press de banca as default picker (PROGRESS-2)', async () => {
    expoSqliteMock.rule({
      match: /from "exercise_templates"/,
      rows: [[2, 'Press de banca']],
    });

    const options = await listExerciseOptions();

    expect(options).toEqual([{ id: 2, name: 'Press de banca' }]);
    // Regla de selección por default: la primera opción con sesiones es el default.
    expect(options[0].name).toBe('Press de banca');
  });

  it('keeps the catalog order so the first entry stays the default (triangulation)', async () => {
    expoSqliteMock.rule({
      match: /from "exercise_templates"/,
      rows: [
        [1, 'Flexiones'],
        [2, 'Press de banca'],
      ],
    });

    const options = await listExerciseOptions();

    expect(options.map((option) => option.name)).toEqual(['Flexiones', 'Press de banca']);
    expect(options[0].id).toBe(1);
  });

  it('returns an empty picker when no exercise has sessions (empty global)', async () => {
    expoSqliteMock.rule({ match: /from "exercise_templates"/, rows: [] });

    const options = await listExerciseOptions();

    expect(options).toEqual([]);
  });

  it('exposes weekly KPIs identical to the dashboard (PROGRESS-1)', async () => {
    expoSqliteMock.rule({
      match: /count\("sets"\."id"\)/,
      rows: [
        [10, at(2026, 1, 12, 9), at(2026, 1, 12, 10, 30), 4],
        [11, at(2026, 1, 13, 9), at(2026, 1, 13, 10), 4],
        [12, at(2026, 1, 14, 9), at(2026, 1, 14, 9, 30), 5],
      ],
    });

    const kpis = await getProgressKpis(NOW);

    expect(kpis).toEqual({ workouts: 3, sets: 13, minutes: 180 });

    // La ventana semanal debe ser el mismo lunes->domingo LOCAL que usa el dashboard.
    const call = expoSqliteMock.callsMatching(/count\("sets"\."id"\)/)[0];
    expect(call.params).toEqual([at(2026, 1, 12, 0), at(2026, 1, 19, 0)]);
  });

  it('builds the chronological load series 60/65/70 forwards the exercise id (PROGRESS-3)', async () => {
    expoSqliteMock.rule({
      match: /max\("sets"\."weight_kg"\)/,
      rows: [
        [10, at(2026, 1, 12, 19), 60],
        [11, at(2026, 1, 14, 19), 65],
        [12, at(2026, 1, 16, 19), 70],
      ],
    });

    const series = await getExerciseLoadSeries(7);

    expect(series).toEqual([
      { date: '12/01', weightKg: 60 },
      { date: '14/01', weightKg: 65 },
      { date: '16/01', weightKg: 70 },
    ]);
    const call = expoSqliteMock.callsMatching(/max\("sets"\."weight_kg"\)/)[0];
    expect(call.params[0]).toBe(7);
  });

  it('uses the session max and a different exercise id (triangulation)', async () => {
    expoSqliteMock.rule({
      match: /max\("sets"\."weight_kg"\)/,
      rows: [[50, at(2026, 1, 13, 19), 70]],
    });

    const series = await getExerciseLoadSeries(5);

    expect(series).toEqual([{ date: '13/01', weightKg: 70 }]);
    expect(expoSqliteMock.callsMatching(/max\("sets"\."weight_kg"\)/)[0].params[0]).toBe(5);
  });
});