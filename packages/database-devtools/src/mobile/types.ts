import type {
  ColumnInfo,
  QueryResult,
  SchemaTable,
  TableInfo,
  TablePageRequest,
  TablePageResult,
} from '../types/inspection';

export type MobileDatabaseInfo = {
  name: string;
  path: string;
  tableCount: number;
  sqliteVersion: string;
  pageSize: number;
  pageCount: number;
  estimatedSizeBytes: number;
};

export type MobileDatabaseInspector = {
  listTables(): Promise<TableInfo[]>;
  getSchema(): Promise<SchemaTable[]>;
  getTableColumns(table: string): Promise<ColumnInfo[]>;
  getDatabaseInfo(): Promise<MobileDatabaseInfo>;
  fetchTablePage(request: TablePageRequest): Promise<TablePageResult>;
  executeQuery(sql: string): Promise<QueryResult>;
};
