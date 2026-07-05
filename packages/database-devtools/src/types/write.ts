/** Cell value accepted for write operations. */
export type WriteCellValue = string | number | null;

export type InsertOperation = {
  kind: 'insert';
  table: string;
  values: Record<string, WriteCellValue>;
};

export type UpdateOperation = {
  kind: 'update';
  table: string;
  primaryKey: Record<string, WriteCellValue>;
  values: Record<string, WriteCellValue>;
};

export type DeleteOperation = {
  kind: 'delete';
  table: string;
  primaryKey: Record<string, WriteCellValue>;
};

export type WriteOperation = InsertOperation | UpdateOperation | DeleteOperation;
