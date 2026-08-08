import { z } from 'zod';

import type { MuscleGroup } from '@/features/exercises/types';

export type WorkoutsStackParamList = {
  RoutinesList: undefined;
  RoutineForm: { routineId?: number } | undefined;
  ExerciseCatalog: undefined;
  WorkoutSession: { workoutId: number };
  WorkoutsHistory: undefined;
};

export type RoutineExercise = {
  id: number;
  exerciseTemplateId: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  position: number;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

export type Routine = {
  id: number;
  name: string;
  note: string | null;
  createdAt: number;
  updatedAt: number;
  exercises: RoutineExercise[];
};

export type RoutineExerciseInput = {
  exerciseTemplateId: number;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

export type CreateRoutineInput = {
  name: string;
  note: string | null;
  exercises: RoutineExerciseInput[];
};

export type UpdateRoutineInput = {
  name?: string;
  note?: string | null;
  exercises?: RoutineExerciseInput[];
};

export const routineExerciseSchema = z.object({
  exerciseTemplateId: z.number().int().positive('Selecciona un ejercicio del catálogo.'),
  targetSets: z
    .number()
    .int('Las series deben ser un número entero.')
    .min(1, 'Las series objetivo deben estar entre 1 y 10.')
    .max(10, 'Las series objetivo deben estar entre 1 y 10.'),
  targetReps: z
    .number()
    .int('Las repeticiones deben ser un número entero.')
    .min(1, 'Las repeticiones objetivo deben estar entre 1 y 50.')
    .max(50, 'Las repeticiones objetivo deben estar entre 1 y 50.'),
  restSeconds: z
    .number()
    .int('El descanso debe ser un número entero.')
    .min(0, 'El descanso no puede ser negativo.'),
});

export const routineSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  note: z.string().trim().max(500, 'La nota debe tener 500 caracteres o menos.').nullable().optional(),
  exercises: z.array(routineExerciseSchema).min(1, 'Agrega al menos un ejercicio.'),
});

export type RoutineFormValues = z.infer<typeof routineSchema>;

export type Workout = {
  id: number;
  name: string;
  notes: string | null;
  startedAt: number;
  completedAt: number | null;
};

export type WorkoutSet = {
  id: number;
  weightKg: number;
  reps: number;
  restSeconds: number | null;
  rpe: number | null;
  orderIndex: number;
};

export type WorkoutExercise = {
  id: number;
  exerciseTemplateId: number;
  name: string;
  muscleGroup: MuscleGroup;
  orderIndex: number;
  notes: string | null;
  sets: WorkoutSet[];
};

export type AddSetInput = {
  weightKg: number;
  reps: number;
  restSeconds?: number | null;
  rpe?: number | null;
};

export type UpdateSetInput = {
  weightKg?: number;
  reps?: number;
  restSeconds?: number | null;
  rpe?: number | null;
};