import { render, screen, userEvent } from '@testing-library/react-native';

import { ExerciseCatalogScreen } from '../screens/ExerciseCatalogScreen';
import { useExerciseTemplates } from '../hooks/useExerciseTemplates';
import type { ExerciseTemplate } from '../types';

jest.mock('@/features/exercises/hooks/useExerciseTemplates', () => ({
  useExerciseTemplates: jest.fn(),
  useExerciseTemplatesByMuscleGroup: jest.fn(),
}));

const mockUseExerciseTemplates = useExerciseTemplates as jest.MockedFunction<
  typeof useExerciseTemplates
>;

const templates: ExerciseTemplate[] = [
  { id: 1, name: 'Press de banca', muscleGroup: 'chest', equipment: 'barbell', isBodyweight: false },
  { id: 2, name: 'Flexiones', muscleGroup: 'chest', equipment: 'bodyweight', isBodyweight: true },
  { id: 3, name: 'Sentadilla', muscleGroup: 'legs', equipment: 'barbell', isBodyweight: false },
];

function mockCatalog(data: ExerciseTemplate[]) {
  mockUseExerciseTemplates.mockReturnValue({
    data,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle',
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    promise: Promise.resolve([]),
    refetch: jest.fn(),
    status: 'success',
  } as unknown as ReturnType<typeof useExerciseTemplates>);
}

describe('ExerciseCatalogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCatalog(templates);
  });

  it('renders all catalog entries', async () => {
    await render(<ExerciseCatalogScreen />);

    expect(screen.getByText('Press de banca')).toBeOnTheScreen();
    expect(screen.getByText('Flexiones')).toBeOnTheScreen();
    expect(screen.getByText('Sentadilla')).toBeOnTheScreen();
  });

  it('filters the catalog by muscle group', async () => {
    const user = userEvent.setup();
    await render(<ExerciseCatalogScreen />);

    await user.press(screen.getByTestId('filter-chest'));

    expect(screen.getByText('Press de banca')).toBeOnTheScreen();
    expect(screen.getByText('Flexiones')).toBeOnTheScreen();
    expect(screen.queryByText('Sentadilla')).not.toBeOnTheScreen();
  });

  it('resets the filter back to All', async () => {
    const user = userEvent.setup();
    await render(<ExerciseCatalogScreen />);

    await user.press(screen.getByTestId('filter-chest'));
    expect(screen.queryByText('Sentadilla')).not.toBeOnTheScreen();

    await user.press(screen.getByTestId('filter-all'));
    expect(screen.getByText('Sentadilla')).toBeOnTheScreen();
  });

  it('shows an empty state when nothing matches', async () => {
    mockCatalog([]);

    await render(<ExerciseCatalogScreen />);

    expect(screen.getByText(/No se encontraron ejercicios/i)).toBeOnTheScreen();
  });

  it('shows a loading indicator while fetching', async () => {
    mockUseExerciseTemplates.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useExerciseTemplates>);

    await render(<ExerciseCatalogScreen />);

    expect(screen.getByTestId('catalog-loading')).toBeOnTheScreen();
  });
});