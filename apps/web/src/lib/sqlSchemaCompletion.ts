import type { SchemaTable } from 'database-devtools';

export function buildSqlSchemaCompletion(schema: SchemaTable[]): Record<string, string[]> {
  const completion: Record<string, string[]> = {};

  for (const table of schema) {
    completion[table.name] = table.columns.map((column) => column.name);
  }

  return completion;
}
