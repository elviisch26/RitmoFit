import { cleanup, render, screen } from '@testing-library/react-native';
import { LineChart } from 'react-native-gifted-charts';

jest.mock('react-native-gifted-charts', () => ({
  LineChart: jest.fn((_props: unknown) => null),
}));

import { useProgressStats } from '../hooks/useProgressStats';
import { ProgressScreen } from '../screens/ProgressScreen';

jest.mock('../hooks/useProgressStats', () => ({
  useProgressStats: jest.fn(),
}));

const mockLineChart = jest.mocked(LineChart);
const mockUseProgressStats = jest.mocked(useProgressStats);

const loading = {
  kpis: undefined,
  exercises: [],
  series: undefined,
  selectedExerciseId: null,
  setSelectedExerciseId: jest.fn(),
  isLoading: true,
} as ReturnType<typeof useProgressStats>;

const withData = {
  kpis: { workouts: 3, sets: 13, minutes: 180 },
  exercises: [{ id: 2, name: 'Press de banca' }],
  series: [
    { date: '12/01', weightKg: 60 },
    { date: '14/01', weightKg: 65 },
    { date: '16/01', weightKg: 70 },
  ],
  selectedExerciseId: 2,
  setSelectedExerciseId: jest.fn(),
  isLoading: false,
} as ReturnType<typeof useProgressStats>;

const emptyGlobal = {
  kpis: { workouts: 0, sets: 0, minutes: 0 },
  exercises: [],
  series: undefined,
  selectedExerciseId: null,
  setSelectedExerciseId: jest.fn(),
  isLoading: false,
} as ReturnType<typeof useProgressStats>;

const emptyByExercise = {
  kpis: { workouts: 3, sets: 13, minutes: 180 },
  exercises: [{ id: 2, name: 'Press de banca' }],
  series: [],
  selectedExerciseId: 2,
  setSelectedExerciseId: jest.fn(),
  isLoading: false,
} as ReturnType<typeof useProgressStats>;

describe('ProgressScreen (PROGRESS-1..5)', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('shows a loading spinner while the first fetch is pending', async () => {
    mockUseProgressStats.mockReturnValue(loading);

    await render(<ProgressScreen />);

    expect(screen.getByLabelText(/Cargando/)).toBeOnTheScreen();
  });

  it('renders KPIs, the picker chip and the chart with its a11y label (PROGRESS-1/2/4/5)', async () => {
    mockUseProgressStats.mockReturnValue(withData);

    await render(<ProgressScreen />);

    expect(screen.getByLabelText('Entrenos: 3')).toBeOnTheScreen();
    expect(screen.getByLabelText('Series: 13')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tiempo: 180 minutos')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Press de banca' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Evolución de cargas de Press de banca')).toBeOnTheScreen();

    const props = mockLineChart.mock.calls[0][0];
    expect(props.curved).toBe(true);
    expect(props.isAnimated).toBe(true);
    expect(props.yAxisLabelSuffix).toBe(' kg');
    expect(props.data).toEqual([
      { value: 60, label: '12/01' },
      { value: 65, label: '14/01' },
      { value: 70, label: '16/01' },
    ]);
  });

  it('shows the global empty state when no exercise has sessions (PROGRESS-2)', async () => {
    mockUseProgressStats.mockReturnValue(emptyGlobal);

    await render(<ProgressScreen />);

    expect(screen.getByText('Todavía no hay sesiones registradas')).toBeOnTheScreen();
    expect(screen.getByLabelText('Todavía no hay sesiones registradas')).toBeOnTheScreen();
    expect(mockLineChart).not.toHaveBeenCalled();
  });

  it('shows the per-exercise empty state when the exercise has no weighted sets (PROGRESS-3)', async () => {
    mockUseProgressStats.mockReturnValue(emptyByExercise);

    await render(<ProgressScreen />);

    expect(screen.getByText('Sin series con peso para este ejercicio')).toBeOnTheScreen();
    expect(screen.getByLabelText('Sin series con peso para este ejercicio')).toBeOnTheScreen();
    expect(mockLineChart).not.toHaveBeenCalled();
  });
});