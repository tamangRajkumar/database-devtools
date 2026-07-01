export type QueryHistoryEntry = {
  id: string;
  sql: string;
  ranAt: number;
  durationMs?: number;
  rowCount?: number;
  error?: string;
};

export type FavoriteQuery = {
  id: string;
  name: string;
  sql: string;
  createdAt: number;
};

export type QuerySidebarTab = 'history' | 'favorites';

export const DEFAULT_SQL = `SELECT name FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name`;

export const MAX_HISTORY_ENTRIES = 50;
