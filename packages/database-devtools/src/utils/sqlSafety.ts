const BLOCKED_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|REINDEX|VACUUM|TRUNCATE)\b/i;

export function validateReadOnlySql(sql: string): void {
  const trimmed = sql.trim();

  if (!trimmed) {
    throw new Error('SQL query is empty');
  }

  if (BLOCKED_KEYWORDS.test(trimmed)) {
    throw new Error(
      'DevTools is read-only; only SELECT, PRAGMA, EXPLAIN, and WITH queries are allowed',
    );
  }

  const statements = trimmed
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    const leading = statement.replace(/^\s*(--[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*/g, '').trim();
    const keyword = leading.split(/\s+/)[0]?.toUpperCase();

    if (!keyword) {
      continue;
    }

    if (
      keyword !== 'SELECT' &&
      keyword !== 'PRAGMA' &&
      keyword !== 'EXPLAIN' &&
      keyword !== 'WITH'
    ) {
      throw new Error(`DevTools is read-only; "${keyword}" statements are not allowed`);
    }
  }
}
