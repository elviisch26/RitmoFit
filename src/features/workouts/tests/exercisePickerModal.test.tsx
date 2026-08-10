import { fireEvent, render, screen } from '@testing-library/react-native';

import { useExerciseTemplates } from '@/features/exercises/hooks/useExerciseTemplates';
import type { ExerciseTemplate } from '@/features/exercises/types';
import { MUSCLE_GROUP_LABELS } from '@/shared/constants';

import { ExercisePickerModal } from '../components/ExercisePickerModal';

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

function mockTemplates(data: ExerciseTemplate[]) {
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

describe('ExercisePickerModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTemplates(templates);
  });

  it('renders nothing while hidden', async () => {
    await render(
      <ExercisePickerModal visible={false} onSelect={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.queryByText('Elige un ejercicio')).toBeNull();
  });

  it('renders the templates with their muscle group labels when visible', async () => {
    await render(
      <ExercisePickerModal visible onSelect={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByText('Elige un ejercicio')).toBeOnTheScreen();
    expect(screen.getByText('Press de banca')).toBeOnTheScreen();
    expect(screen.getByText('Flexiones')).toBeOnTheScreen();
    expect(screen.getByText('Sentadilla')).toBeOnTheScreen();
    expect(screen.getAllByText(MUSCLE_GROUP_LABELS.chest)).toHaveLength(2);
    expect(screen.getByText(MUSCLE_GROUP_LABELS.legs)).toBeOnTheScreen();
  });

  it('filters the list by search query', async () => {
    await render(
      <ExercisePickerModal visible onSelect={jest.fn()} onClose={jest.fn()} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Buscar ejercicios'), 'press');

    expect(screen.getByText('Press de banca')).toBeOnTheScreen();
    expect(screen.queryByText('Flexiones')).toBeNull();
    expect(screen.queryByText('Sentadilla')).toBeNull();
  });

  it('calls onSelect with the tapped template and clears the search', async () => {
    const onSelect = jest.fn();
    await render(
      <ExercisePickerModal visible onSelect={onSelect} onClose={jest.fn()} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Buscar ejercicios'), 'press');
    await fireEvent.press(screen.getByLabelText('Seleccionar Press de banca'));

    expect(onSelect).toHaveBeenCalledWith(templates[0]);
    expect(screen.getByLabelText('Buscar ejercicios')).toHaveDisplayValue('');
    expect(screen.getByText('Flexiones')).toBeOnTheScreen();
  });

  it('calls onClose when Cancel is pressed', async () => {
    const onClose = jest.fn();
    await render(
      <ExercisePickerModal visible onSelect={jest.fn()} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByText('Cancelar'));

    expect(onClose).toHaveBeenCalled();
  });
});