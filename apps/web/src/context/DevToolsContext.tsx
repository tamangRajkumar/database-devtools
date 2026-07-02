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
  formatRefreshErrorMessage,
  resolveSnapshotDownloadUrl,
  type ConnectionState,
  type DevToolsClient,
  type TransactionState,
} from 'database-devtools/client';
import { createInspectorForSnapshot, type DatabaseInspector } from 'database-devtools/inspector';
import {
  DevToolsRole,
  type DeviceStatusPayload,
  type MobileDeviceInfo,
  type RefreshState,
  type SnapshotReadyMessage,
} from 'database-devtools/protocol';
import type { QueryResult, SchemaTable, TableInfo, TablePageRequest, TablePageResult, WriteOperation } from 'database-devtools';
import { validateReadOnlySql } from '../lib/sqlSafety';
import {
  buildSnapshotLoadedToast,
} from 'database-devtools/client';
import { useToast } from './ToastContext';

export type UiRefreshState = 'idle' | 'refreshing' | 'ready' | 'error';

export type SnapshotMeta = {
  deviceId: string;
  size: number;
  exportedAt: number;
  kind: string;
  mimeType: string;
  databaseName?: string;
};

type DevToolsContextValue = {
  connectionState: ConnectionState;
  deviceStatus: DeviceStatusPayload | null;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  selectedDevice: MobileDeviceInfo | null;
  lastUpdatedAt: number | null;
  refreshState: UiRefreshState;
  syncState: RefreshState | null;
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
  transactionState: TransactionState;
  beginWriteTransaction: () => Promise<void>;
  commitWriteTransaction: () => Promise<void>;
  rollbackWriteTransaction: () => Promise<void>;
  executeWriteOperation: (operation: WriteOperation) => Promise<{ rowsAffected: number }>;
};

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusPayload | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [refreshState, setRefreshState] = useState<UiRefreshState>('idle');
  const [syncState, setSyncState] = useState<RefreshState | null>(null);
  const [snapshotMeta, setSnapshotMeta] = useState<SnapshotMeta | null>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<number | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [databaseLoaded, setDatabaseLoaded] = useState(false);
  const [transactionState, setTransactionState] = useState<TransactionState>('idle');

  const clientRef = useRef<DevToolsClient | null>(null);
  const activeRefreshDeviceIdRef = useRef<string | null>(null);
  const selectedDeviceIdRef = useRef<string | null>(null);
  const deviceStatusRef = useRef<DeviceStatusPayload | null>(null);
  const inspectorRef = useRef<DatabaseInspector | null>(null);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  useEffect(() => {
    deviceStatusRef.current = deviceStatus;
  }, [deviceStatus]);

  const closeSession = useCallback(() => {
    inspectorRef.current?.close();
    inspectorRef.current = null;
    setTables([]);
    setSchema([]);
    setDatabaseLoaded(false);
  }, []);

  const openSnapshot = useCallback(async (bytes: ArrayBuffer, kind: string, mimeType: string) => {
    closeSession();

    const inspector = await createInspectorForSnapshot({
      kind,
      mimeType,
      bytes,
    });

    inspectorRef.current = inspector;
    setTables(inspector.listTables());
    setSchema(inspector.getSchema());
    setDatabaseLoaded(true);
  }, [closeSession]);

  const handleSnapshotReady = useCallback(async (message: SnapshotReadyMessage) => {
    const activeRefreshDeviceId = activeRefreshDeviceIdRef.current;
    const selectedDeviceId = selectedDeviceIdRef.current;
    const targetDeviceId = activeRefreshDeviceId ?? selectedDeviceId;
    const pushedFromDevice = !activeRefreshDeviceId;

    if (!targetDeviceId || message.deviceId !== targetDeviceId) {
      return;
    }

    const client = clientRef.current;

    if (!client) {
      return;
    }

    const downloadUrl = resolveSnapshotDownloadUrl(client.getServerUrl(), message.deviceId, {
      useSameOriginApi: import.meta.env.DEV,
    });

    let bytes: ArrayBuffer;

    try {
      bytes = await fetchSnapshot(downloadUrl);
    } catch (error) {
      setRefreshState('error');
      setRefreshError(
        error instanceof Error ? error.message : 'Snapshot uploaded but download failed',
      );
      activeRefreshDeviceIdRef.current = null;
      return;
    }

    try {
      await openSnapshot(bytes, message.kind, message.mimeType);
    } catch (error) {
      setRefreshState('error');
      setRefreshError(
        error instanceof Error
          ? `Failed to open snapshot in browser: ${error.message}`
          : 'Failed to open snapshot in browser',
      );
      activeRefreshDeviceIdRef.current = null;
      return;
    }

    setSnapshotMeta({
      deviceId: message.deviceId,
      size: message.size,
      exportedAt: message.exportedAt,
      kind: message.kind,
      mimeType: message.mimeType,
      databaseName: message.databaseName,
    });
    setLastSnapshotAt(message.exportedAt);
    setRefreshState('ready');
    setSyncState('ready');
    setRefreshError(null);
    setQueryError(null);
    activeRefreshDeviceIdRef.current = null;

    const toast = buildSnapshotLoadedToast(
      pushedFromDevice ? 'mobile' : 'browser',
      message.deviceId,
      message.databaseName ?? message.kind,
      deviceStatusRef.current,
    );

    showToast({
      ...toast,
      variant: 'success',
    });
  }, [openSnapshot, showToast]);

  useEffect(() => {
    const client = createDevToolsClient({
      role: DevToolsRole.BROWSER,
      onConnectionStateChange: setConnectionState,
      onDeviceStatus: (status) => {
        setDeviceStatus(status);
        setLastUpdatedAt(Date.now());
      },
      onRefreshStatus: (message) => {
        if (activeRefreshDeviceIdRef.current && message.deviceId !== activeRefreshDeviceIdRef.current) {
          return;
        }

        setSyncState(message.state);
      },
      onSnapshotReady: handleSnapshotReady,
      onRefreshError: (message) => {
        const activeRefreshDeviceId = activeRefreshDeviceIdRef.current;
        const selectedDeviceId = selectedDeviceIdRef.current;

        if (
          activeRefreshDeviceId &&
          message.deviceId !== activeRefreshDeviceId
        ) {
          return;
        }

        if (
          !activeRefreshDeviceId &&
          message.deviceId !== selectedDeviceId
        ) {
          return;
        }

        setRefreshState('error');
        setRefreshError(formatRefreshErrorMessage(message.code, message.message));
        setSyncState(message.code === 'TIMEOUT' ? 'timeout' : 'failed');
        activeRefreshDeviceIdRef.current = null;
      },
      onTransactionStateChange: setTransactionState,
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
      closeSession();
    };
  }, [handleSnapshotReady, closeSession]);

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

    activeRefreshDeviceIdRef.current = selectedDeviceId;
    client.requestRefresh(selectedDeviceId);
    setRefreshState('refreshing');
    setSyncState('requested');
    setRefreshError(null);
    setQueryError(null);
  }, [selectedDeviceId, refreshState, connectionState]);

  const executeQuery = useCallback((sql: string): QueryResult => {
    const inspector = inspectorRef.current;

    if (!inspector) {
      throw new Error('No database loaded. Click Refresh to sync from the device.');
    }

    try {
      validateReadOnlySql(sql);
      setQueryError(null);
      return inspector.executeQuery(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query failed';
      setQueryError(message);
      throw error;
    }
  }, []);

  const fetchTablePage = useCallback((request: TablePageRequest): TablePageResult => {
    const inspector = inspectorRef.current;

    if (!inspector) {
      throw new Error('No database loaded. Click Refresh to sync from the device.');
    }

    return inspector.fetchTablePage(request);
  }, []);

  const clearQueryError = useCallback(() => {
    setQueryError(null);
  }, []);

  const beginWriteTransaction = useCallback(async () => {
    if (!selectedDeviceId) {
      throw new Error('No device selected');
    }

    const client = clientRef.current;

    if (!client) {
      throw new Error('Not connected to the DevTools hub');
    }

    await client.beginTransaction(selectedDeviceId);
  }, [selectedDeviceId]);

  const commitWriteTransaction = useCallback(async () => {
    const client = clientRef.current;

    if (!client) {
      throw new Error('Not connected to the DevTools hub');
    }

    await client.commitTransaction();
  }, []);

  const rollbackWriteTransaction = useCallback(async () => {
    const client = clientRef.current;

    if (!client) {
      throw new Error('Not connected to the DevTools hub');
    }

    await client.rollbackTransaction();
  }, []);

  const executeWriteOperation = useCallback(async (operation: WriteOperation) => {
    const client = clientRef.current;

    if (!client) {
      throw new Error('Not connected to the DevTools hub');
    }

    return client.executeWrite(operation);
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
      transactionState,
      beginWriteTransaction,
      commitWriteTransaction,
      rollbackWriteTransaction,
      executeWriteOperation,
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
      transactionState,
      beginWriteTransaction,
      commitWriteTransaction,
      rollbackWriteTransaction,
      executeWriteOperation,
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
