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

/** All catalog templates ordered by name. */
export function listTemplates(): ExerciseTemplate[] {
  return db
    .select(TEMPLATE_COLUMNS)
    .from(exerciseTemplates)
    .orderBy(asc(exerciseTemplates.name))
    .all();
}

/** Templates filtered by muscle group, ordered by name. */
export function listTemplatesByMuscleGroup(muscleGroup: MuscleGroup): ExerciseTemplate[] {
  return db
    .select(TEMPLATE_COLUMNS)
    .from(exerciseTemplates)
    .where(eq(exerciseTemplates.muscleGroup, muscleGroup))
    .orderBy(asc(exerciseTemplates.name))
    .all();
}

/**
 * Distinct muscle groups present in the catalog, in canonical display order.
 */
export function listMuscleGroups(): MuscleGroup[] {
  const rows = db
    .selectDistinct({ muscleGroup: exerciseTemplates.muscleGroup })
    .from(exerciseTemplates)
    .all();

  return MUSCLE_GROUPS.filter((group) => rows.some((row) => row.muscleGroup === group));
}