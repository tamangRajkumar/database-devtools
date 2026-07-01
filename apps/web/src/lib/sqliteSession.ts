import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { ColumnInfo, QueryResult, SchemaTable, TableInfo } from 'database-devtools';

let sqlModulePromise: Promise<SqlJsStatic> | null = null;

async function getSqlModule(): Promise<SqlJsStatic> {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }

  return sqlModulePromise;
}

function normalizeCell(cell: unknown): string | number | null {
  if (cell === null || cell === undefined) {
    return null;
  }

  if (typeof cell === 'number' || typeof cell === 'string') {
    return cell;
  }

  if (cell instanceof Uint8Array) {
    return `[BLOB ${cell.byteLength} bytes]`;
  }

  return String(cell);
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export class SqliteSession {
  private constructor(private readonly db: Database) {}

  static async open(bytes: ArrayBuffer): Promise<SqliteSession> {
    const SQL = await getSqlModule();
    const db = new SQL.Database(new Uint8Array(bytes));
    return new SqliteSession(db);
  }

  close(): void {
    this.db.close();
  }

  listTables(): TableInfo[] {
    const statement = this.db.prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    );

    const tables: TableInfo[] = [];

    while (statement.step()) {
      const name = String(statement.get()[0]);
      const countStatement = this.db.prepare(`SELECT COUNT(*) AS c FROM ${quoteIdentifier(name)}`);

      countStatement.step();
      const rowCount = Number(countStatement.get()[0] ?? 0);
      countStatement.free();

      tables.push({ name, rowCount });
    }

    statement.free();
    return tables;
  }

  getSchema(): SchemaTable[] {
    const tables = this.listTables();

    return tables.map((table) => ({
      name: table.name,
      columns: this.getTableColumns(table.name),
    }));
  }

  executeQuery(sql: string): QueryResult {
    const startedAt = performance.now();
    const resultSets = this.db.exec(sql);
    const durationMs = performance.now() - startedAt;

    if (resultSets.length === 0) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        durationMs,
      };
    }

    const primary = resultSets[0];

    return {
      columns: primary.columns,
      rows: primary.values.map((row) => row.map((cell) => normalizeCell(cell))),
      rowCount: primary.values.length,
      durationMs,
    };
  }

  private getTableColumns(tableName: string): ColumnInfo[] {
    const statement = this.db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
    const columns: ColumnInfo[] = [];

    while (statement.step()) {
      const row = statement.getAsObject() as {
        name: string;
        type: string;
        notnull: number;
        pk: number;
        dflt_value: string | null;
      };

      columns.push({
        name: row.name,
        type: row.type || 'ANY',
        notNull: row.notnull === 1,
        pk: row.pk > 0,
        defaultValue: row.dflt_value,
      });
    }

    statement.free();
    return columns;
  }
}

export function isSqliteDatabase(bytes: ArrayBuffer): boolean {
  const header = new TextDecoder().decode(new Uint8Array(bytes, 0, 16));
  return header.startsWith('SQLite format 3');
}
