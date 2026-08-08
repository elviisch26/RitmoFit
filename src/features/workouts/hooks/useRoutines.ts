import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createRoutine,
  deleteRoutine,
  duplicateRoutine,
  getRoutine,
  listRoutines,
  updateRoutine,
} from '../repository/routinesRepository';
import type { CreateRoutineInput, UpdateRoutineInput } from '../types';

const ROUTINES_KEY = ['routines'] as const;

/** All routines with their embedded exercises. */
export function useRoutines() {
  return useQuery({
    queryKey: ROUTINES_KEY,
    queryFn: listRoutines,
  });
}

/** A single routine by id; disabled when no id is provided. */
export function useGetRoutine(id: number | undefined) {
  return useQuery({
    queryKey: [...ROUTINES_KEY, id],
    queryFn: () => (id === undefined ? undefined : getRoutine(id)),
    enabled: id !== undefined,
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoutineInput) => createRoutine(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROUTINES_KEY }),
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateRoutineInput }) =>
      updateRoutine(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROUTINES_KEY }),
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROUTINES_KEY }),
  });
}

export function useDuplicateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => duplicateRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROUTINES_KEY }),
  });
}