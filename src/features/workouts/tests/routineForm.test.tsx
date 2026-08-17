import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useExerciseTemplates } from '@/features/exercises/hooks/useExerciseTemplates';
import type { ExerciseTemplate } from '@/features/exercises/types';
import {
  createRoutine,
  getRoutine,
  updateRoutine,
} from '@/features/workouts/repository/routinesRepository';
import type { Routine } from '@/features/workouts/types';

import { RoutineFormScreen } from '../screens/RoutineFormScreen';

jest.mock('@/features/exercises/hooks/useExerciseTemplates', () => ({
  useExerciseTemplates: jest.fn(),
  useExerciseTemplatesByMuscleGroup: jest.fn(),
}));

jest.mock('@/features/workouts/repository/routinesRepository', () => ({
  listRoutines: jest.fn(),
  getRoutine: jest.fn(),
  createRoutine: jest.fn(),
  updateRoutine: jest.fn(),
  deleteRoutine: jest.fn(),
  duplicateRoutine: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      setOptions: jest.fn(),
      goBack: mockGoBack,
    }),
    useRoute: () => ({ params: mockRouteParams, key: 'test', name: 'RoutineForm' }),
  };
});

const mockUseExerciseTemplates = useExerciseTemplates as jest.MockedFunction<
  typeof useExerciseTemplates
>;
const mockCreateRoutine = createRoutine as jest.MockedFunction<typeof createRoutine>;
const mockUpdateRoutine = updateRoutine as jest.MockedFunction<typeof updateRoutine>;
const mockGetRoutine = getRoutine as jest.MockedFunction<typeof getRoutine>;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: { routineId?: number } = {};

const templates: ExerciseTemplate[] = [
  { id: 1, name: 'Press de banca', muscleGroup: 'chest', equipment: 'barbell', isBodyweight: false },
  { id: 2, name: 'Flexiones', muscleGroup: 'chest', equipment: 'bodyweight', isBodyweight: true },
  { id: 3, name: 'Sentadilla', muscleGroup: 'legs', equipment: 'barbell', isBodyweight: false },
];

const existingRoutine: Routine = {
  id: 7,
  name: 'Push Day',
  note: null,
  goal: 'strength',
  createdAt: 0,
  updatedAt: 0,
  exercises: [
    {
      id: 100,
      exerciseTemplateId: 1,
      exerciseName: 'Press de banca',
      muscleGroup: 'chest',
      position: 0,
      targetSets: 3,
      targetReps: 10,
      restSeconds: 60,
    },
  ],
};

function mockTemplates() {
  mockUseExerciseTemplates.mockReturnValue({
    data: templates,
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

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RoutineFormScreen />
    </QueryClientProvider>,
  );
}

describe('RoutineFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    mockTemplates();
    mockCreateRoutine.mockResolvedValue(existingRoutine);
    mockUpdateRoutine.mockResolvedValue(existingRoutine);
  });

  it('renders the name, note and add-exercise controls in create mode', async () => {
    await renderForm();

    expect(screen.getByLabelText('Nombre de la rutina')).toBeOnTheScreen();
    expect(screen.getByLabelText('Nota de la rutina')).toBeOnTheScreen();
    expect(screen.getByText('Agregar ejercicio')).toBeOnTheScreen();
    expect(screen.getByText('Crear rutina')).toBeOnTheScreen();
  });

  it('opens the exercise picker when adding an exercise', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Agregar ejercicio'));

    expect(screen.getByText('Elige un ejercicio')).toBeOnTheScreen();
    expect(screen.getByLabelText('Buscar ejercicios')).toBeOnTheScreen();
  });

it('selects an exercise and submits the create input', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Nombre de la rutina'), 'Push Day');
    await fireEvent.press(screen.getByText('Agregar ejercicio'));
    await fireEvent.press(screen.getByLabelText('Seleccionar Press de banca'));

    expect(screen.queryByText('Elige un ejercicio')).toBeNull();
    expect(screen.getByText('Press de banca')).toBeOnTheScreen();
    expect(screen.getByLabelText('Series')).toBeOnTheScreen();
    expect(screen.getByLabelText('Reps')).toBeOnTheScreen();
    expect(screen.getByLabelText('Descanso (s)')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Crear rutina'));

    await waitFor(() =>
      expect(mockCreateRoutine).toHaveBeenCalledWith({
        name: 'Push Day',
        note: null,
        goal: 'strength',
        exercises: [
          { exerciseTemplateId: 1, targetSets: 3, targetReps: 10, restSeconds: 60 },
        ],
      }),
    );
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('removes an exercise row with the remove button', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Agregar ejercicio'));
    expect(screen.getByLabelText('Quitar ejercicio 1')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Quitar ejercicio 1'));

    expect(screen.queryByLabelText('Quitar ejercicio 1')).toBeNull();
  });

  it('shows validation errors and does not submit an empty form', async () => {
    await renderForm();

    await fireEvent.press(screen.getByText('Crear rutina'));

    expect(
      await screen.findByText('El nombre debe tener al menos 3 caracteres.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Agrega al menos un ejercicio.')).toBeOnTheScreen();
    expect(mockCreateRoutine).not.toHaveBeenCalled();
  });

  it('preloads an existing routine and submits updates in edit mode', async () => {
    mockRouteParams = { routineId: 7 };
    mockGetRoutine.mockResolvedValue(existingRoutine);
    await renderForm();

    expect(await screen.findByText('Press de banca')).toBeOnTheScreen();
    expect(screen.getByText('Guardar cambios')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('3')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('10')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('60')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Series'), '5');

    await fireEvent.press(screen.getByText('Guardar cambios'));

    await waitFor(() =>
      expect(mockUpdateRoutine).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          name: 'Push Day',
          note: null,
          exercises: [
            { exerciseTemplateId: 1, targetSets: 5, targetReps: 10, restSeconds: 60 },
          ],
        }),
      ),
    );
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('sends an edited numeric value from create mode', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Nombre de la rutina'), 'Push Day');
    await fireEvent.press(screen.getByText('Agregar ejercicio'));
    await fireEvent.press(screen.getByLabelText('Seleccionar Press de banca'));
    await fireEvent.changeText(screen.getByLabelText('Series'), '5');

    await fireEvent.press(screen.getByText('Crear rutina'));

    await waitFor(() =>
      expect(mockCreateRoutine).toHaveBeenCalledWith({
        name: 'Push Day',
        note: null,
        goal: 'strength',
        exercises: [
          { exerciseTemplateId: 1, targetSets: 5, targetReps: 10, restSeconds: 60 },
        ],
      }),
    );
  });

  it('renders the goal chips and submits the selected goal', async () => {
    await renderForm();

    expect(screen.getByText('Objetivo')).toBeOnTheScreen();
    expect(screen.getByText('Fuerza')).toBeOnTheScreen();
    expect(screen.getByText('Hipertrofia')).toBeOnTheScreen();
    expect(screen.getByText('Cardio')).toBeOnTheScreen();
    expect(screen.getByText('Resistencia')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Hipertrofia'));
    await fireEvent.changeText(screen.getByLabelText('Nombre de la rutina'), 'Push Day');
    await fireEvent.press(screen.getByText('Agregar ejercicio'));
    await fireEvent.press(screen.getByLabelText('Seleccionar Press de banca'));

    await fireEvent.press(screen.getByText('Crear rutina'));

    await waitFor(() =>
      expect(mockCreateRoutine).toHaveBeenCalledWith({
        name: 'Push Day',
        note: null,
        goal: 'hypertrophy',
        exercises: [
          { exerciseTemplateId: 1, targetSets: 3, targetReps: 10, restSeconds: 60 },
        ],
      }),
    );
  });
});