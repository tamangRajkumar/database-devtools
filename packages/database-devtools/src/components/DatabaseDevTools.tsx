import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View, type ViewStyle } from 'react-native';
import {
  createDevToolsClient,
  type ConnectionState,
} from '../client/createDevToolsClient.js';
import { buildDevToolsWsUrl, DEFAULT_DEVTOOLS_PORT, DevToolsRole } from '../types/protocol.js';

export type { ConnectionState };

export type DatabaseDevToolsProps = {
  /** Reserved for future database adapters (SQLite, Realm, DuckDB, custom). */
  database?: unknown;
  /** WebSocket URL override, e.g. ws://192.168.1.10:3847/ws */
  serverUrl?: string;
  style?: ViewStyle;
  onConnectionStateChange?: (state: ConnectionState) => void;
};

function resolveServerUrl(serverUrl?: string): string {
  if (serverUrl) {
    return serverUrl;
  }

  const envUrl =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_DATABASE_DEVTOOLS_URL
      : undefined;

  if (envUrl) {
    return envUrl.startsWith('ws://') || envUrl.startsWith('wss://')
      ? envUrl
      : buildDevToolsWsUrl(envUrl.replace(/^https?:\/\//, ''), DEFAULT_DEVTOOLS_PORT);
  }

  return buildDevToolsWsUrl('localhost', DEFAULT_DEVTOOLS_PORT);
}

function formatConnectionLabel(state: ConnectionState): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'reconnecting':
      return 'Reconnecting...';
    case 'connecting':
      return 'Connecting...';
    case 'disconnected':
      return 'Disconnected';
  }
}

export function DatabaseDevTools({
  database: _database,
  serverUrl,
  style,
  onConnectionStateChange,
}: DatabaseDevToolsProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const clientRef = useRef<ReturnType<typeof createDevToolsClient> | null>(null);

  useEffect(() => {
    const client = createDevToolsClient({
      serverUrl: resolveServerUrl(serverUrl),
      role: DevToolsRole.MOBILE,
      metadata: {
        platform: Platform.OS,
        appName: 'Database DevTools Example',
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        onConnectionStateChange?.(state);
      },
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [serverUrl, onConnectionStateChange]);

  return (
    <View style={[{ padding: 8 }, style]}>
      <Text>Database DevTools Loaded</Text>
      <Text>{formatConnectionLabel(connectionState)}</Text>
    </View>
  );
}
