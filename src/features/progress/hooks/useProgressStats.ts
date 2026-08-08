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
 * Progress data for the tab (PROG-2): weekly KPIs (`['progress']`), the picker
 * options and the load series of the selected exercise (`['progress', id]`).
 * The picker defaults to the first exercise with sessions (S4). Refreshes on
 * tab focus by invalidating the `['progress']` prefix (D3).
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

  // Default selection (S4): the first exercise with sessions becomes the
  // picker default unless the user already chose one.
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