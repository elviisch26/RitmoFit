import { asc, eq } from 'drizzle-orm';

import { db } from '@/database/client';
import { exerciseTemplates } from '@/database/schema';
import { MUSCLE_GROUPS } from '@/shared/constants';

import type { ExerciseTemplate, MuscleGroup } from '../types';

const TEMPLATE_COLUMNS = {
  id: exerciseTemplates.id,
  name: exerciseTemplates.name,
  muscleGroup: exerciseTemplates.muscleGroup,
  equipment: exerciseTemplates.equipment,
  isBodyweight: exerciseTemplates.isBodyweight,
} as const;

/** Todos los templates del catálogo ordenados por nombre. */
export function listTemplates(): ExerciseTemplate[] {
  return db
    .select(TEMPLATE_COLUMNS)
    .from(exerciseTemplates)
    .orderBy(asc(exerciseTemplates.name))
    .all();
}

/** Templates filtrados por grupo muscular, ordenados por nombre. */
export function listTemplatesByMuscleGroup(muscleGroup: MuscleGroup): ExerciseTemplate[] {
  return db
    .select(TEMPLATE_COLUMNS)
    .from(exerciseTemplates)
    .where(eq(exerciseTemplates.muscleGroup, muscleGroup))
    .orderBy(asc(exerciseTemplates.name))
    .all();
}

/**
 * Grupos musculares distintos presentes en el catálogo, en el orden canónico de
 * visualización.
 */
export function listMuscleGroups(): MuscleGroup[] {
  const rows = db
    .selectDistinct({ muscleGroup: exerciseTemplates.muscleGroup })
    .from(exerciseTemplates)
    .all();

  return MUSCLE_GROUPS.filter((group) => rows.some((row) => row.muscleGroup === group));
}