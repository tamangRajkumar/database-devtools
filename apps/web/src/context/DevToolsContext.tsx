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
import {
  createDevToolsClient,
  fetchSnapshot,
  type ConnectionState,
  type DevToolsClient,
} from 'database-devtools/client';
import {
  DevToolsRole,
  type DatabaseReadyMessage,
  type DeviceStatusPayload,
  type MobileDeviceInfo,
  type SyncState,
} from 'database-devtools/protocol';
import type { QueryResult, SchemaTable, TableInfo, TablePageRequest, TablePageResult } from 'database-devtools';
import { isSqliteDatabase, SqliteSession } from '../lib/sqliteSession';
import { validateReadOnlySql } from '../lib/sqlSafety';

export type RefreshState = 'idle' | 'refreshing' | 'ready' | 'error';

export type SnapshotMeta = {
  syncId: string;
  deviceId: string;
  size: number;
  exportedAt: number;
  downloadUrl: string;
};

type DevToolsContextValue = {
  connectionState: ConnectionState;
  deviceStatus: DeviceStatusPayload | null;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  selectedDevice: MobileDeviceInfo | null;
  lastUpdatedAt: number | null;
  refreshState: RefreshState;
  syncState: SyncState | null;
  snapshotMeta: SnapshotMeta | null;
  lastSnapshotAt: number | null;
  refreshError: string | null;
  refresh: () => void;
  hasDatabase: boolean;
  tables: TableInfo[];
  schema: SchemaTable[];
  executeQuery: (sql: string) => QueryResult;
  fetchTablePage: (request: TablePageRequest) => TablePageResult;
  queryError: string | null;
  clearQueryError: () => void;
};

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusPayload | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [refreshState, setRefreshState] = useState<RefreshState>('idle');
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [snapshotMeta, setSnapshotMeta] = useState<SnapshotMeta | null>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<number | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [databaseLoaded, setDatabaseLoaded] = useState(false);

  const clientRef = useRef<DevToolsClient | null>(null);
  const activeSyncIdRef = useRef<string | null>(null);
  const sessionRef = useRef<SqliteSession | null>(null);

  const closeSession = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setTables([]);
    setSchema([]);
    setDatabaseLoaded(false);
  }, []);

  const openSnapshot = useCallback(async (bytes: ArrayBuffer) => {
    closeSession();

    if (!isSqliteDatabase(bytes)) {
      throw new Error('Snapshot is not a valid SQLite database file');
    }

    const session = await SqliteSession.open(bytes);
    sessionRef.current = session;
    setTables(session.listTables());
    setSchema(session.getSchema());
    setDatabaseLoaded(true);
  }, [closeSession]);

  const handleDatabaseReady = useCallback(async (message: DatabaseReadyMessage) => {
    if (activeSyncIdRef.current && message.syncId !== activeSyncIdRef.current) {
      return;
    }

    let bytes: ArrayBuffer;

    try {
      bytes = await fetchSnapshot(message.downloadUrl);
    } catch {
      setRefreshState('error');
      setRefreshError('Snapshot uploaded but download failed');
      activeSyncIdRef.current = null;
      return;
    }

    try {
      await openSnapshot(bytes);
    } catch (error) {
      setRefreshState('error');
      setRefreshError(
        error instanceof Error ? error.message : 'Failed to open SQLite snapshot',
      );
      activeSyncIdRef.current = null;
      return;
    }

    setSnapshotMeta({
      syncId: message.syncId,
      deviceId: message.deviceId,
      size: message.size,
      exportedAt: message.exportedAt,
      downloadUrl: message.downloadUrl,
    });
    setLastSnapshotAt(message.exportedAt);
    setRefreshState('ready');
    setSyncState('ready');
    setRefreshError(null);
    setQueryError(null);
    activeSyncIdRef.current = null;
  }, [openSnapshot]);

  useEffect(() => {
    const client = createDevToolsClient({
      role: DevToolsRole.BROWSER,
      onConnectionStateChange: setConnectionState,
      onDeviceStatus: (status) => {
        setDeviceStatus(status);
        setLastUpdatedAt(Date.now());
      },
      onSyncStatus: (message) => {
        if (activeSyncIdRef.current && message.syncId !== activeSyncIdRef.current) {
          return;
        }

        setSyncState(message.state);
      },
      onDatabaseReady: handleDatabaseReady,
      onSyncError: (message) => {
        if (activeSyncIdRef.current && message.syncId !== activeSyncIdRef.current) {
          return;
        }

        setRefreshState('error');
        setRefreshError(message.message);
        setSyncState(message.code === 'TIMEOUT' ? 'timeout' : 'failed');
        activeSyncIdRef.current = null;
      },
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
      closeSession();
    };
  }, [handleDatabaseReady, closeSession]);

  useEffect(() => {
    const mobiles = deviceStatus?.mobiles ?? [];

    if (mobiles.length === 0) {
      setSelectedDeviceId(null);
      closeSession();
      setSnapshotMeta(null);
      setRefreshState('idle');
      return;
    }

    const stillConnected = mobiles.some((device) => device.deviceId === selectedDeviceId);

    if (!selectedDeviceId || !stillConnected) {
      setSelectedDeviceId(mobiles[0]?.deviceId ?? null);
    }
  }, [deviceStatus, selectedDeviceId, closeSession]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId || !deviceStatus) {
      return null;
    }

    return deviceStatus.mobiles.find((device) => device.deviceId === selectedDeviceId) ?? null;
  }, [deviceStatus, selectedDeviceId]);

  const refresh = useCallback(() => {
    if (!selectedDeviceId || refreshState === 'refreshing') {
      return;
    }

    if (connectionState !== 'connected') {
      setRefreshState('error');
      setRefreshError('Not connected to the DevTools hub');
      return;
    }

    const client = clientRef.current;

    if (!client) {
      return;
    }

    const syncId = client.requestRefresh(selectedDeviceId);
    activeSyncIdRef.current = syncId;
    setRefreshState('refreshing');
    setSyncState('requested');
    setRefreshError(null);
    setQueryError(null);
  }, [selectedDeviceId, refreshState, connectionState]);

  const executeQuery = useCallback((sql: string): QueryResult => {
    const session = sessionRef.current;

    if (!session) {
      throw new Error('No database loaded. Click Refresh to sync from the device.');
    }

    try {
      validateReadOnlySql(sql);
      setQueryError(null);
      return session.executeQuery(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query failed';
      setQueryError(message);
      throw error;
    }
  }, []);

  const fetchTablePage = useCallback((request: TablePageRequest): TablePageResult => {
    const session = sessionRef.current;

    if (!session) {
      throw new Error('No database loaded. Click Refresh to sync from the device.');
    }

    return session.fetchTablePage(request);
  }, []);

  const clearQueryError = useCallback(() => {
    setQueryError(null);
  }, []);

  const value = useMemo(
    () => ({
      connectionState,
      deviceStatus,
      selectedDeviceId,
      setSelectedDeviceId,
      selectedDevice,
      lastUpdatedAt,
      refreshState,
      syncState,
      snapshotMeta,
      lastSnapshotAt,
      refreshError,
      refresh,
      hasDatabase: databaseLoaded,
      tables,
      schema,
      executeQuery,
      fetchTablePage,
      queryError,
      clearQueryError,
    }),
    [
      connectionState,
      deviceStatus,
      selectedDeviceId,
      selectedDevice,
      lastUpdatedAt,
      refreshState,
      syncState,
      snapshotMeta,
      lastSnapshotAt,
      refreshError,
      refresh,
      databaseLoaded,
      tables,
      schema,
      executeQuery,
      fetchTablePage,
      queryError,
      clearQueryError,
    ],
  );

  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
}

export function useDevTools(): DevToolsContextValue {
  const context = useContext(DevToolsContext);

  if (!context) {
    throw new Error('useDevTools must be used within DevToolsProvider');
  }

  return context;
}

