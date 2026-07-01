import type { QueryResult } from 'database-devtools';

function escapeCsvCell(value: string | number | null): string {
  if (value === null) {
    return '';
  }

  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function formatResultsAsTsv(result: QueryResult): string {
  const header = result.columns.join('\t');
  const body = result.rows
    .map((row) => row.map((cell) => (cell === null ? '' : String(cell))).join('\t'))
    .join('\n');

  return `${header}\n${body}`;
}

export function formatResultsAsCsv(result: QueryResult): string {
  const header = result.columns.map((column) => escapeCsvCell(column)).join(',');
  const body = result.rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n');

  return `${header}\n${body}`;
}

export function formatResultsAsJson(result: QueryResult): string {
  const records = result.rows.map((row) => {
    const record: Record<string, string | number | null> = {};

    result.columns.forEach((column, index) => {
      record[column] = row[index] ?? null;
    });

    return record;
  });

  return JSON.stringify(records, null, 2);
}

export function downloadBlob(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
