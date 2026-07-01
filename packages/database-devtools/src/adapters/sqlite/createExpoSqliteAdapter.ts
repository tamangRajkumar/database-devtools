import type { WritableDatabaseAdapter } from '../../types/adapter';
import type { WriteOperation } from '../../types/write';
import { SQLITE_SNAPSHOT_MIME_TYPE } from '../../types/snapshot';
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
): WritableDatabaseAdapter {
  const { database } = options;
  let inTransaction = false;

  const assertTransaction = (): void => {
    if (!inTransaction) {
      throw new Error('No open transaction. Call beginTransaction() first.');
    }
  };

  const runWrite = async (operation: WriteOperation) => {
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
    kind: 'sqlite',
    dialect: 'sqlite',
    id: options.id ?? database.databasePath,
    name: options.name ?? 'SQLite',
    capabilities: {
      exportSnapshot: true,
      executeQuery: false,
      listTables: false,
      getSchema: false,
      transactionalWrites: true,
      observeChanges: false,
      importSnapshot: false,
    },
    async exportSnapshot() {
      await database.execAsync('PRAGMA wal_checkpoint(FULL)');
      const bytes = await database.serializeAsync();

      return {
        bytes,
        mimeType: SQLITE_SNAPSHOT_MIME_TYPE,
        kind: 'sqlite' as const,
        exportedAt: Date.now(),
      };
    },
    async beginTransaction() {
      if (inTransaction) {
        throw new Error('Transaction already open');
      }

      await database.execAsync('BEGIN IMMEDIATE');
      inTransaction = true;
    },
    async commitTransaction() {
      assertTransaction();

      try {
        await database.execAsync('COMMIT');
      } finally {
        inTransaction = false;
      }
    },
    async rollbackTransaction() {
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
