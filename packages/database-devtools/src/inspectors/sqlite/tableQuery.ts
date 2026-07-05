import type { ColumnInfo } from '../../types/inspection';

export function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function buildSearchClause(
  columns: ColumnInfo[],
  search: string | undefined,
): { clause: string; params: string[] } {
  const term = search?.trim();

  if (!term || columns.length === 0) {
    return { clause: '', params: [] };
  }

  const pattern = `%${term}%`;
  const conditions = columns.map(
    (column) => `CAST(${quoteIdentifier(column.name)} AS TEXT) LIKE ?`,
  );

  return {
    clause: ` WHERE (${conditions.join(' OR ')})`,
    params: columns.map(() => pattern),
  };
}

export function resolveSortColumn(
  columns: ColumnInfo[],
  sortColumn: string | null | undefined,
): string | null {
  if (!sortColumn) {
    return null;
  }

  return columns.some((column) => column.name === sortColumn) ? sortColumn : null;
}
