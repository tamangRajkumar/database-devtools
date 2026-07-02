import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { resolveAdapter } from '../adapter/resolveAdapter';
import { isWritableDatabaseAdapter } from '../types/adapter';
import {
  createDevToolsClient,
  type ConnectionState,
} from '../client/createDevToolsClient';
import { formatRefreshErrorMessage } from '../client/formatSyncError';
import { handleDeviceSnapshotUpload } from '../client/handleDeviceSnapshot';
import {
  handleBeginTransaction,
  handleCommitTransaction,
  handleExecuteWrite,
  handleRollbackTransaction,
} from '../client/handleWriteOperations';
import { DevToolsContext, type ExportState } from '../hooks/useDevTools';
import type { DatabaseAdapter } from '../types/adapter';
import type { DatabaseKind } from '../types/kind';
import { DevToolsRole, REFRESH_TIMEOUT_MS } from '../types/protocol';
import { getConnectionHint } from '../utils/resolveDevToolsHost';
import { resolveDeviceMetadata } from '../utils/resolveDeviceMetadata';
import { normalizeServerUrl, resolveServerUrl } from '../utils/resolveServerUrl';

export type DevToolsProviderProps = {
  children: ReactNode;
  database?: unknown;
  type?: DatabaseKind;
  adapter?: DatabaseAdapter;
  serverUrl?: string;
  onConnectionStateChange?: (state: ConnectionState) => void;
};

type ExportWaiters = {
  resolve: () => void;
  reject: (error: Error) => void;
};

export function DevToolsProvider({
  children,
  database,
  type,
  adapter: explicitAdapter,
  serverUrl: initialServerUrl,
  onConnectionStateChange,
}: DevToolsProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState(() => resolveServerUrl(initialServerUrl));
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [resolvedAdapter, setResolvedAdapter] = useState<DatabaseAdapter | undefined>(explicitAdapter);
  const [adapterError, setAdapterError] = useState<string | null>(null);
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportError, setExportError] = useState<string | null>(null);

  const metadata = useMemo(() => resolveDeviceMetadata(), []);
  const clientRef = useRef<ReturnType<typeof createDevToolsClient> | null>(null);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  const databaseRef = useRef(resolvedAdapter);
  const rollbackOpenTransactionRef = useRef<(() => Promise<void>) | null>(null);
  const exportWaitersRef = useRef<ExportWaiters | null>(null);
  const exportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExportWaiters = useCallback(() => {
    if (exportTimeoutRef.current) {
      clearTimeout(exportTimeoutRef.current);
      exportTimeoutRef.current = null;
    }

    exportWaitersRef.current = null;
  }, []);

  const resetExportSuccessLater = useCallback(() => {
    if (exportSuccessTimeoutRef.current) {
      clearTimeout(exportSuccessTimeoutRef.current);
    }

    exportSuccessTimeoutRef.current = setTimeout(() => {
      setExportState((current) => (current === 'success' ? 'idle' : current));
      exportSuccessTimeoutRef.current = null;
    }, 3000);
  }, []);

  const finishExportSuccess = useCallback(() => {
    clearExportWaiters();
    setExportState('success');
    setExportError(null);
    resetExportSuccessLater();
  }, [clearExportWaiters, resetExportSuccessLater]);

  const finishExportFailure = useCallback(
    (message: string) => {
      clearExportWaiters();
      setExportState('error');
      setExportError(message);
    },
    [clearExportWaiters],
  );

  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange;
  }, [onConnectionStateChange]);

  useEffect(() => {
    let cancelled = false;

    async function resolveDatabaseAdapter(): Promise<void> {
      if (explicitAdapter) {
        setResolvedAdapter(explicitAdapter);
        setAdapterError(null);
        return;
      }

      if (!database) {
        setResolvedAdapter(undefined);
        setAdapterError(null);
        return;
      }

      try {
        const nextAdapter = await resolveAdapter(database, { type });
        if (!cancelled) {
          setResolvedAdapter(nextAdapter);
          setAdapterError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setResolvedAdapter(undefined);
          setAdapterError(error instanceof Error ? error.message : 'Failed to resolve database adapter');
        }
      }
    }

    void resolveDatabaseAdapter();

    return () => {
      cancelled = true;
    };
  }, [database, type, explicitAdapter]);

  useEffect(() => {
    databaseRef.current = resolvedAdapter;
  }, [resolvedAdapter]);

  useEffect(() => {
    rollbackOpenTransactionRef.current = async () => {
      const adapter = databaseRef.current;

      if (!isWritableDatabaseAdapter(adapter)) {
        return;
      }

      try {
        await adapter.rollbackTransaction();
      } catch {
        // Best-effort cleanup when the provider unmounts or reconnects.
      }
    };
  }, [resolvedAdapter]);

  useEffect(() => {
    const client = createDevToolsClient({
      serverUrl,
      role: DevToolsRole.MOBILE,
      metadata,
      onConnect: () => {
        setConnectionError(null);
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        onConnectionStateChangeRef.current?.(state);
      },
      onError: (error) => {
        setConnectionError(error.message);
      },
      onSnapshotUploadRequested: async (message) => {
        try {
          await handleDeviceSnapshotUpload(databaseRef.current, message, {
            hubServerUrl: serverUrl,
            deviceId: clientRef.current?.getDeviceId(),
          });

          if (exportWaitersRef.current) {
            exportWaitersRef.current.resolve();
            clearExportWaiters();
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Database export or upload failed';

          if (exportWaitersRef.current) {
            exportWaitersRef.current.reject(new Error(errorMessage));
            clearExportWaiters();
            return;
          }

          console.error('[database-devtools] Snapshot export or upload failed:', errorMessage);
        }
      },
      onExportSnapshotError: (message) => {
        const errorMessage = formatRefreshErrorMessage(message.code, message.message);

        if (exportWaitersRef.current) {
          exportWaitersRef.current.reject(new Error(errorMessage));
          clearExportWaiters();
        }
      },
      onBeginTransaction: async (message) => {
        const client = clientRef.current;

        if (!client) {
          return;
        }

        await handleBeginTransaction(databaseRef.current, message, (ack) => {
          client.sendTransactionAck(ack);
        });
      },
      onCommitTransaction: async (message) => {
        const client = clientRef.current;

        if (!client) {
          return;
        }

        await handleCommitTransaction(databaseRef.current, message, (ack) => {
          client.sendTransactionAck(ack);
        });
      },
      onRollbackTransaction: async (message) => {
        const client = clientRef.current;

        if (!client) {
          return;
        }

        await handleRollbackTransaction(databaseRef.current, message, (ack) => {
          client.sendTransactionAck(ack);
        });
      },
      onExecuteWrite: async (message) => {
        const client = clientRef.current;

        if (!client) {
          return;
        }

        await handleExecuteWrite(databaseRef.current, message, (ack) => {
          client.sendWriteAck(ack);
        });
      },
    });

    clientRef.current = client;
    setDeviceId(client.getDeviceId());
    client.connect();

    return () => {
      void rollbackOpenTransactionRef.current?.();
      client.disconnect();
      clientRef.current = null;
      clearExportWaiters();

      if (exportSuccessTimeoutRef.current) {
        clearTimeout(exportSuccessTimeoutRef.current);
        exportSuccessTimeoutRef.current = null;
      }
    };
  }, [serverUrl, metadata, clearExportWaiters]);

  const openSettings = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsVisible(false);
  }, []);

  const reconnect = useCallback((url: string) => {
    setConnectionError(null);
    setServerUrl(normalizeServerUrl(url));
  }, []);

  const exportDatabase = useCallback(async () => {
    if (exportState === 'exporting') {
      return;
    }

    if (connectionState !== 'connected') {
      finishExportFailure('Connect to the DevTools hub first');
      return;
    }

    if (!resolvedAdapter) {
      finishExportFailure(adapterError ?? 'No database adapter connected');
      return;
    }

    const client = clientRef.current;

    if (!client) {
      finishExportFailure('DevTools client is not ready');
      return;
    }

    setExportState('exporting');
    setExportError(null);

    try {
      await new Promise<void>((resolve, reject) => {
        exportWaitersRef.current = { resolve, reject };
        exportTimeoutRef.current = setTimeout(() => {
          exportWaitersRef.current?.reject(new Error('Export timed out'));
          clearExportWaiters();
        }, REFRESH_TIMEOUT_MS);

        client.requestExportSnapshot();
      });

      finishExportSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      finishExportFailure(message);
    }
  }, [
    adapterError,
    connectionState,
    exportState,
    finishExportFailure,
    resolvedAdapter,
  ]);

  const connectionHint = useMemo(() => getConnectionHint(serverUrl), [serverUrl]);

  const value = useMemo(
    () => ({
      connectionState,
      connectionError,
      connectionHint,
      deviceId,
      serverUrl,
      metadata,
      database: resolvedAdapter,
      adapterError,
      settingsVisible,
      openSettings,
      closeSettings,
      reconnect,
      exportState,
      exportError,
      exportDatabase,
    }),
    [
      connectionState,
      connectionError,
      connectionHint,
      deviceId,
      serverUrl,
      metadata,
      resolvedAdapter,
      adapterError,
      settingsVisible,
      openSettings,
      closeSettings,
      reconnect,
      exportState,
      exportError,
      exportDatabase,
    ],
  );

  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
}
