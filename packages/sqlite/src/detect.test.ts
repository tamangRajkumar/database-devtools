import { describe, expect, it } from 'vitest';
import { buildDeleteSql, buildInsertSql, buildUpdateSql } from './buildWriteSql';
import { detectExpoSqlite } from './detect';

describe('detectExpoSqlite', () => {
  it('returns true for expo-sqlite shaped objects', () => {
    expect(
      detectExpoSqlite({
        databasePath: '/data/app.db',
        execAsync: async () => undefined,
        runAsync: async () => ({ changes: 1 }),
        serializeAsync: async () => new Uint8Array(),
      }),
    ).toBe(true);
  });

  it('returns false for partial or invalid objects', () => {
    expect(detectExpoSqlite(null)).toBe(false);
    expect(detectExpoSqlite({ databasePath: 'x' })).toBe(false);
    expect(detectExpoSqlite({ execAsync: () => {}, serializeAsync: () => {} })).toBe(false);
  });
});

describe('buildWriteSql', () => {
  it('builds parameterized insert SQL', () => {
    const built = buildInsertSql({
      kind: 'insert',
      table: 'users',
      values: { id: 1, name: 'Ada' },
    });

    expect(built.sql).toContain('INSERT INTO "users"');
    expect(built.params).toEqual([1, 'Ada']);
  });

  it('builds parameterized update SQL', () => {
    const built = buildUpdateSql({
      kind: 'update',
      table: 'users',
      primaryKey: { id: 1 },
      values: { name: 'Grace' },
    });

    expect(built.sql).toContain('UPDATE "users"');
    expect(built.sql).toContain('WHERE "id" = ?');
    expect(built.params).toEqual(['Grace', 1]);
  });

  it('builds parameterized delete SQL', () => {
    const built = buildDeleteSql({
      kind: 'delete',
      table: 'users',
      primaryKey: { id: 2 },
    });

    expect(built.sql).toBe('DELETE FROM "users" WHERE "id" = ?');
    expect(built.params).toEqual([2]);
  });
});
