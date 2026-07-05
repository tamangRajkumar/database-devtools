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
  fetchDeviceExportDatabase,
  fetchDeviceExportMeta,
  fetchDeviceExports,
  fetchSnapshot,
  formatRefreshErrorMessage,
  formatSnapshotReceivedMessage,
  resolveDeviceLabel,
  resolveDeviceDisplayName,
  resolveLiveSwitchTarget,
  resolvePreferredDeviceId,
  resolveSnapshotDownloadUrl,
  type ConnectionState,
  type DevToolsClient,
  type DeviceExportMeta,
  type ListedDeviceExport,
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
import { resolveBrowserApiOptions, resolveBrowserHubWsUrl } from '../lib/browserHub';
import { validateReadOnlySql } from '../lib/sqlSafety';
import { useToast } from './ToastContext';

export type UiRefreshState = 'idle' | 'refreshing' | 'ready' | 'error';

export type DatabaseSource = 'export' | 'live' | null;

export type SnapshotMeta = {
  deviceId: string;
  size: number;
  exportedAt: number;
  kind: string;
  mimeType: string;
  databaseName?: string;
  relativePath?: string;
};

type DevToolsContextValue = {
  connectionState: ConnectionState;
  deviceStatus: DeviceStatusPayload | null;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  selectedDevice: MobileDeviceInfo | null;
  deviceExports: ListedDeviceExport[];
  lastUpdatedAt: number | null;
  refreshState: UiRefreshState;
  syncState: RefreshState | null;
  snapshotMeta: SnapshotMeta | null;
  lastSnapshotAt: number | null;
  refreshError: string | null;
  refresh: () => void;
  databaseSource: DatabaseSource;
  hasDatabase: boolean;
  isOfflineDatabase: boolean;
  isDeviceLive: boolean;
  liveMobileCount: number;
  hasLiveMobileAvailable: boolean;
  liveSwitchTargetId: string | null;
  switchToConnectedDevice: () => void;
  deviceDisplayName: string;
  canRefreshFromDevice: boolean;
  databaseSessionId: string;
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

function buildOfflineDevice(
  deviceId: string,
  exportEntry: ListedDeviceExport,
): MobileDeviceInfo {
  return {
    deviceId,
    connectionId: 'offline',
    connectedAt: exportEntry.updatedAt,
    metadata: {
      appName: exportEntry.databaseName ?? exportEntry.label,
      platform: 'offline',
    },
  };
}

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusPayload | null>(null);
  const [deviceExports, setDeviceExports] = useState<ListedDeviceExport[]>([]);
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
  const [databaseSource, setDatabaseSource] = useState<DatabaseSource>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>('idle');

  const clientRef = useRef<DevToolsClient | null>(null);
  const activeRefreshDeviceIdRef = useRef<string | null>(null);
  const exportLoadInFlightRef = useRef(false);
  const selectedDeviceIdRef = useRef<string | null>(null);
  const deviceStatusRef = useRef<DeviceStatusPayload | null>(null);
  const inspectorRef = useRef<DatabaseInspector | null>(null);
  const loadedDeviceIdRef = useRef<string | null>(null);

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
    setDatabaseSource(null);
    loadedDeviceIdRef.current = null;
  }, []);

  const openSnapshot = useCallback(async (bytes: ArrayBuffer, kind: string, mimeType: string) => {
    const inspector = await createInspectorForSnapshot({
      kind,
      mimeType,
      bytes,
    });

    inspectorRef.current?.close();
    inspectorRef.current = inspector;
    setTables(inspector.listTables());
    setSchema(inspector.getSchema());
    setDatabaseLoaded(true);
  }, []);

  const applyDeviceExport = useCallback(
    async (
      deviceId: string,
      meta: DeviceExportMeta,
      bytes: ArrayBuffer,
      options?: { silent?: boolean },
    ) => {
      await openSnapshot(bytes, meta.kind ?? 'sqlite', meta.mimeType ?? 'application/x-sqlite3');

      setSnapshotMeta({
        deviceId,
        size: meta.size ?? bytes.byteLength,
        exportedAt: meta.updatedAt ?? Date.now(),
        kind: meta.kind ?? 'sqlite',
        mimeType: meta.mimeType ?? 'application/x-sqlite3',
        databaseName: meta.databaseName,
        relativePath: meta.relativePath,
      });
      setDatabaseSource('export');
      loadedDeviceIdRef.current = deviceId;
      setLastSnapshotAt(meta.updatedAt ?? Date.now());
      setRefreshState('ready');
      setRefreshError(null);
      setQueryError(null);

      if (!options?.silent) {
        const deviceLabel = resolveDeviceLabel(deviceId, deviceStatusRef.current, {
          databaseName: meta.databaseName,
        });
        showToast({
          title: 'Device export loaded',
          message: formatSnapshotReceivedMessage(
            deviceLabel,
            meta.databaseName ?? meta.kind ?? 'sqlite',
          ),
          variant: 'success',
        });
      }
    },
    [openSnapshot, showToast],
  );

  const loadDeviceExport = useCallback(
    async (deviceId: string, options?: { silent?: boolean }): Promise<boolean> => {
      const client = clientRef.current;

      if (!client || connectionState !== 'connected') {
        return false;
      }

      if (exportLoadInFlightRef.current) {
        return false;
      }

      exportLoadInFlightRef.current = true;

      const apiOptions = resolveBrowserApiOptions();

      try {
        const meta = await fetchDeviceExportMeta(client.getServerUrl(), deviceId, apiOptions);

        if (!meta.exists) {
          return false;
        }

        const bytes = await fetchDeviceExportDatabase(client.getServerUrl(), deviceId, apiOptions);
        await applyDeviceExport(deviceId, meta, bytes, options);
        return true;
      } catch {
        return false;
      } finally {
        exportLoadInFlightRef.current = false;
      }
    },
    [applyDeviceExport, connectionState],
  );

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
      ...resolveBrowserApiOptions(),
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
    setDatabaseSource('live');
    loadedDeviceIdRef.current = message.deviceId;
    setLastSnapshotAt(message.exportedAt);
    setRefreshState('ready');
    setSyncState('ready');
    setRefreshError(null);
    setQueryError(null);
    activeRefreshDeviceIdRef.current = null;

    const databaseName = message.databaseName ?? message.kind;
    const deviceLabel = resolveDeviceLabel(message.deviceId, deviceStatusRef.current, {
      databaseName,
    });
    const initiator = pushedFromDevice ? 'mobile' : 'browser';

    showToast({
      title: initiator === 'mobile' ? 'New database received' : 'Database refreshed',
      message: formatSnapshotReceivedMessage(deviceLabel, databaseName),
      variant: 'success',
    });

    void fetchDeviceExports(client.getServerUrl(), resolveBrowserApiOptions())
      .then(setDeviceExports)
      .catch(() => undefined);
  }, [openSnapshot, showToast]);

  useEffect(() => {
    const client = createDevToolsClient({
      role: DevToolsRole.BROWSER,
      serverUrl: resolveBrowserHubWsUrl(),
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
        const currentSelectedDeviceId = selectedDeviceIdRef.current;

        if (activeRefreshDeviceId && message.deviceId !== activeRefreshDeviceId) {
          return;
        }

        if (!activeRefreshDeviceId && message.deviceId !== currentSelectedDeviceId) {
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
    if (connectionState !== 'connected') {
      setDeviceExports([]);
      return;
    }

    const client = clientRef.current;

    if (!client) {
      return;
    }

    void fetchDeviceExports(client.getServerUrl(), resolveBrowserApiOptions())
      .then(setDeviceExports)
      .catch(() => setDeviceExports([]));
  }, [connectionState]);

  useEffect(() => {
    const mobiles = deviceStatus?.mobiles ?? [];
    const exports = deviceExports
      .filter((entry): entry is typeof entry & { deviceId: string } => Boolean(entry.deviceId))
      .map((entry) => ({
        deviceId: entry.deviceId,
        bundleId: entry.bundleId,
      }));

    const nextDeviceId = resolvePreferredDeviceId({
      selectedDeviceId,
      mobiles,
      exports,
    });

    if (nextDeviceId !== selectedDeviceId) {
      setSelectedDeviceId(nextDeviceId);
    }
  }, [deviceStatus, deviceExports, selectedDeviceId]);

  useEffect(() => {
    if (connectionState !== 'connected' || !selectedDeviceId) {
      return;
    }

    if (databaseLoaded && loadedDeviceIdRef.current === selectedDeviceId) {
      return;
    }

    void loadDeviceExport(selectedDeviceId, { silent: true });
  }, [connectionState, selectedDeviceId, databaseLoaded, loadDeviceExport]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) {
      return null;
    }

    const liveDevice = deviceStatus?.mobiles.find((device) => device.deviceId === selectedDeviceId);

    if (liveDevice) {
      return liveDevice;
    }

    const exportEntry = deviceExports.find((entry) => entry.deviceId === selectedDeviceId);

    if (exportEntry) {
      return buildOfflineDevice(selectedDeviceId, exportEntry);
    }

    return null;
  }, [deviceStatus, deviceExports, selectedDeviceId]);

  const isDeviceLive = useMemo(() => {
    if (!selectedDeviceId) {
      return false;
    }

    return deviceStatus?.mobiles.some((device) => device.deviceId === selectedDeviceId) ?? false;
  }, [deviceStatus, selectedDeviceId]);

  const liveMobileCount = deviceStatus?.mobileCount ?? 0;

  const hasLiveMobileAvailable = useMemo(() => {
    return liveMobileCount > 0 && !isDeviceLive;
  }, [liveMobileCount, isDeviceLive]);

  const liveSwitchTargetId = useMemo(() => {
    return resolveLiveSwitchTarget({
      selectedDeviceId,
      mobiles: deviceStatus?.mobiles ?? [],
      exports: deviceExports
        .filter((entry): entry is typeof entry & { deviceId: string } => Boolean(entry.deviceId))
        .map((entry) => ({
          deviceId: entry.deviceId,
          bundleId: entry.bundleId,
        })),
    });
  }, [deviceStatus, deviceExports, selectedDeviceId]);

  const switchToConnectedDevice = useCallback(() => {
    if (liveSwitchTargetId) {
      setSelectedDeviceId(liveSwitchTargetId);
    }
  }, [liveSwitchTargetId]);

  const isOfflineDatabase = useMemo(() => {
    return Boolean(databaseLoaded && !isDeviceLive);
  }, [databaseLoaded, isDeviceLive]);

  const deviceDisplayName = useMemo(() => {
    if (!selectedDeviceId) {
      return 'No device';
    }

    if (selectedDevice?.metadata?.appName) {
      return selectedDevice.metadata.appName;
    }

    return resolveDeviceDisplayName(selectedDeviceId, deviceStatus, {
      databaseName: snapshotMeta?.databaseName,
      label: deviceExports.find((entry) => entry.deviceId === selectedDeviceId)?.label,
    });
  }, [deviceExports, deviceStatus, selectedDevice, selectedDeviceId, snapshotMeta?.databaseName]);

  const canRefreshFromDevice = useMemo(() => {
    return connectionState === 'connected' && isDeviceLive;
  }, [connectionState, isDeviceLive]);

  const databaseSessionId = selectedDeviceId ?? 'offline';

  const refresh = useCallback(() => {
    if (!selectedDeviceId || refreshState === 'refreshing') {
      return;
    }

    if (!canRefreshFromDevice) {
      setRefreshState('error');
      setRefreshError('Connect the device to refresh live data');
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
  }, [selectedDeviceId, refreshState, canRefreshFromDevice]);

  const executeQuery = useCallback((sql: string): QueryResult => {
    const inspector = inspectorRef.current;

    if (!inspector) {
      throw new Error('No database loaded. Select a device with an export or refresh from a connected device.');
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
      throw new Error('No database loaded. Select a device with an export or refresh from a connected device.');
    }

    return inspector.fetchTablePage(request);
  }, []);

  const clearQueryError = useCallback(() => {
    setQueryError(null);
  }, []);

  const beginWriteTransaction = useCallback(async () => {
    if (!selectedDeviceId || isOfflineDatabase) {
      throw new Error('No live device selected');
    }

    const client = clientRef.current;

    if (!client) {
      throw new Error('Not connected to the DevTools hub');
    }

    await client.beginTransaction(selectedDeviceId);
  }, [selectedDeviceId, isOfflineDatabase]);

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
      deviceExports,
      lastUpdatedAt,
      refreshState,
      syncState,
      snapshotMeta,
      lastSnapshotAt,
      refreshError,
      refresh,
      databaseSource,
      hasDatabase: databaseLoaded,
      isOfflineDatabase,
      isDeviceLive,
      liveMobileCount,
      hasLiveMobileAvailable,
      liveSwitchTargetId,
      switchToConnectedDevice,
      deviceDisplayName,
      canRefreshFromDevice,
      databaseSessionId,
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
      deviceExports,
      lastUpdatedAt,
      refreshState,
      syncState,
      snapshotMeta,
      lastSnapshotAt,
      refreshError,
      refresh,
      databaseSource,
      databaseLoaded,
      isOfflineDatabase,
      isDeviceLive,
      liveMobileCount,
      hasLiveMobileAvailable,
      liveSwitchTargetId,
      switchToConnectedDevice,
      deviceDisplayName,
      canRefreshFromDevice,
      databaseSessionId,
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
