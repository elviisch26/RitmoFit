import { render, screen } from '@testing-library/react-native';

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

describe('RitmoFit App', () => {
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
});