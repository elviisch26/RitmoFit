import { PermissionStatus } from 'expo';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 5 },
  getPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'reminder-workout_reminder'),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(async () => null),
}));

jest.mock('./repository/notificationsRepository', () => ({
  getReminderConfigs: jest.fn(),
  updateReminderScheduledFor: jest.fn(async () => {}),
}));

import * as Notifications from 'expo-notifications';
import {
  getReminderConfigs,
  updateReminderScheduledFor,
} from './repository/notificationsRepository';
import {
  cancelScheduledReminder,
  reconcileReminders,
  reminderIdentifier,
  scheduleReminder,
} from './scheduler';
import { REMINDER_CONTENT } from './types';
import type { ReminderConfig } from './types';

const workoutContent = REMINDER_CONTENT.workout_reminder;

const enabledWorkout: ReminderConfig = {
  type: 'workout_reminder',
  title: workoutContent.title,
  body: workoutContent.body,
  hour: 12,
  minute: 0,
  enabled: true,
};

const TUE_14 = new Date(2026, 2, 17, 14, 0, 0); // now: Tuesday Mar 17 14:00 local
const NEXT_DUE = new Date(2026, 2, 18, 12, 0, 0); // resolveNextOccurrence(12:00, now=Mar 17 14:00)
const ALREADY_PASSED = new Date(2026, 2, 17, 10, 0, 0); // before now

const mockedSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockedCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const mockedGetAll = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const mockedPerms = Notifications.getPermissionsAsync as jest.Mock;
const mockedChannel = Notifications.setNotificationChannelAsync as jest.Mock;
const mockedConfigs = getReminderConfigs as jest.Mock;
const mockedUpdate = updateReminderScheduledFor as jest.Mock;

describe('notifications scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConfigs.mockResolvedValue([enabledWorkout]);
    mockedGetAll.mockResolvedValue([]);
    mockedPerms.mockResolvedValue({
      status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
  });

  it('uses a deterministic identifier per reminder type (D6)', () => {
    expect(reminderIdentifier('hydration')).toBe('reminder-hydration');
    expect(reminderIdentifier('rest')).toBe('reminder-rest');
  });

  it('schedules with the deterministic identifier and DATE trigger', async () => {
    await scheduleReminder('workout_reminder', NEXT_DUE);

    expect(mockedSchedule).toHaveBeenCalledWith({
      identifier: 'reminder-workout_reminder',
      content: { title: workoutContent.title, body: workoutContent.body },
      trigger: { type: 'date', date: NEXT_DUE },
    });
    // Android channel created once for the first schedule (REMINDERS-1 naming).
    expect(mockedChannel).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ name: 'Recordatorios' }),
    );
  });

  it('cancels the pending notification for the type', async () => {
    await cancelScheduledReminder('hydration');
    expect(mockedCancel).toHaveBeenCalledWith('reminder-hydration');
  });

  it('reconcile schedules a missing reminder and persists the occurrence (REMINDERS-5)', async () => {
    await reconcileReminders(TUE_14);

    expect(mockedSchedule).toHaveBeenCalledWith({
      identifier: 'reminder-workout_reminder',
      content: { title: workoutContent.title, body: workoutContent.body },
      trigger: { type: 'date', date: NEXT_DUE },
    });
    expect(mockedUpdate).toHaveBeenCalledWith('workout_reminder', NEXT_DUE);
    expect(mockedCancel).not.toHaveBeenCalled();
  });

  it('reconcile re-arms a reminder whose pending date already passed (REMINDERS-5)', async () => {
    mockedGetAll.mockResolvedValue([
      {
        identifier: 'reminder-workout_reminder',
        content: { title: 'x', body: 'y' },
        trigger: { type: 'date', date: ALREADY_PASSED.getTime() },
      },
    ]);

    await reconcileReminders(TUE_14);

    expect(mockedCancel).toHaveBeenCalledWith('reminder-workout_reminder');
    expect(mockedSchedule).toHaveBeenCalledTimes(1);
    expect(mockedSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ date: NEXT_DUE }),
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith('workout_reminder', NEXT_DUE);
  });

  it('reconcile is a no-op when the pending schedule is still in the future', async () => {
    mockedGetAll.mockResolvedValue([
      {
        identifier: 'reminder-workout_reminder',
        content: { title: 'x', body: 'y' },
        trigger: { type: 'date', date: NEXT_DUE.getTime() },
      },
    ]);

    await reconcileReminders(TUE_14);

    expect(mockedCancel).not.toHaveBeenCalled();
    expect(mockedSchedule).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('reconcile does nothing when the permission was denied (REMINDERS-5/3)', async () => {
    mockedPerms.mockResolvedValue({
      status: PermissionStatus.DENIED,
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });

    await reconcileReminders(TUE_14);

    expect(mockedGetAll).not.toHaveBeenCalled();
    expect(mockedSchedule).not.toHaveBeenCalled();
    expect(mockedCancel).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });
});