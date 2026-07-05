import type { ColumnInfo } from 'database-devtools';
import type { WriteCellValue } from 'database-devtools';

export function getPrimaryKeyColumns(columns: ColumnInfo[]): string[] {
  const primaryKeys = columns.filter((column) => column.pk).map((column) => column.name);

  if (primaryKeys.length > 0) {
    return primaryKeys;
  }

  return columns[0] ? [columns[0].name] : [];
}

export function buildPrimaryKey(
  values: Record<string, WriteCellValue>,
  columns: ColumnInfo[],
): Record<string, WriteCellValue> {
  const pkColumns = getPrimaryKeyColumns(columns);
  const primaryKey: Record<string, WriteCellValue> = {};

  for (const column of pkColumns) {
    primaryKey[column] = values[column] ?? null;
  }

  return primaryKey;
}

export function parseCellInput(value: string, type: string): WriteCellValue {
  const trimmed = value.trim();

  if (trimmed === '' || trimmed.toLowerCase() === 'null') {
    return null;
  }

  if (/INT|REAL|NUM|DEC|FLOAT|DOUBLE/i.test(type)) {
    const numeric = Number(trimmed);

    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }

  return trimmed;
}

export function formatCellForInput(value: WriteCellValue): string {
  if (value === null) {
    return '';
  }

  return String(value);
}
