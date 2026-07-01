/** Supported database engine identifiers. */
export type DatabaseKind = 'sqlite' | 'realm' | 'duckdb' | (string & {});

export const DATABASE_DEVTOOLS_KIND = Symbol.for('@database-devtools/kind');

export function readDatabaseKindMarker(value: unknown): DatabaseKind | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const marker = (value as Record<symbol, unknown>)[DATABASE_DEVTOOLS_KIND];

  return typeof marker === 'string' ? (marker as DatabaseKind) : undefined;
}
