import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { QueryResult } from 'database-devtools';
import { formatSql } from '../lib/formatSql';
import {
  copyTextToClipboard,
  downloadBlob,
  formatResultsAsCsv,
  formatResultsAsExcelXml,
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
import {
  createQueryTab,
  loadQueryTabs,
  saveQueryTabs,
  type StoredQueryTab,
} from '../lib/queryTabsStorage';
import type { ExecutionMeta, QueryTab } from '../types/workspace';
import { type FavoriteQuery, type QueryHistoryEntry } from '../types/sqlWorkspace';
import { useDevTools } from './DevToolsContext';
import { useExplorer } from './ExplorerContext';
import { useOnboarding } from './OnboardingContext';
import { useToast } from './ToastContext';
import { useWorkspace } from './WorkspaceContext';

type SqlWorkspaceContextValue = {
  tabs: QueryTab[];
  activeTabId: string;
  activeTab: QueryTab;
  sql: string;
  setSql: (sql: string) => void;
  createTab: () => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  result: QueryResult | null;
  error: string | null;
  running: boolean;
  executionMeta: ExecutionMeta | null;
  lastMessage: string | null;
  runQuery: (sqlOverride?: string, options?: { keepTableSelection?: boolean }) => void;
  formatActiveSql: () => void;
  clearActiveSql: () => void;
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
  exportExcel: () => void;
  saveDialogOpen: boolean;
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  copyStatus: string | null;
  insertSql: (sql: string) => void;
  insertSqlAndRun: (sql: string) => void;
  renameTab: (id: string, title: string) => void;
};

const SqlWorkspaceContext = createContext<SqlWorkspaceContextValue | null>(null);

function toQueryTab(stored: StoredQueryTab, dirty = false): QueryTab {
  return { ...stored, dirty };
}

function markDirty(tab: QueryTab, sql: string, originalSql: string): QueryTab {
  return { ...tab, sql, dirty: sql !== originalSql };
}

export function SqlWorkspaceProvider({ children }: { children: ReactNode }) {
  const { selectedDeviceId, hasDatabase, executeQuery, clearQueryError } = useDevTools();
  const { clearTableSelection } = useExplorer();
  const { setBottomPanelTab, markOutputUnread } = useWorkspace();
  const { showToast } = useToast();
  const { markQueryRun } = useOnboarding();

  const initialTabsRef = useRef(loadQueryTabs(selectedDeviceId));
  const [tabs, setTabs] = useState<QueryTab[]>(() =>
    initialTabsRef.current.tabs.map((tab) => toQueryTab(tab)),
  );
  const [activeTabId, setActiveTabId] = useState(initialTabsRef.current.activeTabId);
  const [originalSqlByTab, setOriginalSqlByTab] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialTabsRef.current.tabs.forEach((tab) => {
      map[tab.id] = tab.sql;
    });
    return map;
  });

  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [executionMeta, setExecutionMeta] = useState<ExecutionMeta | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteQuery[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]!,
    [tabs, activeTabId],
  );

  const sql = activeTab?.sql ?? '';

  useEffect(() => {
    const loaded = loadQueryTabs(selectedDeviceId);
    setTabs(loaded.tabs.map((tab) => toQueryTab(tab)));
    setActiveTabId(loaded.activeTabId);
    const map: Record<string, string> = {};
    loaded.tabs.forEach((tab) => {
      map[tab.id] = tab.sql;
    });
    setOriginalSqlByTab(map);
    setResult(null);
    setError(null);
    setExecutionMeta(null);
    setLastMessage(null);
  }, [selectedDeviceId]);

  useEffect(() => {
    if (tabs.length === 0) {
      return;
    }

    saveQueryTabs(
      selectedDeviceId,
      tabs.map(({ id, title, sql: tabSql }) => ({ id, title, sql: tabSql })),
      activeTabId,
    );
  }, [tabs, activeTabId, selectedDeviceId]);

  useEffect(() => {
    setHistory(loadHistory(selectedDeviceId));
    setFavorites(loadFavorites(selectedDeviceId));
  }, [selectedDeviceId]);

  const updateActiveTabSql = useCallback(
    (nextSql: string) => {
      setTabs((current) =>
        current.map((tab) =>
          tab.id === activeTabId
            ? markDirty(tab, nextSql, originalSqlByTab[tab.id] ?? tab.sql)
            : tab,
        ),
      );
    },
    [activeTabId, originalSqlByTab],
  );

  const setSql = updateActiveTabSql;

  const createTab = useCallback(() => {
    const nextIndex = tabs.length + 1;
    const stored = createQueryTab(nextIndex);
    const tab = toQueryTab(stored);
    setTabs((current) => [...current, tab]);
    setOriginalSqlByTab((current) => ({ ...current, [tab.id]: tab.sql }));
    setActiveTabId(tab.id);
  }, [tabs.length]);

  const closeTab = useCallback(
    (id: string) => {
      if (tabs.length === 1) {
        return;
      }

      const tab = tabs.find((item) => item.id === id);

      if (tab?.dirty && !window.confirm(`Close ${tab.title} without saving changes?`)) {
        return;
      }

      setTabs((current) => {
        const next = current.filter((item) => item.id !== id);

        if (activeTabId === id) {
          setActiveTabId(next[0]!.id);
        }

        return next;
      });

      setOriginalSqlByTab((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    [tabs, activeTabId],
  );

  const renameTab = useCallback((id: string, title: string) => {
    const trimmed = title.trim();

    if (!trimmed) {
      return;
    }

    setTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, title: trimmed } : tab)),
    );
  }, []);

  const switchTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const runQuery = useCallback(
    (sqlOverride?: string, options?: { keepTableSelection?: boolean }) => {
      if (!hasDatabase || running) {
        return;
      }

      const queryText = (sqlOverride ?? sql).trim();

      if (!queryText) {
        setLastMessage('Nothing to run — enter a SQL statement first.');
        setBottomPanelTab('output');
        markOutputUnread();
        return;
      }

      if (!options?.keepTableSelection) {
        clearTableSelection();
      }

      setRunning(true);
      setError(null);
      setLastMessage(null);
      clearQueryError();

      try {
        const queryResult = executeQuery(queryText);
        setResult(queryResult);
        setExecutionMeta({
          durationMs: queryResult.durationMs,
          rowCount: queryResult.rowCount,
          ranAt: Date.now(),
        });
        setLastMessage(
          `Query executed successfully. ${queryResult.rowCount} row${queryResult.rowCount === 1 ? '' : 's'} returned in ${queryResult.durationMs.toFixed(1)} ms.`,
        );
        const entry = createHistoryEntry(queryText, queryResult);
        setHistory(appendHistory(selectedDeviceId, entry));
        setBottomPanelTab('results');
        markQueryRun();
      } catch (runError) {
        const message = runError instanceof Error ? runError.message : 'Query failed';
        setError(message);
        setResult(null);
        setExecutionMeta(null);
        setLastMessage(message);
        const entry = createHistoryEntry(queryText, undefined, message);
        setHistory(appendHistory(selectedDeviceId, entry));
        setBottomPanelTab('output');
        markOutputUnread();
        showToast({
          title: 'Query failed',
          message,
          variant: 'error',
        });
      } finally {
        setRunning(false);
      }
    },
    [
      hasDatabase,
      running,
      sql,
      executeQuery,
      clearQueryError,
      selectedDeviceId,
      setBottomPanelTab,
      markOutputUnread,
      markQueryRun,
      showToast,
      clearTableSelection,
    ],
  );

  const formatActiveSql = useCallback(() => {
    const formatted = formatSql(sql);
    updateActiveTabSql(formatted);
  }, [sql, updateActiveTabSql]);

  const clearActiveSql = useCallback(() => {
    updateActiveTabSql('');
  }, [updateActiveTabSql]);

  const insertSql = useCallback(
    (nextSql: string) => {
      updateActiveTabSql(nextSql);
      setResult(null);
      setError(null);
      setExecutionMeta(null);
      setLastMessage(null);
    },
    [updateActiveTabSql],
  );

  const insertSqlAndRun = useCallback(
    (nextSql: string) => {
      updateActiveTabSql(nextSql);
      setResult(null);
      setError(null);
      setExecutionMeta(null);
      setLastMessage(null);

      window.setTimeout(() => {
        runQuery(nextSql, { keepTableSelection: true });
      }, 0);
    },
    [updateActiveTabSql, runQuery],
  );

  const loadFromHistory = useCallback(
    (id: string) => {
      const entry = history.find((item) => item.id === id);

      if (entry) {
        insertSql(entry.sql);
        setBottomPanelTab('results');
      }
    },
    [history, insertSql, setBottomPanelTab],
  );

  const loadFavorite = useCallback(
    (id: string) => {
      const favorite = favorites.find((item) => item.id === id);

      if (favorite) {
        insertSql(favorite.sql);
      }
    },
    [favorites, insertSql],
  );

  const saveFavorite = useCallback(
    (name: string) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      setFavorites(addFavorite(selectedDeviceId, createFavorite(trimmed, sql)));
      setSaveDialogOpen(false);
      setBottomPanelTab('history');
    },
    [sql, selectedDeviceId, setBottomPanelTab],
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

  const exportExcel = useCallback(() => {
    if (!result || result.columns.length === 0) {
      return;
    }

    downloadBlob(
      'query-results.xls',
      formatResultsAsExcelXml(result),
      'application/vnd.ms-excel',
    );
  }, [result]);

  const value = useMemo(
    () => ({
      tabs,
      activeTabId,
      activeTab,
      sql,
      setSql,
      createTab,
      closeTab,
      switchTab,
      result,
      error,
      running,
      executionMeta,
      lastMessage,
      runQuery,
      formatActiveSql,
      clearActiveSql,
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
      exportExcel,
      saveDialogOpen,
      openSaveDialog: () => setSaveDialogOpen(true),
      closeSaveDialog: () => setSaveDialogOpen(false),
      copyStatus,
      insertSql,
      insertSqlAndRun,
      renameTab,
    }),
    [
      tabs,
      activeTabId,
      activeTab,
      sql,
      createTab,
      closeTab,
      switchTab,
      result,
      error,
      running,
      executionMeta,
      lastMessage,
      runQuery,
      formatActiveSql,
      clearActiveSql,
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
      exportExcel,
      saveDialogOpen,
      copyStatus,
      insertSql,
      insertSqlAndRun,
      renameTab,
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
