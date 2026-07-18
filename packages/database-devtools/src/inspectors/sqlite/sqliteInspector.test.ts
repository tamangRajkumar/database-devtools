import { describe, expect, it } from 'vitest';
import { getSqlModule } from './sqlModule';
import {
  filterTables,
  isSqliteDatabase,
  sortTables,
  SqliteInspector,
} from './sqliteInspector';

async function createSampleDatabase(): Promise<ArrayBuffer> {
  const SQL = await getSqlModule();
  const db = new SQL.Database();
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
  db.run('INSERT INTO users (id, name) VALUES (1, ?)', ['Ada']);
  const bytes = db.export();
  db.close();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

describe('isSqliteDatabase', () => {
  it('detects SQLite file magic header', async () => {
    const bytes = await createSampleDatabase();
    expect(isSqliteDatabase(bytes)).toBe(true);
    expect(isSqliteDatabase(new ArrayBuffer(16))).toBe(false);
  });
});

describe('table helpers', () => {
  it('filters and sorts tables', () => {
    const tables = [
      { name: 'bookings', rowCount: 3 },
      { name: 'users', rowCount: 10 },
    ];

    expect(filterTables(tables, 'user')).toHaveLength(1);
    expect(sortTables(tables, 'rows', 'desc')[0]?.name).toBe('users');
  });
});

describe('SqliteInspector', () => {
  it('opens a snapshot and lists tables', async () => {
    const bytes = await createSampleDatabase();
    const inspector = new SqliteInspector();

    await inspector.open(bytes);

    const tables = inspector.listTables();
    expect(tables.some((table) => table.name === 'users')).toBe(true);
    expect(inspector.getSchema()[0]?.columns.length).toBeGreaterThan(0);

    const page = inspector.fetchTablePage({
      table: 'users',
      page: 1,
      pageSize: 10,
    });
    expect(page.totalCount).toBe(1);
    expect(page.rows[0]?.[1]).toBe('Ada');

    inspector.close();
  });
});
