import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { runMigrations } from './migrations';
import * as schema from './schema';
import { seedExerciseCatalog } from './seed';

export const DATABASE_NAME = 'ritmofit.db';

const sqlite = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(sqlite, { schema });

/**
 * Inicializa la base de datos local. Llamar una sola vez al arrancar la app,
 * antes de ejecutar cualquier consulta/mutación a través de la capa de
 * repositorios. Aplica el esquema y siembra el catálogo de ejercicios
 * (idempotente) para que la app nunca arranque vacía.
 */
export function bootstrapDatabase(): void {
  runMigrations(sqlite);
  seedExerciseCatalog(db);
}
