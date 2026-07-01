import type {
  ColumnInfo,
  QueryResult,
  SchemaTable,
  TableInfo,
  TablePageRequest,
  TablePageResult,
} from 'database-devtools';
import type { DatabaseInspector } from 'database-devtools/inspector';
import type { SnapshotExport } from 'database-devtools';
import { getSqlModule } from './sqlModule';
import { buildSearchClause, quoteIdentifier, resolveSortColumn } from './tableQuery';

const SQLITE_SNAPSHOT_MIME_TYPE = 'application/x-sqlite3';

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

export class SqliteSession {
  private readonly tableNames = new Set<string>();

  private constructor(private readonly db: import('sql.js').Database) {}

  static async open(bytes: ArrayBuffer): Promise<SqliteSession> {
    const SQL = await getSqlModule();
    const db = new SQL.Database(new Uint8Array(bytes));
    const session = new SqliteSession(db);
    session.listTables().forEach((table) => session.tableNames.add(table.name));
    return session;
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

  getTableColumns(tableName: string): ColumnInfo[] {
    this.assertKnownTable(tableName);
    return this.readTableColumns(tableName);
  }

  fetchTablePage(request: TablePageRequest): TablePageResult {
    this.assertKnownTable(request.table);

    const columns = this.readTableColumns(request.table);
    const columnNames = columns.map((column) => column.name);
    const tableQuoted = quoteIdentifier(request.table);
    const { clause, params } = buildSearchClause(columns, request.search);
    const sortColumn = resolveSortColumn(columns, request.sortColumn);
    const sortDir = request.sortDir === 'desc' ? 'DESC' : 'ASC';
    const page = Math.max(1, request.page);
    const pageSize = Math.max(1, request.pageSize);
    const offset = (page - 1) * pageSize;

    const countStatement = this.db.prepare(`SELECT COUNT(*) AS c FROM ${tableQuoted}${clause}`);
    countStatement.bind(params);
    countStatement.step();
    const totalCount = Number(countStatement.get()[0] ?? 0);
    countStatement.free();

    const orderClause = sortColumn
      ? ` ORDER BY ${quoteIdentifier(sortColumn)} ${sortDir}`
      : '';
    const dataStatement = this.db.prepare(
      `SELECT * FROM ${tableQuoted}${clause}${orderClause} LIMIT ? OFFSET ?`,
    );
    dataStatement.bind([...params, pageSize, offset]);

    const rows: (string | number | null)[][] = [];

    while (dataStatement.step()) {
      rows.push(columnNames.map((_, index) => normalizeCell(dataStatement.get()[index])));
    }

    dataStatement.free();

    return {
      columns: columnNames,
      rows,
      totalCount,
      page,
      pageSize,
    };
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

  private assertKnownTable(tableName: string): void {
    if (!this.tableNames.has(tableName)) {
      throw new Error(`Unknown table: ${tableName}`);
    }
  }

  private readTableColumns(tableName: string): ColumnInfo[] {
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

export function filterTables(tables: TableInfo[], search: string): TableInfo[] {
  const term = search.trim().toLowerCase();

  if (!term) {
    return tables;
  }

  return tables.filter((table) => table.name.toLowerCase().includes(term));
}

export function sortTables(
  tables: TableInfo[],
  sortBy: 'name' | 'rows',
  direction: 'asc' | 'desc',
): TableInfo[] {
  const sorted = [...tables].sort((left, right) => {
    if (sortBy === 'rows') {
      return left.rowCount - right.rowCount;
    }

    return left.name.localeCompare(right.name);
  });

  return direction === 'desc' ? sorted.reverse() : sorted;
}

export class SqliteInspector implements DatabaseInspector {
  readonly kind = 'sqlite' as const;
  readonly capabilities = {
    explorer: true,
    schemaView: true,
    tableData: true,
    sqlWorkspace: true,
  };

  private session: SqliteSession | null = null;

  async open(snapshot: SnapshotExport | ArrayBuffer): Promise<void> {
    this.close();

    const bytes: ArrayBuffer =
      snapshot instanceof ArrayBuffer
        ? snapshot
        : new Uint8Array(snapshot.bytes).buffer;

    if (!isSqliteDatabase(bytes)) {
      throw new Error('Snapshot is not a valid SQLite database file');
    }

    this.session = await SqliteSession.open(bytes);
  }

  close(): void {
    this.session?.close();
    this.session = null;
  }

  listTables(): TableInfo[] {
    return this.requireSession().listTables();
  }

  getSchema(): SchemaTable[] {
    return this.requireSession().getSchema();
  }

  fetchTablePage(request: TablePageRequest): TablePageResult {
    return this.requireSession().fetchTablePage(request);
  }

  executeQuery(sql: string): QueryResult {
    return this.requireSession().executeQuery(sql);
  }

  private requireSession(): SqliteSession {
    if (!this.session) {
      throw new Error('No database loaded');
    }

    return this.session;
  }
}

export const sqliteInspectorDefinition = {
  kind: 'sqlite' as const,
  displayName: 'SQLite',
  mimeTypes: [SQLITE_SNAPSHOT_MIME_TYPE, 'application/octet-stream'],
  canOpenBytes: isSqliteDatabase,
  createInspector: () => new SqliteInspector(),
};
