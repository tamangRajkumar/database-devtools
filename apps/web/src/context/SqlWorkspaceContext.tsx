import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { QueryResult } from 'database-devtools';
import {
  copyTextToClipboard,
  downloadBlob,
  formatResultsAsCsv,
  formatResultsAsJson,
  formatResultsAsTsv,
} from '../lib/exportResults';
import {
  addFavorite,
  appendHistory,
  clearHistory as clearStoredHistory,
  createFavorite,
  createHistoryEntry,
  deleteFavorite as deleteStoredFavorite,
  loadFavorites,
  loadHistory,
} from '../lib/queryStorage';
import { DEFAULT_SQL, type FavoriteQuery, type QueryHistoryEntry, type QuerySidebarTab } from '../types/sqlWorkspace';
import { useDevTools } from './DevToolsContext';

type SqlWorkspaceContextValue = {
  sql: string;
  setSql: (sql: string) => void;
  result: QueryResult | null;
  error: string | null;
  running: boolean;
  runQuery: () => void;
  sidebarTab: QuerySidebarTab;
  setSidebarTab: (tab: QuerySidebarTab) => void;
  history: QueryHistoryEntry[];
  favorites: FavoriteQuery[];
  loadFromHistory: (id: string) => void;
  loadFavorite: (id: string) => void;
  saveFavorite: (name: string) => void;
  deleteFavorite: (id: string) => void;
  clearHistory: () => void;
  copyResults: () => Promise<void>;
  exportCsv: () => void;
  exportJson: () => void;
  saveDialogOpen: boolean;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  copyStatus: string | null;
};

const SqlWorkspaceContext = createContext<SqlWorkspaceContextValue | null>(null);

export function SqlWorkspaceProvider({ children }: { children: ReactNode }) {
  const { selectedDeviceId, hasDatabase, executeQuery, clearQueryError } = useDevTools();

  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<QuerySidebarTab>('history');
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteQuery[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory(selectedDeviceId));
    setFavorites(loadFavorites(selectedDeviceId));
  }, [selectedDeviceId]);

  const runQuery = useCallback(() => {
    if (!hasDatabase || running) {
      return;
    }

    setRunning(true);
    setError(null);
    clearQueryError();

    try {
      const queryResult = executeQuery(sql);
      setResult(queryResult);
      const entry = createHistoryEntry(sql, queryResult);
      setHistory(appendHistory(selectedDeviceId, entry));
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Query failed';
      setError(message);
      setResult(null);
      const entry = createHistoryEntry(sql, undefined, message);
      setHistory(appendHistory(selectedDeviceId, entry));
    } finally {
      setRunning(false);
    }
  }, [hasDatabase, running, sql, executeQuery, clearQueryError, selectedDeviceId]);

  const loadFromHistory = useCallback(
    (id: string) => {
      const entry = history.find((item) => item.id === id);

      if (entry) {
        setSql(entry.sql);
        setError(null);
      }
    },
    [history],
  );

  const loadFavorite = useCallback(
    (id: string) => {
      const favorite = favorites.find((item) => item.id === id);

      if (favorite) {
        setSql(favorite.sql);
        setError(null);
      }
    },
    [favorites],
  );

  const saveFavorite = useCallback(
    (name: string) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      setFavorites(addFavorite(selectedDeviceId, createFavorite(trimmed, sql)));
      setSaveDialogOpen(false);
      setSidebarTab('favorites');
    },
    [sql, selectedDeviceId],
  );

  const deleteFavorite = useCallback(
    (id: string) => {
      setFavorites(deleteStoredFavorite(selectedDeviceId, id));
    },
    [selectedDeviceId],
  );

  const clearHistory = useCallback(() => {
    clearStoredHistory(selectedDeviceId);
    setHistory([]);
  }, [selectedDeviceId]);

  const copyResults = useCallback(async () => {
    if (!result || result.columns.length === 0) {
      return;
    }

    await copyTextToClipboard(formatResultsAsTsv(result));
    setCopyStatus('Copied to clipboard');
    window.setTimeout(() => setCopyStatus(null), 2000);
  }, [result]);

  const exportCsv = useCallback(() => {
    if (!result || result.columns.length === 0) {
      return;
    }

    downloadBlob('query-results.csv', formatResultsAsCsv(result), 'text/csv;charset=utf-8');
  }, [result]);

  const exportJson = useCallback(() => {
    if (!result || result.columns.length === 0) {
      return;
    }

    downloadBlob('query-results.json', formatResultsAsJson(result), 'application/json');
  }, [result]);

  const value = useMemo(
    () => ({
      sql,
      setSql,
      result,
      error,
      running,
      runQuery,
      sidebarTab,
      setSidebarTab,
      history,
      favorites,
      loadFromHistory,
      loadFavorite,
      saveFavorite,
      deleteFavorite,
      clearHistory,
      copyResults,
      exportCsv,
      exportJson,
      saveDialogOpen,
      openSaveDialog: () => setSaveDialogOpen(true),
      closeSaveDialog: () => setSaveDialogOpen(false),
      copyStatus,
    }),
    [
      sql,
      result,
      error,
      running,
      runQuery,
      sidebarTab,
      history,
      favorites,
      loadFromHistory,
      loadFavorite,
      saveFavorite,
      deleteFavorite,
      clearHistory,
      copyResults,
      exportCsv,
      exportJson,
      saveDialogOpen,
      copyStatus,
    ],
  );

  return <SqlWorkspaceContext.Provider value={value}>{children}</SqlWorkspaceContext.Provider>;
}

export function useSqlWorkspace(): SqlWorkspaceContextValue {
  const context = useContext(SqlWorkspaceContext);

  if (!context) {
    throw new Error('useSqlWorkspace must be used within SqlWorkspaceProvider');
  }

  return context;
}
