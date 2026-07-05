import type { QueryResult } from 'database-devtools';
import type { FavoriteQuery, QueryHistoryEntry } from '../types/sqlWorkspace';
import { MAX_HISTORY_ENTRIES } from '../types/sqlWorkspace';

const HISTORY_KEY = 'database-devtools-query-history';
const FAVORITES_KEY = 'database-devtools-query-favorites';

function readJson<T>(key: string): T {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return {} as T;
    }

    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

type ScopedStore<T> = Record<string, T[]>;

function scopeKey(deviceId: string | null): string {
  return deviceId ?? '__global__';
}

export function loadHistory(deviceId: string | null): QueryHistoryEntry[] {
  const store = readJson<ScopedStore<QueryHistoryEntry>>(HISTORY_KEY);
  return store[scopeKey(deviceId)] ?? [];
}

export function saveHistory(deviceId: string | null, entries: QueryHistoryEntry[]): void {
  const store = readJson<ScopedStore<QueryHistoryEntry>>(HISTORY_KEY);
  store[scopeKey(deviceId)] = entries.slice(0, MAX_HISTORY_ENTRIES);
  writeJson(HISTORY_KEY, store);
}

export function appendHistory(
  deviceId: string | null,
  entry: QueryHistoryEntry,
): QueryHistoryEntry[] {
  const current = loadHistory(deviceId);
  const next = [entry, ...current.filter((item) => item.sql !== entry.sql)].slice(
    0,
    MAX_HISTORY_ENTRIES,
  );
  saveHistory(deviceId, next);
  return next;
}

export function clearHistory(deviceId: string | null): void {
  saveHistory(deviceId, []);
}

export function loadFavorites(deviceId: string | null): FavoriteQuery[] {
  const store = readJson<ScopedStore<FavoriteQuery>>(FAVORITES_KEY);
  return store[scopeKey(deviceId)] ?? [];
}

export function saveFavorites(deviceId: string | null, favorites: FavoriteQuery[]): void {
  const store = readJson<ScopedStore<FavoriteQuery>>(FAVORITES_KEY);
  store[scopeKey(deviceId)] = favorites;
  writeJson(FAVORITES_KEY, store);
}

export function addFavorite(deviceId: string | null, favorite: FavoriteQuery): FavoriteQuery[] {
  const current = loadFavorites(deviceId);
  const withoutDuplicate = current.filter((item) => item.name !== favorite.name);
  const next = [favorite, ...withoutDuplicate];
  saveFavorites(deviceId, next);
  return next;
}

export function deleteFavorite(deviceId: string | null, id: string): FavoriteQuery[] {
  const next = loadFavorites(deviceId).filter((item) => item.id !== id);
  saveFavorites(deviceId, next);
  return next;
}

export function formatHistoryLabel(entry: QueryHistoryEntry): string {
  const firstLine = entry.sql.trim().split('\n')[0] ?? '';
  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine;
}

export function createHistoryEntry(
  sql: string,
  result?: QueryResult,
  error?: string,
): QueryHistoryEntry {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sql,
    ranAt: Date.now(),
    durationMs: result?.durationMs,
    rowCount: result?.rowCount,
    error,
  };
}

export function createFavorite(name: string, sql: string): FavoriteQuery {
  return {
    id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    sql,
    createdAt: Date.now(),
  };
}
