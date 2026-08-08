import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { exerciseTemplates } from './schema';
import type * as schema from './schema';

type SeedExercise = {
  name: string;
  muscleGroup: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable';
};

const CATALOG: SeedExercise[] = [
  // Chest
  { name: 'Press de banca', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Press de banca inclinado', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Press de banca con mancuernas', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Press inclinado con mancuernas', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Aperturas de pecho', muscleGroup: 'chest', equipment: 'machine' },
  { name: 'Cruces en polea', muscleGroup: 'chest', equipment: 'cable' },
  { name: 'Flexiones', muscleGroup: 'chest', equipment: 'bodyweight' },
  // Back
  { name: 'Peso muerto', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Remo con barra', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Remo con mancuernas', muscleGroup: 'back', equipment: 'dumbbell' },
  { name: 'Jalón al pecho', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Remo sentado en polea', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Dominadas', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Dominadas supinas', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Remo al rostro', muscleGroup: 'back', equipment: 'cable' },
  // Legs
  { name: 'Sentadilla', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Sentadilla frontal', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Prensa de piernas', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Peso muerto rumano', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Extensión de piernas', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Curl de piernas', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Zancadas caminando', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Sentadilla búlgara', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Elevación de talones de pie', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Empuje de cadera', muscleGroup: 'legs', equipment: 'barbell' },
  // Shoulders
  { name: 'Press militar', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Press de hombros sentado con mancuernas', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Elevaciones laterales', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Elevaciones frontales', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Aperturas de deltoides posteriores', muscleGroup: 'shoulders', equipment: 'machine' },
  { name: 'Elevación lateral en polea', muscleGroup: 'shoulders', equipment: 'cable' },
  // Arms
  { name: 'Curl con barra', muscleGroup: 'arms', equipment: 'barbell' },
  { name: 'Curl con mancuernas', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Curl martillo', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Extensión de tríceps en polea', muscleGroup: 'arms', equipment: 'cable' },
  { name: 'Extensión de tríceps sobre la cabeza', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Press francés', muscleGroup: 'arms', equipment: 'barbell' },
  { name: 'Fondos', muscleGroup: 'arms', equipment: 'bodyweight' },
  { name: 'Curl concentrado', muscleGroup: 'arms', equipment: 'dumbbell' },
  // Core
  { name: 'Plancha', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Elevación de piernas colgado', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Giros rusos', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Crunch en polea', muscleGroup: 'core', equipment: 'cable' },
  { name: 'Rueda abdominal', muscleGroup: 'core', equipment: 'bodyweight' },
];

/**
 * Former English catalog names mapped to their current Spanish names. Used to
 * migrate installations seeded before the catalog was translated so that the
 * exercise templates keep their id (and therefore all FK references from
 * routines/workouts keep working) while displaying Spanish names.
 */
const LEGACY_CATALOG_NAMES: Record<string, string> = {
  'Bench Press': 'Press de banca',
  'Incline Bench Press': 'Press de banca inclinado',
  'Dumbbell Bench Press': 'Press de banca con mancuernas',
  'Incline Dumbbell Press': 'Press inclinado con mancuernas',
  'Chest Fly': 'Aperturas de pecho',
  'Cable Crossover': 'Cruces en polea',
  'Push-Up': 'Flexiones',
  Deadlift: 'Peso muerto',
  'Barbell Row': 'Remo con barra',
  'Dumbbell Row': 'Remo con mancuernas',
  'Lat Pulldown': 'Jalón al pecho',
  'Seated Cable Row': 'Remo sentado en polea',
  'Pull-Up': 'Dominadas',
  'Chin-Up': 'Dominadas supinas',
  'Face Pull': 'Remo al rostro',
  Squat: 'Sentadilla',
  'Front Squat': 'Sentadilla frontal',
  'Leg Press': 'Prensa de piernas',
  'Romanian Deadlift': 'Peso muerto rumano',
  'Leg Extension': 'Extensión de piernas',
  'Leg Curl': 'Curl de piernas',
  'Walking Lunge': 'Zancadas caminando',
  'Bulgarian Split Squat': 'Sentadilla búlgara',
  'Standing Calf Raise': 'Elevación de talones de pie',
  'Hip Thrust': 'Empuje de cadera',
  'Overhead Press': 'Press militar',
  'Seated Dumbbell Shoulder Press': 'Press de hombros sentado con mancuernas',
  'Lateral Raise': 'Elevaciones laterales',
  'Front Raise': 'Elevaciones frontales',
  'Rear Delt Fly': 'Aperturas de deltoides posteriores',
  'Cable Lateral Raise': 'Elevación lateral en polea',
  'Barbell Curl': 'Curl con barra',
  'Dumbbell Curl': 'Curl con mancuernas',
  'Hammer Curl': 'Curl martillo',
  'Triceps Pushdown': 'Extensión de tríceps en polea',
  'Overhead Triceps Extension': 'Extensión de tríceps sobre la cabeza',
  'Skull Crusher': 'Press francés',
  Dips: 'Fondos',
  'Concentration Curl': 'Curl concentrado',
  Plank: 'Plancha',
  'Hanging Leg Raise': 'Elevación de piernas colgado',
  'Russian Twist': 'Giros rusos',
  'Cable Crunch': 'Crunch en polea',
  'Ab Wheel Rollout': 'Rueda abdominal',
};

/**
 * One-time migration for installations that already have the catalog stored
 * with the former English names. For each legacy name, if a row with the new
 * Spanish name does not exist yet and a row with the legacy name does, the
 * existing row is renamed (keeping its id so FK references are preserved).
 * Idempotent: once a Spanish name exists, nothing is touched on later runs.
 */
function migrateLegacyCatalogNames(
  db: ExpoSQLiteDatabase<typeof schema>,
): void {
  const existingRows = db
    .select({ id: exerciseTemplates.id, name: exerciseTemplates.name })
    .from(exerciseTemplates)
    .all();

  const idByName = new Map(existingRows.map((row) => [row.name, row.id]));

  for (const [legacyName, spanishName] of Object.entries(LEGACY_CATALOG_NAMES)) {
    if (idByName.has(spanishName)) {
      continue;
    }
    const legacyId = idByName.get(legacyName);
    if (legacyId === undefined) {
      continue;
    }
    db.update(exerciseTemplates)
      .set({ name: spanishName })
      .where(eq(exerciseTemplates.id, legacyId))
      .run();
    idByName.set(spanishName, legacyId);
  }
}

/**
 * Seed the exercise template catalog. Idempotent: rows are inserted only when
 * the exercise name does not already exist, and legacy English rows are
 * migrated to their Spanish names first. Synchronous because the expo-sqlite
 * Drizzle driver is synchronous; called once during `bootstrapDatabase()`.
 */
export function seedExerciseCatalog(
  db: ExpoSQLiteDatabase<typeof schema>,
): number {
  migrateLegacyCatalogNames(db);

  const rows = CATALOG.map((exercise) => ({
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    isBodyweight: exercise.equipment === 'bodyweight',
  }));

  const inserted = db
    .insert(exerciseTemplates)
    .values(rows)
    .onConflictDoNothing({ target: exerciseTemplates.name })
    .returning({ id: exerciseTemplates.id })
    .all();

  return inserted.length;
}
