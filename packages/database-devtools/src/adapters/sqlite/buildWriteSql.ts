import type {
  DeleteOperation,
  InsertOperation,
  UpdateOperation,
  WriteCellValue,
} from '../../types/write';

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function quoteIdentifier(name: string): string {
  if (!IDENTIFIER_PATTERN.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }

  return `"${name.replace(/"/g, '""')}"`;
}

export function buildInsertSql(operation: InsertOperation): { sql: string; params: WriteCellValue[] } {
  const columns = Object.keys(operation.values);

  if (columns.length === 0) {
    throw new Error('Insert requires at least one column value');
  }

  const quotedColumns = columns.map(quoteIdentifier).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${quoteIdentifier(operation.table)} (${quotedColumns}) VALUES (${placeholders})`;
  const params = columns.map((column) => operation.values[column] ?? null);

  return { sql, params };
}

export function buildUpdateSql(operation: UpdateOperation): { sql: string; params: WriteCellValue[] } {
  const valueColumns = Object.keys(operation.values);
  const pkColumns = Object.keys(operation.primaryKey);

  if (valueColumns.length === 0) {
    throw new Error('Update requires at least one column value');
  }

  if (pkColumns.length === 0) {
    throw new Error('Update requires a primary key');
  }

  const setClause = valueColumns.map((column) => `${quoteIdentifier(column)} = ?`).join(', ');
  const whereClause = pkColumns.map((column) => `${quoteIdentifier(column)} = ?`).join(' AND ');
  const sql = `UPDATE ${quoteIdentifier(operation.table)} SET ${setClause} WHERE ${whereClause}`;
  const params = [
    ...valueColumns.map((column) => operation.values[column] ?? null),
    ...pkColumns.map((column) => operation.primaryKey[column] ?? null),
  ];

  return { sql, params };
}

export function buildDeleteSql(operation: DeleteOperation): { sql: string; params: WriteCellValue[] } {
  const pkColumns = Object.keys(operation.primaryKey);

  if (pkColumns.length === 0) {
    throw new Error('Delete requires a primary key');
  }

  const whereClause = pkColumns.map((column) => `${quoteIdentifier(column)} = ?`).join(' AND ');
  const sql = `DELETE FROM ${quoteIdentifier(operation.table)} WHERE ${whereClause}`;
  const params = pkColumns.map((column) => operation.primaryKey[column] ?? null);

  return { sql, params };
}
