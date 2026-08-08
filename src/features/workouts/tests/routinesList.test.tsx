import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { RoutinesScreen } from '../screens/RoutinesScreen';
import { useRoutinesUiStore } from '../store/routinesUiStore';
import type { Routine } from '../types';

jest.mock('@/features/workouts/repository/routinesRepository', () => ({
  listRoutines: jest.fn(),
  getRoutine: jest.fn(),
  createRoutine: jest.fn(),
  updateRoutine: jest.fn(),
  deleteRoutine: jest.fn(),
  duplicateRoutine: jest.fn(),
}));

jest.mock('@/features/workouts/repository/workoutsRepository', () => ({
  listWorkouts: jest.fn(),
  getWorkout: jest.fn(),
  getWorkoutExercises: jest.fn(),
  startWorkoutFromRoutine: jest.fn(),
  addSet: jest.fn(),
  updateSet: jest.fn(),
  deleteSet: jest.fn(),
  completeWorkout: jest.fn(),
  deleteWorkout: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      setOptions: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

import {
  deleteRoutine,
  listRoutines,
} from '@/features/workouts/repository/routinesRepository';

const mockListRoutines = listRoutines as jest.MockedFunction<typeof listRoutines>;
const mockDeleteRoutine = deleteRoutine as jest.MockedFunction<typeof deleteRoutine>;

const EXERCISE = {
  id: 10,
  exerciseTemplateId: 1,
  exerciseName: 'Press de banca',
  muscleGroup: 'chest' as const,
  position: 0,
  targetSets: 3,
  targetReps: 10,
  restSeconds: 60,
};

const pushDay: Routine = {
  id: 1,
  name: 'Push Day',
  note: null,
  createdAt: 0,
  updatedAt: 0,
  exercises: [
    EXERCISE,
    { ...EXERCISE, id: 11, exerciseTemplateId: 2, exerciseName: 'Press militar', muscleGroup: 'shoulders' },
  ],
};

const legDay: Routine = {
  id: 2,
  name: 'Leg Day',
  note: 'Hip position built into Strength Level',
  createdAt: 0,
  updatedAt: 0,
  exercises: [
    { ...EXERCISE, id: 20, exerciseTemplateId: 3, exerciseName: 'Sentadilla', muscleGroup: 'legs' },
    { ...EXERCISE, id: 21, exerciseTemplateId: 4, exerciseName: 'Prensa de piernas', muscleGroup: 'legs', position: 1 },
    { ...EXERCISE, id: 22, exerciseTemplateId: 5, exerciseName: 'Curl de piernas', muscleGroup: 'legs', position: 2 },
  ],
};

function renderRoutines() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RoutinesScreen />
    </QueryClientProvider>,
  );
}

describe('RoutinesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRoutinesUiStore.setState({ searchPhrase: '', expandedRoutineId: null });
    mockListRoutines.mockResolvedValue([pushDay, legDay]);
    mockDeleteRoutine.mockResolvedValue(true);
  });

  it('renders routine rows with their exercise counts', async () => {
    await renderRoutines();

    expect(await screen.findByText('Push Day')).toBeOnTheScreen();
    expect(screen.getByText('Leg Day')).toBeOnTheScreen();
    expect(screen.getByText('2 ejercicios')).toBeOnTheScreen();
    expect(screen.getByText('3 ejercicios')).toBeOnTheScreen();
  });

  it('shows the empty state when there are no routines', async () => {
    mockListRoutines.mockResolvedValue([]);

    await renderRoutines();

    expect(await screen.findByText(/Aún no hay rutinas/i)).toBeOnTheScreen();
  });

  it('shows a no-match message when the search phrase excludes everything', async () => {
    await renderRoutines();

    const searchInput = await screen.findByLabelText('Buscar rutinas');
    fireEvent.changeText(searchInput, 'zzz-nothing');

    expect(await screen.findByText(/Ninguna rutina coincide con tu búsqueda/i)).toBeOnTheScreen();
  });

  it('calls the delete mutation after confirming the alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    await renderRoutines();
    await screen.findByText('Push Day');

    fireEvent.press(screen.getByLabelText('Eliminar Push Day'));

    const alertButtons = alertSpy.mock.calls[0][2] as
      | Array<{ text?: string; onPress?: () => void }>
      | undefined;
    const deleteButton = alertButtons?.find((button) => button.text === 'Eliminar');
    expect(deleteButton).toBeDefined();

    deleteButton?.onPress?.();

    await waitFor(() => expect(mockDeleteRoutine).toHaveBeenCalledWith(1));
  });
});