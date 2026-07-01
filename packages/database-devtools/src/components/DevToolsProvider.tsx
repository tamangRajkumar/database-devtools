import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { DevToolsRole } from '../types/protocol';
import { resolveDeviceMetadata } from '../utils/resolveDeviceMetadata';
import { resolveServerUrl } from '../utils/resolveServerUrl';

export type DevToolsProviderProps = {
  children: ReactNode;
  database?: DatabaseAdapter;
  serverUrl?: string;
  onConnectionStateChange?: (state: ConnectionState) => void;
};

export function DevToolsProvider({
  children,
  database,
  serverUrl: initialServerUrl,
  onConnectionStateChange,
}: DevToolsProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [serverUrl, setServerUrl] = useState(() => resolveServerUrl(initialServerUrl));
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const metadata = useMemo(() => resolveDeviceMetadata(), []);
  const clientRef = useRef<ReturnType<typeof createDevToolsClient> | null>(null);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  const databaseRef = useRef(database);

  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange;
  }, [onConnectionStateChange]);

  useEffect(() => {
    databaseRef.current = database;
  }, [database]);

  useEffect(() => {
    const client = createDevToolsClient({
      serverUrl,
      role: DevToolsRole.MOBILE,
      metadata,
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        onConnectionStateChangeRef.current?.(state);
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
    setServerUrl(url);
  }, []);

  const value = useMemo(
    () => ({
      connectionState,
      deviceId,
      serverUrl,
      metadata,
      database,
      settingsVisible,
      openSettings,
      closeSettings,
      reconnect,
    }),
    [
      connectionState,
      deviceId,
      serverUrl,
      metadata,
      database,
      settingsVisible,
      openSettings,
      closeSettings,
      reconnect,
    ],
  );

  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
}
