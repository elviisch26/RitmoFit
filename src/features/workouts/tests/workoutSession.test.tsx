import { fireEvent, render, screen, cleanup } from '@testing-library/react-native';

import { WorkoutSessionScreen } from '../screens/WorkoutSessionScreen';
import { useWorkoutUiStore } from '../store/workoutUiStore';
import type { Workout, WorkoutExercise } from '../types';

jest.mock('../hooks/useWorkouts', () => ({
  useWorkout: jest.fn(),
  useWorkoutExercises: jest.fn(),
  useAddSet: jest.fn(),
  useUpdateSet: jest.fn(),
  useDeleteSet: jest.fn(),
  useCompleteWorkout: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
    useRoute: () => ({ params: { workoutId: 1 }, key: 'test', name: 'WorkoutSession' }),
  };
});

import {
  useAddSet,
  useCompleteWorkout,
  useDeleteSet,
  useUpdateSet,
  useWorkout,
  useWorkoutExercises,
} from '../hooks/useWorkouts';

const mockUseWorkout = useWorkout as jest.MockedFunction<typeof useWorkout>;
const mockUseWorkoutExercises = useWorkoutExercises as jest.MockedFunction<
  typeof useWorkoutExercises
>;
const mockUseAddSet = useAddSet as jest.MockedFunction<typeof useAddSet>;
const mockUseUpdateSet = useUpdateSet as jest.MockedFunction<typeof useUpdateSet>;
const mockUseDeleteSet = useDeleteSet as jest.MockedFunction<typeof useDeleteSet>;
const mockUseCompleteWorkout = useCompleteWorkout as jest.MockedFunction<
  typeof useCompleteWorkout
>;

const workout: Workout = {
  id: 1,
  name: 'Push Day',
  notes: null,
  startedAt: Date.UTC(2026, 0, 1, 10, 0, 0),
  completedAt: null,
};

const exercises: WorkoutExercise[] = [
  {
    id: 10,
    exerciseTemplateId: 1,
    name: 'Press de banca',
    muscleGroup: 'chest',
    orderIndex: 0,
    notes: null,
    sets: [
      { id: 20, weightKg: 60, reps: 10, restSeconds: 60, rpe: 8, orderIndex: 0 },
      { id: 21, weightKg: 60, reps: 9, restSeconds: null, rpe: null, orderIndex: 1 },
    ],
  },
  {
    id: 11,
    exerciseTemplateId: 2,
    name: 'Sentadilla',
    muscleGroup: 'legs',
    orderIndex: 1,
    notes: null,
    sets: [],
  },
];

const addSetMutate = jest.fn();
const updateSetMutate = jest.fn();
const deleteSetMutate = jest.fn();
const completeWorkoutMutate = jest.fn();

function renderSession(workoutExercises: WorkoutExercise[] = exercises) {
  mockUseWorkout.mockReturnValue({
    data: workout,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useWorkout>);
  mockUseWorkoutExercises.mockReturnValue({
    data: workoutExercises,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useWorkoutExercises>);
  mockUseAddSet.mockReturnValue({
    mutate: addSetMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useAddSet>);
  mockUseUpdateSet.mockReturnValue({
    mutate: updateSetMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateSet>);
  mockUseDeleteSet.mockReturnValue({
    mutate: deleteSetMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteSet>);
  mockUseCompleteWorkout.mockReturnValue({
    mutate: completeWorkoutMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCompleteWorkout>);

  return render(<WorkoutSessionScreen />);
}

describe('WorkoutSessionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWorkoutUiStore.setState({
      expandedExerciseId: null,
      addSetExerciseId: null,
      expandedHistoryId: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

it('renders the workout exercises and their sets', async () => {
    await renderSession();

    expect(screen.getByText('Push Day')).toBeOnTheScreen();
    expect(screen.getByText('Press de banca')).toBeOnTheScreen();
    expect(screen.getByText('Sentadilla')).toBeOnTheScreen();
    expect(screen.getByText('2 series')).toBeOnTheScreen();
    expect(screen.getByText('Finalizar entrenamiento')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Press de banca, 2 series'));

    expect(screen.getByLabelText('Press de banca serie 1 peso')).toBeOnTheScreen();
    expect(screen.getByLabelText('Press de banca serie 2 repeticiones')).toBeOnTheScreen();
  });

  it('adds a set from the expansion form', async () => {
    await renderSession();

    await fireEvent.press(screen.getByLabelText('Press de banca, 2 series'));
    await fireEvent.press(screen.getByLabelText('Agregar serie a Press de banca'));

    await fireEvent.changeText(screen.getByLabelText('Peso de la nueva serie'), '65');
    await fireEvent.changeText(screen.getByLabelText('Repeticiones de la nueva serie'), '10');
    await fireEvent.press(screen.getByText('Guardar'));

    expect(addSetMutate.mock.calls[0][0]).toEqual({
      workoutExerciseId: 10,
      input: { weightKg: 65, reps: 10 },
    });
  });

  it('updates a set when its weight changes', async () => {
    await renderSession();

    await fireEvent.press(screen.getByLabelText('Press de banca, 2 series'));

    const weightInput = screen.getByLabelText('Press de banca serie 1 peso');
    await fireEvent.changeText(weightInput, '55');
    await fireEvent(weightInput, 'blur');

    expect(updateSetMutate).toHaveBeenCalledWith({ setId: 20, input: { weightKg: 55, reps: 10 } });
  });

  it('deletes a set', async () => {
    await renderSession();

    await fireEvent.press(screen.getByLabelText('Press de banca, 2 series'));
    await fireEvent.press(screen.getByLabelText('Eliminar serie 1 de Press de banca'));

    expect(deleteSetMutate).toHaveBeenCalledWith(20);
  });

  it('completes the workout when Finish is pressed', async () => {
    await renderSession();

    await fireEvent.press(screen.getByText('Finalizar entrenamiento'));

    expect(completeWorkoutMutate.mock.calls[0][0]).toBe(1);
  });

  it('shows the empty state when the workout has no exercises', async () => {
    await renderSession([]);

    expect(screen.getByText(/Aún no hay ejercicios en este entrenamiento/i)).toBeOnTheScreen();
  });
});


