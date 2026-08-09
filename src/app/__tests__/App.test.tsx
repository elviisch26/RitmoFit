import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { App } from '@/app';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    const stmt = {
      runSync: jest.fn(() => ({ changes: 0, lastInsertRowId: 0 })),
      allSync: jest.fn(() => []),
      getSync: jest.fn(() => null),
      executeSync: jest.fn(() => []),
      executeForRawResultSync: jest.fn(() => ({ getAllSync: jest.fn(() => []) })),
    };
    return {
      execSync: jest.fn(),
      prepareSync: jest.fn(() => stmt),
      getAllSync: jest.fn(() => []),
      getFirstSync: jest.fn(() => null),
      runSync: jest.fn(() => ({ changes: 0, lastInsertRowId: 0 })),
    };
  }),
}));

// App boot runs the notification reconciler, which speaks to expo-notifications
// (NOTI-10). jest.setup has no global mock, so this suite provides a local one.
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 5 },
  getPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

// The boot reconciliation is wired in App.tsx; spy on the real module so the
// assertion proves App actually invoked it (NOTI-10).
import * as Notifications from 'expo-notifications';

import { reconcileReminders } from '@/features/notifications/scheduler';

jest.mock('@/features/notifications/scheduler', () => {
  const actual = jest.requireActual('@/features/notifications/scheduler');
  return { ...actual, reconcileReminders: jest.fn() };
});

const mockedReconcile = jest.mocked(reconcileReminders);
const mockedGetAllScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

describe('RitmoFit App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAllScheduled.mockResolvedValue([]);
  });

  it('runs notification boot reconciliation once on mount (NOTI-10/REMINDERS-5)', async () => {
    await render(<App />);

    await waitFor(() => {
      expect(mockedReconcile).toHaveBeenCalledTimes(1);
      expect(mockedReconcile).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  it('renders the Dashboard tab screen', async () => {
    await render(<App />);

    expect(screen.getByRole('header', { name: 'Inicio' })).toBeOnTheScreen();
  });

  it('renders the Dashboard empty state with zero workouts (DASHBOARD-4)', async () => {
    await render(<App />);

    expect(await screen.findByText('Todavía no registraste entrenamientos')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Crear mi primera rutina' })).toBeOnTheScreen();
  });

  it('renders all four tab bar buttons', async () => {
    await render(<App />);

    expect(screen.getByRole('button', { name: /Inicio/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Rutinas/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Progreso/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Ajustes/ })).toBeOnTheScreen();
  });

  it('opens the reminder settings panel from the Ajustes tab (NOTI-9/REMINDERS-7)', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByRole('button', { name: /Ajustes/ }));

    expect(
      await screen.findByRole('switch', { name: 'Entrenamiento' }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Hidratación' })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Descanso' })).toBeOnTheScreen();
  });
});