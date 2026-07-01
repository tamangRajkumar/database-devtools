import { getAdapterRegistry } from '../../adapter/registry';
import type { AdapterDefinition } from '../../adapter/types';
import { createExpoSqliteAdapter } from './createExpoSqliteAdapter';
import { detectExpoSqlite } from './detect';
import type { ExpoSqliteDatabase } from './types';

export const sqliteAdapterDefinition: AdapterDefinition = {
  kind: 'sqlite',
  displayName: 'SQLite',
  priority: 100,
  detect: detectExpoSqlite,
  create: (database) =>
    createExpoSqliteAdapter({
      database: database as ExpoSqliteDatabase,
      name: (database as ExpoSqliteDatabase).databasePath,
    }),
};

export function registerSqliteAdapter(): void {
  getAdapterRegistry().register(sqliteAdapterDefinition);
}
