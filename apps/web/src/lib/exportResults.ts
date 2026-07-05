import type { QueryResult } from 'database-devtools';

function escapeCsvCell(value: string | number | null): string {
  if (value === null) {
    return '';
  }

  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function excelCell(value: string | number | null): string {
  if (value === null) {
    return '<Cell/>';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  return `<Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
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

export function formatResultsAsExcelXml(result: QueryResult): string {
  const headerRow = `<Row>${result.columns.map((column) => excelCell(column)).join('')}</Row>`;
  const bodyRows = result.rows
    .map((row) => `<Row>${row.map((cell) => excelCell(cell)).join('')}</Row>`)
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Results">
  <Table>
   ${headerRow}
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
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
