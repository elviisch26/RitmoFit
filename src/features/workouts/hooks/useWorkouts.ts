import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addSet,
  completeWorkout,
  deleteSet,
  deleteWorkout,
  getWorkout,
  getWorkoutExercises,
  listWorkouts,
  startWorkoutFromRoutine,
  updateSet,
} from '../repository/workoutsRepository';
import type { AddSetInput, UpdateSetInput } from '../types';

const WORKOUTS_KEY = ['workouts'] as const;
const WORKOUT_EXERCISES_KEY = ['workout-exercises'] as const;

/** All workouts ordered by most recent start. */
export function useWorkouts() {
  return useQuery({
    queryKey: WORKOUTS_KEY,
    queryFn: listWorkouts,
  });
}

/** A single workout by id; disabled when no id is provided. */
export function useWorkout(workoutId: number | undefined) {
  return useQuery({
    queryKey: [...WORKOUTS_KEY, workoutId],
    queryFn: () => (workoutId === undefined ? undefined : getWorkout(workoutId)),
    enabled: workoutId !== undefined,
  });
}

/** Exercises (with their sets) for a workout; disabled when no id is provided. */
export function useWorkoutExercises(workoutId: number | undefined) {
  return useQuery({
    queryKey: [...WORKOUT_EXERCISES_KEY, workoutId],
    queryFn: () => (workoutId === undefined ? undefined : getWorkoutExercises(workoutId)),
    enabled: workoutId !== undefined,
  });
}

export function useStartWorkoutFromRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routineId: number) => startWorkoutFromRoutine(routineId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY }),
  });
}

export function useAddSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutExerciseId,
      input,
    }: {
      workoutExerciseId: number;
      input: AddSetInput;
    }) => addSet(workoutExerciseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKOUT_EXERCISES_KEY }),
  });
}

export function useUpdateSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ setId, input }: { setId: number; input: UpdateSetInput }) =>
      updateSet(setId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKOUT_EXERCISES_KEY }),
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setId: number) => deleteSet(setId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKOUT_EXERCISES_KEY }),
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: number) => completeWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
      queryClient.invalidateQueries({ queryKey: WORKOUT_EXERCISES_KEY });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: number) => deleteWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
      queryClient.invalidateQueries({ queryKey: WORKOUT_EXERCISES_KEY });
    },
  });
}