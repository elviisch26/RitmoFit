import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import {
  getExerciseLoadSeries,
  getProgressKpis,
  listExerciseOptions,
  type ExerciseOption,
} from '../repository/progressRepository';
import { useProgressGlobalState } from '../store/useProgressGlobalState';

const PROGRESS_KEY = ['progress'] as const;

/**
 * Datos de progreso para el tab (PROG-2): KPIs semanales (`['progress']`), las
 * opciones del picker y la serie de cargas del ejercicio seleccionado
 * (`['progress', id]`). El picker toma como default el primer ejercicio con
 * sesiones (S4). Se refresca al ganar foco el tab invalidando el prefijo
 * `['progress']` (D3).
 */
export function useProgressStats() {
  const queryClient = useQueryClient();
  const selectedExerciseId = useProgressGlobalState((state) => state.selectedExerciseId);
  const setSelectedExerciseId = useProgressGlobalState((state) => state.setSelectedExerciseId);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEY });
    }, [queryClient]),
  );

  const kpisQuery = useQuery({
    queryKey: PROGRESS_KEY,
    queryFn: () => getProgressKpis(new Date()),
    staleTime: 30_000,
  });

  const exercisesQuery = useQuery({
    queryKey: [...PROGRESS_KEY, 'exercises'],
    queryFn: listExerciseOptions,
    staleTime: 30_000,
  });

  const exercises: ExerciseOption[] = exercisesQuery.data ?? [];

  // Selección por default (S4): el primer ejercicio con sesiones pasa a ser el
  // default del picker salvo que el usuario ya haya elegido uno.
  useEffect(() => {
    if (exercises.length > 0 && selectedExerciseId == null) {
      setSelectedExerciseId(exercises[0].id);
    }
  }, [exercises.length, selectedExerciseId, setSelectedExerciseId]);

  const seriesQuery = useQuery({
    queryKey: [...PROGRESS_KEY, selectedExerciseId],
    queryFn: () => getExerciseLoadSeries(selectedExerciseId as number),
    enabled: selectedExerciseId != null,
    staleTime: 30_000,
  });

  return {
    kpis: kpisQuery.data,
    exercises,
    series: seriesQuery.data,
    selectedExerciseId,
    setSelectedExerciseId,
    isLoading: kpisQuery.isLoading,
  };
}