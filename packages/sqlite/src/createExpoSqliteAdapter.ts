import type { DatabaseAdapter } from 'database-devtools';
import type { ExpoSqliteDatabase } from './types';

export type CreateExpoSqliteAdapterOptions = {
  database: ExpoSqliteDatabase;
  id?: string;
  name?: string;
};

export function createExpoSqliteAdapter(
  options: CreateExpoSqliteAdapterOptions,
): DatabaseAdapter {
  const { database } = options;

  return {
    id: options.id ?? database.databasePath,
    name: options.name ?? 'SQLite',
    dialect: 'sqlite',
    async exportSnapshot(): Promise<Uint8Array> {
      await database.execAsync('PRAGMA wal_checkpoint(FULL)');
      return database.serializeAsync();
    },
  };
}
