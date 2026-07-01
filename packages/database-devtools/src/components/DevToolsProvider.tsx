import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { resolveAdapter } from '../adapter/resolveAdapter';
import {
  createDevToolsClient,
  type ConnectionState,
} from '../client/createDevToolsClient';
import { handleSyncDatabase } from '../client/handleSyncDatabase';
import {
  handleBeginTransaction,
  handleCommitTransaction,
  handleExecuteWrite,
  handleRollbackTransaction,
} from '../client/handleWriteOperations';
import { DevToolsContext } from '../hooks/useDevTools';
import type { DatabaseAdapter } from '../types/adapter';
import type { DatabaseKind } from '../types/kind';
import { DevToolsRole } from '../types/protocol';
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

  const metadata = useMemo(() => resolveDeviceMetadata(), []);
  const clientRef = useRef<ReturnType<typeof createDevToolsClient> | null>(null);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  const databaseRef = useRef(resolvedAdapter);

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
      onSyncDatabase: async (message) => {
        try {
          await handleSyncDatabase(databaseRef.current, message);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Database export or upload failed';
          clientRef.current?.reportExportFailed(message.syncId, errorMessage);
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
      client.disconnect();
      clientRef.current = null;
    };
  }, [serverUrl, metadata]);

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
    ],
  );

  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
}
