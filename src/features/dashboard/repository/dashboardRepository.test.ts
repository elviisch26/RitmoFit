import { expoSqliteMock } from '../../workouts/tests/support/sqliteMock';

jest.mock('expo-sqlite', () => {
  const { expoSqliteMock: mock } = jest.requireActual('../../workouts/tests/support/sqliteMock');
  return { openDatabaseSync: mock.openDatabaseSync };
});

import { getDashboardSummary } from './dashboardRepository';

/** Local millis helper. */
function at(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime();
}

const NOW = new Date(2026, 0, 15, 10, 0, 0); // Thursday Jan 15 2026 (local)

describe('dashboardRepository', () => {
  beforeEach(() => {
    expoSqliteMock.reset();
  });

  it('combines the weekly KPIs with the computed streak', async () => {
    expoSqliteMock.rule({
      match: /count\("sets"\."id"\)/,
      rows: [[10, at(2026, 1, 12, 9), at(2026, 1, 12, 10), 4]],
    });
    expoSqliteMock.rule({
      match: /from "workouts"/,
      rows: [[at(2026, 1, 13, 10)], [at(2026, 1, 14, 11)]], // Tue + Wed, no workout today
    });

    const summary = await getDashboardSummary(NOW);

    expect(summary).toEqual({
      workouts: 1,
      sets: 4,
      minutes: 60,
      streak: { current: 2, best: 2 },
    });
  });

  it('reports a 0/0 streak when no workout has been completed', async () => {
    expoSqliteMock.rule({
      match: /count\("sets"\."id"\)/,
      rows: [[11, at(2026, 1, 12, 9), at(2026, 1, 12, 10), 3]],
    });
    expoSqliteMock.rule({ match: /from "workouts"/, rows: [] });

    const summary = await getDashboardSummary(NOW);

    expect(summary.streak).toEqual({ current: 0, best: 0 });
    expect(summary.workouts).toBe(1);
  });
});