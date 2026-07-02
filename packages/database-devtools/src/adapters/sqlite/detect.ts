import type { ExpoSqliteDatabase, ExpoSqliteInspectableDatabase } from './types';

export function detectExpoSqlite(database: unknown): database is ExpoSqliteDatabase {
  return (
    typeof database === 'object' &&
    database !== null &&
    typeof (database as ExpoSqliteDatabase).execAsync === 'function' &&
    typeof (database as ExpoSqliteDatabase).serializeAsync === 'function' &&
    typeof (database as ExpoSqliteDatabase).runAsync === 'function' &&
    typeof (database as ExpoSqliteDatabase).databasePath === 'string'
  );
}

export function detectExpoSqliteInspectable(
  database: unknown,
): database is ExpoSqliteInspectableDatabase {
  return (
    detectExpoSqlite(database) &&
    typeof (database as ExpoSqliteInspectableDatabase).getAllAsync === 'function' &&
    typeof (database as ExpoSqliteInspectableDatabase).getFirstAsync === 'function'
  );
}
