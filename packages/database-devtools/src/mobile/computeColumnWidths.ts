const CHAR_WIDTH = 7.5;
const CELL_PADDING = 24;
const MIN_COLUMN_WIDTH = 72;
const MAX_COLUMN_WIDTH = 280;
const SAMPLE_ROW_LIMIT = 20;

function hintMinWidth(columnName: string): number {
  const lower = columnName.toLowerCase();

  if (lower === 'id' || lower.endsWith('_id')) {
    return 80;
  }

  if (lower.includes('email')) {
    return 168;
  }

  if (lower.includes('created_at') || lower.includes('updated_at') || lower.endsWith('_at')) {
    return 188;
  }

  if (lower === 'name' || lower.includes('title')) {
    return 128;
  }

  if (lower === 'status' || lower === 'type') {
    return 96;
  }

  return MIN_COLUMN_WIDTH;
}

function measureText(text: string): number {
  return Math.ceil(text.length * CHAR_WIDTH) + CELL_PADDING;
}

function formatCellValue(value: string | number | null): string {
  if (value === null) {
    return 'NULL';
  }

  return String(value);
}

export function computeColumnWidths(
  columns: string[],
  rows: (string | number | null)[][],
): number[] {
  const sampleRows = rows.slice(0, SAMPLE_ROW_LIMIT);

  return columns.map((column, columnIndex) => {
    let maxWidth = measureText(column);

    for (const row of sampleRows) {
      const cell = formatCellValue(row[columnIndex] ?? null);
      maxWidth = Math.max(maxWidth, measureText(cell));
    }

    maxWidth = Math.max(maxWidth, hintMinWidth(column));

    return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, maxWidth));
  });
}

export function totalTableWidth(columnWidths: number[]): number {
  return columnWidths.reduce((sum, width) => sum + width, 0);
}

export function defaultMobileDataViewMode(columnCount: number): 'table' | 'cards' {
  return columnCount <= 4 ? 'cards' : 'table';
}

export function isMonospaceColumn(columnName: string): boolean {
  const lower = columnName.toLowerCase();

  return (
    lower === 'id' ||
    lower.endsWith('_id') ||
    lower.includes('created_at') ||
    lower.includes('updated_at') ||
    lower.endsWith('_at') ||
    lower.includes('date') ||
    lower.includes('time')
  );
}
