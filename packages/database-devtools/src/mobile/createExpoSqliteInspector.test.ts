import { describe, expect, it } from 'vitest';
import { createExpoSqliteInspector } from './createExpoSqliteInspector';
import type { ExpoSqliteInspectableDatabase } from '../adapters/sqlite/types';

function createMockDatabase(): ExpoSqliteInspectableDatabase {
  const tables = {
    users: [
      { id: 1, email: 'ada@example.com', name: 'Ada' },
      { id: 2, email: 'grace@example.com', name: 'Grace' },
    ],
    bookings: [{ id: 1, user_id: 1, title: 'Talk', status: 'confirmed' }],
  };

  return {
    databasePath: '/data/devtools-example.db',
    async execAsync() {},
    async runAsync() {
      return { changes: 0 };
    },
    async serializeAsync() {
      return new Uint8Array();
    },
    async getFirstAsync<T>(source: string, params: unknown[] = []): Promise<T | null> {
      if (source.includes('sqlite_version')) {
        return { version: '3.45.0' } as T;
      }

      if (source.includes('pragma_page_size')) {
        return { page_size: 4096, page_count: 8 } as T;
      }

      if (source.includes('COUNT(*)')) {
        if (source.includes('users')) {
          return { count: tables.users.length } as T;
        }

        if (source.includes('bookings')) {
          return { count: tables.bookings.length } as T;
        }

        if (params.length >= 2) {
          return { count: tables.users.length } as T;
        }
      }

      return null;
    },
    async getAllAsync<T>(source: string, params: unknown[] = []): Promise<T[]> {
      if (source.includes('sqlite_master')) {
        return [{ name: 'users' }, { name: 'bookings' }] as T[];
      }

      if (source.includes('PRAGMA table_info')) {
        if (source.includes('users')) {
          return [
            { name: 'id', type: 'INTEGER', notnull: 0, dflt_value: null, pk: 1 },
            { name: 'email', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
          ] as T[];
        }
      }

      if (source.includes('FROM "users"')) {
        const limit = Number(params.at(-2) ?? 100);
        return tables.users.slice(0, limit) as T[];
      }

      if (source.trim().startsWith('SELECT name FROM sqlite_master')) {
        return [{ name: 'users' }, { name: 'bookings' }] as T[];
      }

      if (source.includes('FROM users') || source.includes('SELECT * FROM')) {
        return tables.users as T[];
      }

      return [] as T[];
    },
  };
}

describe('createExpoSqliteInspector', () => {
  it('lists tables with row counts', async () => {
    const inspector = createExpoSqliteInspector(createMockDatabase());
    const tables = await inspector.listTables();

    expect(tables).toEqual([
      { name: 'users', rowCount: 2 },
      { name: 'bookings', rowCount: 1 },
    ]);
  });

  it('returns database info', async () => {
    const inspector = createExpoSqliteInspector(createMockDatabase());
    const info = await inspector.getDatabaseInfo();

    expect(info.tableCount).toBe(2);
    expect(info.sqliteVersion).toBe('3.45.0');
    expect(info.estimatedSizeBytes).toBe(4096 * 8);
  });

  it('executes read-only queries', async () => {
    const inspector = createExpoSqliteInspector(createMockDatabase());
    const result = await inspector.executeQuery('SELECT * FROM users');

    expect(result.rowCount).toBe(2);
    expect(result.columns).toContain('email');
  });

  it('rejects write queries', async () => {
    const inspector = createExpoSqliteInspector(createMockDatabase());

    await expect(inspector.executeQuery('DELETE FROM users')).rejects.toThrow(/read-only/i);
  });
});
