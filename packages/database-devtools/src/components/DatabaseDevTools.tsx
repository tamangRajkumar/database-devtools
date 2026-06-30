import { useEffect, useRef } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { createDevToolsClient } from '../client/createDevToolsClient.js';
import { buildDevToolsWsUrl, DEFAULT_DEVTOOLS_PORT } from '../types/protocol.js';

export type DatabaseDevToolsProps = {
  /** Reserved for future database adapters (SQLite, Realm, DuckDB, custom). */
  database?: unknown;
  /** WebSocket URL override, e.g. ws://192.168.1.10:3847/ws */
  serverUrl?: string;
  style?: ViewStyle;
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

export function DatabaseDevTools({ database: _database, serverUrl, style }: DatabaseDevToolsProps) {
  const clientRef = useRef<ReturnType<typeof createDevToolsClient> | null>(null);

  useEffect(() => {
    const client = createDevToolsClient({
      serverUrl: resolveServerUrl(serverUrl),
      role: 'mobile',
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [serverUrl]);

  return (
    <View style={[{ padding: 8 }, style]}>
      <Text>Database DevTools Loaded</Text>
    </View>
  );
}
