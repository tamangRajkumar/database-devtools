import type { EditableDatabaseAdapter } from 'database-devtools';
import type { WriteOperation } from 'database-devtools';
import {
  buildDeleteSql,
  buildInsertSql,
  buildUpdateSql,
} from './buildWriteSql';
import type { ExpoSqliteDatabase } from './types';

export type CreateExpoSqliteAdapterOptions = {
  database: ExpoSqliteDatabase;
  id?: string;
  name?: string;
};

export function createExpoSqliteAdapter(
  options: CreateExpoSqliteAdapterOptions,
): EditableDatabaseAdapter {
  const { database } = options;
  let inTransaction = false;

  const assertTransaction = (): void => {
    if (!inTransaction) {
      throw new Error('No open transaction. Call beginTransaction() first.');
    }
  };

  const runWrite = async (operation: WriteOperation): Promise<{ rowsAffected: number }> => {
    assertTransaction();

    let sql: string;
    let params: unknown[];

    switch (operation.kind) {
      case 'insert': {
        const built = buildInsertSql(operation);
        sql = built.sql;
        params = built.params;
        break;
      }
      case 'update': {
        const built = buildUpdateSql(operation);
        sql = built.sql;
        params = built.params;
        break;
      }
      case 'delete': {
        const built = buildDeleteSql(operation);
        sql = built.sql;
        params = built.params;
        break;
      }
      default: {
        const exhaustive: never = operation;
        throw new Error(`Unsupported write operation: ${(exhaustive as WriteOperation).kind}`);
      }
    }

    const result = await database.runAsync(sql, params);
    return { rowsAffected: result.changes };
  };

  return {
    id: options.id ?? database.databasePath,
    name: options.name ?? 'SQLite',
    dialect: 'sqlite',
    async exportSnapshot(): Promise<Uint8Array> {
      await database.execAsync('PRAGMA wal_checkpoint(FULL)');
      return database.serializeAsync();
    },
    async beginTransaction(): Promise<void> {
      if (inTransaction) {
        throw new Error('Transaction already open');
      }

      await database.execAsync('BEGIN IMMEDIATE');
      inTransaction = true;
    },
    async commitTransaction(): Promise<void> {
      assertTransaction();

      try {
        await database.execAsync('COMMIT');
      } finally {
        inTransaction = false;
      }
    },
    async rollbackTransaction(): Promise<void> {
      if (!inTransaction) {
        return;
      }

      try {
        await database.execAsync('ROLLBACK');
      } finally {
        inTransaction = false;
      }
    },
    executeWrite: runWrite,
  };
}
