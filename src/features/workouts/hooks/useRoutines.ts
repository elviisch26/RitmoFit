import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createRoutine,
  deleteRoutine,
  duplicateRoutine,
  getRoutine,
  listRoutines,
  seedExampleRoutines,
  updateRoutine,
} from '../repository/routinesRepository';
import type { CreateRoutineInput, UpdateRoutineInput } from '../types';

const ROUTINES_KEY = ['routines'] as const;

/** Todas las rutinas con sus ejercicios embebidos. */
export function useRoutines() {
  return useQuery({
    queryKey: ROUTINES_KEY,
    queryFn: listRoutines,
  });
}

/** Una rutina por id; deshabilitado cuando no se provee id. */
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

/** Carga las rutinas de ejemplo bajo demanda y refresca la lista. */
export function useSeedExampleRoutines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedExampleRoutines,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROUTINES_KEY }),
  });
}
