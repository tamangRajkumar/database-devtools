export const DEFAULT_MOBILE_SQL = `SELECT name FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;`;

export const DEFAULT_PAGE_SIZE = 50;
