import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Bootstrap del esquema idempotente.
 *
 * El pipeline de migraciones de Drizzle (drizzle-kit generate + archivos .sql
 * empaquetados) es el objetivo a largo plazo. Para la base actual, las tablas
 * se crean inline con exactamente el mismo DDL que Drizzle emitiría, de modo
 * que el esquema en runtime siempre coincide con `src/database/schema.ts`.
 */
const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  target_unit TEXT NOT NULL,
  target_value REAL NOT NULL,
  start_date INTEGER NOT NULL,
  target_date INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals (user_id);

CREATE TABLE IF NOT EXISTS exercise_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL,
  is_bodyweight INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS exercise_templates_name_unique ON exercise_templates (name);

CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts (user_id);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_template_id INTEGER NOT NULL REFERENCES exercise_templates(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_template_id_idx ON workout_exercises (exercise_template_id);

CREATE TABLE IF NOT EXISTS sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  weight_kg REAL NOT NULL,
  reps INTEGER NOT NULL,
  rest_seconds INTEGER,
  rpe REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sets_workout_exercise_id_idx ON sets (workout_exercise_id);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);

CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  goal TEXT NOT NULL DEFAULT 'strength',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_template_id INTEGER NOT NULL REFERENCES exercise_templates(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps INTEGER NOT NULL DEFAULT 10,
  rest_seconds INTEGER NOT NULL DEFAULT 60
);

CREATE INDEX IF NOT EXISTS routine_exercises_routine_id_idx ON routine_exercises (routine_id);
CREATE INDEX IF NOT EXISTS routine_exercises_exercise_template_id_idx ON routine_exercises (exercise_template_id);
`;

/**
 * Aplica el esquema. Es seguro llamarlo varias veces; cada sentencia está
 * protegida con IF NOT EXISTS.
 */
export function runMigrations(db: SQLiteDatabase): void {
  db.execSync(SCHEMA_SQL);

  // Instalaciones creadas antes de la columna `goal` no la tienen; se agrega
  // de forma condicional para que el esquema real coincida con schema.ts.
  const routineColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(routines)');
  if (!routineColumns.some((column) => column.name === 'goal')) {
    db.execSync("ALTER TABLE routines ADD COLUMN goal TEXT NOT NULL DEFAULT 'strength'");
  }
}
