import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { runMigrations } from './migrations';
import * as schema from './schema';
import { seedExerciseCatalog } from './seed';

export const DATABASE_NAME = 'ritmofit.db';

const sqlite = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(sqlite, { schema });

/**
 * Bootstrap the local database. Call once at app startup, before any
 * query/mutation is executed through the repository layer. Applies the schema
 * and seeds the exercise catalog (idempotent) so the app never starts empty.
 */
export function bootstrapDatabase(): void {
  runMigrations(sqlite);
  seedExerciseCatalog(db);
}
