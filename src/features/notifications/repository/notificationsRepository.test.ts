import { expoSqliteMock } from '../../workouts/tests/support/sqliteMock';

jest.mock('expo-sqlite', () => {
  const { expoSqliteMock: mock } = jest.requireActual(
    '../../workouts/tests/support/sqliteMock',
  );
  return { openDatabaseSync: mock.openDatabaseSync };
});

import {
  activateReminder,
  cancelReminder,
  getReminderConfigs,
  reactivateReminder,
} from './notificationsRepository';

const TUE_10 = new Date(2026, 2, 17, 10, 0, 0); // Tuesday Mar 17 2026, 10:00 local
const TUE_14 = new Date(2026, 2, 17, 14, 0, 0);

function row(
  id: number,
  type: unknown,
  title: string,
  body: string,
  scheduledForMs: number,
  status: 'scheduled' | 'sent' | 'cancelled' | 'dismissed',
  userId: unknown = null,
): unknown[] {
  return [id, userId, type, title, body, scheduledForMs, status, 1, 2];
}

describe('notificationsRepository', () => {
  beforeEach(() => {
    expoSqliteMock.reset();
  });

  it('derives hour/minute from scheduledFor and marks the type enabled (REMINDERS-2)', async () => {
    expoSqliteMock.rule({
      match: /from "notifications"/,
      rows: [
        row(1, 'workout_reminder', 'Hora de entrenar', 'Cuerpo', new Date(2026, 2, 17, 12, 0).getTime(), 'scheduled'),
      ],
    });

    const configs = await getReminderConfigs();

    expect(configs).toEqual([
      {
        type: 'workout_reminder',
        title: 'Hora de entrenar',
        body: 'Cuerpo',
        hour: 12,
        minute: 0,
        enabled: true,
      },
      {
        type: 'hydration',
        title: 'Hidratación',
        body: 'Momento de beber agua para mantenerse hidratado.',
        hour: 14,
        minute: 0,
        enabled: false,
      },
      {
        type: 'rest',
        title: 'Descanso',
        body: 'Es momento de descansar. El cuerpo se recupera mientras duermes.',
        hour: 22,
        minute: 0,
        enabled: false,
      },
    ]);
  });

  it('keeps a cancelled row with its stored time but reports it disabled (S3)', async () => {
    expoSqliteMock.rule({
      match: /from "notifications"/,
      rows: [row(1, 'hydration', 'Hidratación', 'Cuerpo', new Date(2026, 2, 17, 7, 30).getTime(), 'cancelled')],
    });

    const configs = await getReminderConfigs();

    expect(configs[1]).toEqual({
      type: 'hydration',
      title: 'Hidratación',
      body: 'Cuerpo',
      hour: 7,
      minute: 30,
      enabled: false,
    });
  });

  it('activateReminder upserts exactly one row per type with a scheduled occurrence (REMINDERS-2)', async () => {
    expoSqliteMock.rule({ match: /from "notifications"/, rows: [] });
    expoSqliteMock.rule({ match: /insert into "notifications"/, changes: 1, lastInsertRowId: 1 });

    await activateReminder('workout_reminder', 8, 0, TUE_10);
    await activateReminder('hydration', 14, 0, TUE_10);
    await activateReminder('rest', 22, 45, TUE_10);

    const inserts = expoSqliteMock.callsMatching(/insert into "notifications"/, 'run');
    expect(inserts).toHaveLength(3);
    expect(inserts.map((call) => call.params[0]).sort()).toEqual([
      'hydration',
      'rest',
      'workout_reminder',
    ]);
    // scheduledFor = next occurrence from the injected clock (Mar 17 22:45, still ahead of 10:00),
    // bound as epoch millis by the timestamp_ms column mode.
    const rest = inserts.find((call) => call.params[0] === 'rest');
    expect(rest?.params[3]).toBe(new Date(2026, 2, 17, 22, 45, 0, 0).getTime());
    expect(rest?.params[4]).toBe('scheduled');
  });

  it('re-activating an existing type updates its row instead of inserting a second one', async () => {
    expoSqliteMock.rule({ match: /from "notifications"/, rows: [] });
    expoSqliteMock.rule({ match: /insert into "notifications"/, changes: 1 });

    await activateReminder('hydration', 14, 0, TUE_10);
    expect(expoSqliteMock.callsMatching(/insert into "notifications"/, 'run')).toHaveLength(1);

    expoSqliteMock.reset();
    expoSqliteMock.rule({ match: /where "notifications"\."type" = \?/, rows: [[1, 'hydration']] });
    expoSqliteMock.rule({ match: /update "notifications"/, changes: 1 });

    await reactivateReminder('hydration', 15, 30, TUE_14);

    expect(expoSqliteMock.callsMatching(/insert into "notifications"/, 'run')).toHaveLength(0);
    const updates = expoSqliteMock.callsMatching(/update "notifications"/, 'run');
    expect(updates).toHaveLength(1);
    // update set order: title, body, scheduled_for, status, updated_at.
    // now = Mar 17 14:00, hour 15:30 still ahead → next occurrence today.
    expect(updates[0].params[2]).toBe(new Date(2026, 2, 17, 15, 30, 0, 0).getTime());
    expect(updates[0].params[3]).toBe('scheduled');
  });

  it('cancelReminder keeps the row and only flips its status to cancelled (S3)', async () => {
    expoSqliteMock.rule({ match: /update "notifications"/, changes: 1 });

    await cancelReminder('hydration');

    const updates = expoSqliteMock.callsMatching(/update "notifications"/, 'run');
    expect(updates).toHaveLength(1);
    expect(updates[0].params[0]).toBe('cancelled');
  });
});