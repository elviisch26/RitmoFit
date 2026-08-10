import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { DashboardScreen } from '../screens/DashboardScreen';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

jest.mock('../hooks/useDashboardSummary', () => ({
  useDashboardSummary: jest.fn(),
}));

const mockNavigateSpy = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigateSpy }),
}));

const mockUseDashboardSummary = jest.mocked(useDashboardSummary);

const summaryData = { workouts: 3, sets: 13, minutes: 180, streak: { current: 3, best: 5 } };
const summaryBigger = { workouts: 4, sets: 16, minutes: 210, streak: { current: 5, best: 8 } };
const summaryEmpty = { workouts: 0, sets: 0, minutes: 0, streak: { current: 0, best: 0 } };

describe('DashboardScreen (DASHBOARD-4/5/6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders weekly KPI cards and the streak badge (DASHBOARD-5)', async () => {
    mockUseDashboardSummary.mockReturnValue({
      data: summaryData,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSummary>);

    await render(<DashboardScreen />);

    expect(screen.getByLabelText('Entrenos: 3')).toBeOnTheScreen();
    expect(screen.getByLabelText('Series: 13')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tiempo: 180 minutos')).toBeOnTheScreen();
    expect(screen.getByLabelText('Racha actual: 3 días')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mejor racha: 5 días')).toBeOnTheScreen();
    expect(screen.queryByText('Todavía no registraste entrenamientos')).toBeNull();
  });

  it('renders updated values for a different summary (triangulation)', async () => {
    mockUseDashboardSummary.mockReturnValue({
      data: summaryBigger,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSummary>);

    await render(<DashboardScreen />);

    expect(screen.getByLabelText('Entrenos: 4')).toBeOnTheScreen();
    expect(screen.getByLabelText('Series: 16')).toBeOnTheScreen();
    expect(screen.getByLabelText('Racha actual: 5 días')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mejor racha: 8 días')).toBeOnTheScreen();
  });

  it('shows the empty state and navigates to RoutinesList on CTA press (DASHBOARD-4)', async () => {
    mockUseDashboardSummary.mockReturnValue({
      data: summaryEmpty,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSummary>);

    await render(<DashboardScreen />);

    expect(screen.getByText('Todavía no registraste entrenamientos')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Entrenos: 0')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Crear mi primera rutina' }));

    expect(mockNavigateSpy).toHaveBeenCalledWith('Workouts', { screen: 'RoutinesList' });
  });
});