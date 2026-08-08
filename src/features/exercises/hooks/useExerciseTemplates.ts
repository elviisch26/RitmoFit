import { useQuery } from '@tanstack/react-query';

import {
  listTemplates,
  listTemplatesByMuscleGroup,
} from '../repository/templatesRepository';
import type { MuscleGroup } from '../types';

/** All exercise templates in the catalog. */
export function useExerciseTemplates() {
  return useQuery({
    queryKey: ['exerciseTemplates'],
    queryFn: listTemplates,
  });
}

/** Exercise templates filtered by muscle group. */
export function useExerciseTemplatesByMuscleGroup(muscleGroup: MuscleGroup) {
  return useQuery({
    queryKey: ['exerciseTemplates', 'muscleGroup', muscleGroup],
    queryFn: () => listTemplatesByMuscleGroup(muscleGroup),
  });
}