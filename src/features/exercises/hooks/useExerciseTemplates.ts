import { useQuery } from '@tanstack/react-query';

import {
  listTemplates,
  listTemplatesByMuscleGroup,
} from '../repository/templatesRepository';
import type { MuscleGroup } from '../types';

/** Todos los templates de ejercicio del catálogo. */
export function useExerciseTemplates() {
  return useQuery({
    queryKey: ['exerciseTemplates'],
    queryFn: listTemplates,
  });
}

/** Templates de ejercicio filtrados por grupo muscular. */
export function useExerciseTemplatesByMuscleGroup(muscleGroup: MuscleGroup) {
  return useQuery({
    queryKey: ['exerciseTemplates', 'muscleGroup', muscleGroup],
    queryFn: () => listTemplatesByMuscleGroup(muscleGroup),
  });
}