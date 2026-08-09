import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { PermissionStatus } from 'expo';
import * as Notifications from 'expo-notifications';

import { useReminderConfig } from '../hooks/useReminderConfig';
import {
  activateReminder,
  reactivateReminder,
  updateReminderScheduledFor,
} from '../repository/notificationsRepository';
import { scheduleReminder, cancelScheduledReminder } from '../scheduler';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import type { ReminderConfig } from '../types';

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('../hooks/useReminderConfig', () => ({
  useReminderConfig: jest.fn(),
}));

jest.mock('../repository/notificationsRepository', () => ({
  activateReminder: jest.fn(),
  reactivateReminder: jest.fn(),
  cancelReminder: jest.fn(),
  updateReminderScheduledFor: jest.fn(),
}));

jest.mock('../scheduler', () => ({
  scheduleReminder: jest.fn(),
  cancelScheduledReminder: jest.fn(),
}));

const mockedRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockedUseReminderConfig = jest.mocked(useReminderConfig);
const mockedActivate = jest.mocked(activateReminder);
const mockedReactivate = jest.mocked(reactivateReminder);
const mockedUpdateScheduledFor = jest.mocked(updateReminderScheduledFor);
const mockedSchedule = jest.mocked(scheduleReminder);
const mockedCancelSchedule = jest.mocked(cancelScheduledReminder);
const openSettingsSpy = jest.spyOn(Linking, 'openSettings');

const workoutOff: ReminderConfig = {
  type: 'workout_reminder',
  title: 'Hora de entrenar',
  body: 'Es momento de completar el entrenamiento de hoy.',
  hour: 8,
  minute: 0,
  enabled: false,
};
const hydrationOff: ReminderConfig = {
  type: 'hydration',
  title: 'Hidratación',
  body: 'Momento de beber agua.',
  hour: 14,
  minute: 0,
  enabled: false,
};
const restOff: ReminderConfig = {
  type: 'rest',
  title: 'Descanso',
  body: 'Es momento de descansar.',
  hour: 22,
  minute: 0,
  enabled: false,
};

const allOff = [workoutOff, hydrationOff, restOff];

describe('NotificationSettingsScreen (REMINDERS-1/3/4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseReminderConfig.mockReturnValue({
      data: allOff,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useReminderConfig>);
    useNotificationStore.setState({ reminders: [] });
    openSettingsSpy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    useNotificationStore.setState({ reminders: [] });
    cleanup();
  });

  it('shows three reminder rows, all toggles OFF on a fresh install (REMINDERS-1)', async () => {
    await render(<NotificationSettingsScreen />);

    expect(screen.getByRole('switch', { name: 'Entrenamiento' })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Hidratación' })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Descanso' })).toBeOnTheScreen();

    expect(screen.getByRole('switch', { name: 'Entrenamiento' }).props.value).toBe(false);
    expect(screen.getByRole('switch', { name: 'Hidratación' }).props.value).toBe(false);
    expect(screen.getByRole('switch', { name: 'Descanso' }).props.value).toBe(false);

    // No schedule was created for any type.
    expect(mockedSchedule).not.toHaveBeenCalled();
  });

  it('requests permission and schedules when the first toggle turns ON (REMINDERS-3 granted)', async () => {
    mockedRequestPermissions.mockResolvedValue({ status: PermissionStatus.GRANTED });

    await render(<NotificationSettingsScreen />);

    const switchEl = screen.getByRole('switch', { name: 'Entrenamiento' });
    await fireEvent(switchEl, 'valueChange', true);

    await waitFor(() => {
      expect(mockedRequestPermissions).toHaveBeenCalledTimes(1);
      expect(mockedActivate).toHaveBeenCalledWith('workout_reminder', 8, 0, expect.any(Date));
      expect(mockedSchedule).toHaveBeenCalledWith('workout_reminder', expect.any(Date));
    });

    // The row stays visually ON after the asynchronous permission flow.
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Entrenamiento' }).props.value).toBe(true);
    });
  });

  it('keeps the UI usable on denied permission: warning, deep link, no local schedule (REMINDERS-3 denied)', async () => {
    mockedRequestPermissions.mockResolvedValue({ status: PermissionStatus.DENIED });

    await render(<NotificationSettingsScreen />);

    const switchEl = screen.getByRole('switch', { name: 'Entrenamiento' });
    await fireEvent(switchEl, 'valueChange', true);

    // Warning + deep link are visible, toggle keeps the visual configured state.
    await waitFor(() => {
      expect(
        screen.getByText('Las notificaciones están desactivadas en los ajustes del sistema'),
      ).toBeOnTheScreen();
    });
    expect(screen.getByRole('button', { name: 'Abrir ajustes' })).toBeOnTheScreen();
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Entrenamiento' }).props.value).toBe(true);
    });

    // NO local schedule registered on denied.
    expect(mockedSchedule).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Abrir ajustes' }));
    expect(openSettingsSpy).toHaveBeenCalled();

    // The time field stays editable on denied.
    await fireEvent.press(screen.getByLabelText('Cambiar hora de Entrenamiento'));
    expect(screen.getByLabelText('Hora')).toBeOnTheScreen();
  });

  it('persists a new time and re-arms the reminder when the picker confirms (REMINDERS-4)', async () => {
    const workoutOn: ReminderConfig = { ...workoutOff, hour: 20, minute: 0, enabled: true };
    mockedUseReminderConfig.mockReturnValue({
      data: [workoutOn, hydrationOff, restOff],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useReminderConfig>);

    await render(<NotificationSettingsScreen />);

    await fireEvent.press(screen.getByLabelText('Cambiar hora de Entrenamiento'));
    await fireEvent.press(screen.getByLabelText('Hora 21'));
    await fireEvent.press(screen.getByLabelText('Minuto 0'));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(mockedReactivate).toHaveBeenCalledWith('workout_reminder', 21, 0, expect.any(Date));
      // schedule local reemplaza la prevista (cancela la vieja, programa la nueva por 21:00)
      expect(mockedCancelSchedule).toHaveBeenCalledWith('workout_reminder');
      expect(mockedSchedule).toHaveBeenCalledWith('workout_reminder', expect.any(Date));
    });
    expect(mockedUpdateScheduledFor).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Cambiar hora de Entrenamiento')).toHaveTextContent('21:00');
  });
});