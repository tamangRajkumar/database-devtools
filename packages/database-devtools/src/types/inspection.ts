export type ColumnInfo = {
  name: string;
  type: string;
  notNull: boolean;
  pk: boolean;
  defaultValue: string | null;
};

export type SchemaTable = {
  name: string;
  columns: ColumnInfo[];
};

export type TableInfo = {
  name: string;
  rowCount: number;
};

export type QueryResult = {
  columns: string[];
  rows: (string | number | null)[][];
  rowCount: number;
  durationMs: number;
};

export type QueryError = {
  message: string;
  sql: string;
};

export type TablePageRequest = {
  table: string;
  page: number;
  pageSize: number;
  sortColumn?: string | null;
  sortDir?: 'asc' | 'desc';
  search?: string;
};

export type TablePageResult = {
  columns: string[];
  rows: (string | number | null)[][];
  totalCount: number;
  page: number;
  pageSize: number;
};
