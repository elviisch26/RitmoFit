import { EQUIPMENT, MUSCLE_GROUPS } from '@/shared/constants';

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type Equipment = (typeof EQUIPMENT)[number];

export type ExerciseTemplate = {
  id: number;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isBodyweight: boolean;
};