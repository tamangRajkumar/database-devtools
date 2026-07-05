import type { ExpoSqliteInspectableDatabase } from '../adapters/sqlite/types';
import type {
  ColumnInfo,
  QueryResult,
  SchemaTable,
  TableInfo,
  TablePageRequest,
  TablePageResult,
} from '../types/inspection';
import { validateReadOnlySql } from '../utils/sqlSafety';
import type { MobileDatabaseInfo, MobileDatabaseInspector } from './types';
import { buildSearchClause, quoteIdentifier, resolveSortColumn } from './sqliteTableQuery';

type PragmaTableInfoRow = {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | number | null;
  pk: number;
};

function normalizeCell(cell: unknown): string | number | null {
  if (cell === null || cell === undefined) {
    return null;
  }

  if (typeof cell === 'number' || typeof cell === 'string') {
    return cell;
  }

  if (typeof cell === 'boolean') {
    return cell ? 1 : 0;
  }

  if (cell instanceof Uint8Array) {
    return `[BLOB ${cell.byteLength} bytes]`;
  }

  return String(cell);
}

function objectRowsToMatrix(rows: Record<string, unknown>[]): {
  columns: string[];
  matrix: (string | number | null)[][];
} {
  if (rows.length === 0) {
    return { columns: [], matrix: [] };
  }

  const columns = Object.keys(rows[0]!);

  return {
    columns,
    matrix: rows.map((row) => columns.map((column) => normalizeCell(row[column]))),
  };
}

export function createExpoSqliteInspector(
  database: ExpoSqliteInspectableDatabase,
): MobileDatabaseInspector {
  let operationQueue: Promise<void> = Promise.resolve();

  const enqueue = async <T>(operation: () => Promise<T>): Promise<T> => {
    const next = operationQueue.then(operation);
    operationQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };

  const listTablesInternal = async (): Promise<TableInfo[]> => {
    const masterRows = await database.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    );

    const tables: TableInfo[] = [];

    for (const row of masterRows) {
      const countRow = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM ${quoteIdentifier(row.name)}`,
      );

      tables.push({
        name: row.name,
        rowCount: Number(countRow?.count ?? 0),
      });
    }

    return tables;
  };

  const getTableColumnsInternal = async (table: string): Promise<ColumnInfo[]> => {
    const rows = await database.getAllAsync<PragmaTableInfoRow>(
      `PRAGMA table_info(${quoteIdentifier(table)})`,
    );

    return rows.map((row) => ({
      name: row.name,
      type: row.type || 'ANY',
      notNull: row.notnull === 1,
      pk: row.pk === 1,
      defaultValue:
        row.dflt_value === null || row.dflt_value === undefined
          ? null
          : String(row.dflt_value),
    }));
  };

  return {
    listTables: () => enqueue(listTablesInternal),

    getSchema: () =>
      enqueue(async () => {
        const tables = await listTablesInternal();

        return Promise.all(
          tables.map(async (table) => ({
            name: table.name,
            columns: await getTableColumnsInternal(table.name),
          })),
        );
      }),

    getTableColumns: (table) => enqueue(() => getTableColumnsInternal(table)),

    getDatabaseInfo: () =>
      enqueue(async () => {
        const tables = await listTablesInternal();
        const versionRow = await database.getFirstAsync<{ version: string }>(
          'SELECT sqlite_version() AS version',
        );
        const pageRow = await database.getFirstAsync<{ page_size: number; page_count: number }>(
          'SELECT page_size, page_count FROM pragma_page_size(), pragma_page_count()',
        );
        const pageSize = Number(pageRow?.page_size ?? 0);
        const pageCount = Number(pageRow?.page_count ?? 0);

        return {
          name: database.databasePath.split('/').pop() ?? database.databasePath,
          path: database.databasePath,
          tableCount: tables.length,
          sqliteVersion: versionRow?.version ?? 'unknown',
          pageSize,
          pageCount,
          estimatedSizeBytes: pageSize * pageCount,
        } satisfies MobileDatabaseInfo;
      }),

    fetchTablePage: (request) =>
      enqueue(async () => {
        const columns = await getTableColumnsInternal(request.table);
        const { clause, params: searchParams } = buildSearchClause(columns, request.search);
        const quotedTable = quoteIdentifier(request.table);
        const countRow = await database.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) AS count FROM ${quotedTable}${clause}`,
          searchParams,
        );
        const totalCount = Number(countRow?.count ?? 0);
        const pageSize = Math.max(1, request.pageSize);
        const page = Math.max(1, request.page);
        const offset = (page - 1) * pageSize;
        const sortColumn = resolveSortColumn(columns, request.sortColumn);
        const orderClause = sortColumn
          ? ` ORDER BY ${quoteIdentifier(sortColumn)} ${request.sortDir === 'desc' ? 'DESC' : 'ASC'}`
          : '';
        const rows = await database.getAllAsync<Record<string, unknown>>(
          `SELECT * FROM ${quotedTable}${clause}${orderClause} LIMIT ? OFFSET ?`,
          [...searchParams, pageSize, offset],
        );
        const { columns: resultColumns, matrix } = objectRowsToMatrix(rows);

        return {
          columns: resultColumns,
          rows: matrix,
          totalCount,
          page,
          pageSize,
        } satisfies TablePageResult;
      }),

    executeQuery: (sql) =>
      enqueue(async () => {
        validateReadOnlySql(sql);
        const started = Date.now();
        const rows = await database.getAllAsync<Record<string, unknown>>(sql);
        const { columns, matrix } = objectRowsToMatrix(rows);

        return {
          columns,
          rows: matrix,
          rowCount: matrix.length,
          durationMs: Date.now() - started,
        } satisfies QueryResult;
      }),
  };
}
