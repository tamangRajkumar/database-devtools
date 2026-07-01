import { createContext, useContext } from 'react';
import type { ConnectionState } from '../client/createDevToolsClient';
import type { DatabaseAdapter } from '../types/adapter';
import type { DeviceMetadata } from '../types/protocol';

export type DevToolsContextValue = {
  connectionState: ConnectionState;
  deviceId: string | undefined;
  serverUrl: string;
  metadata: DeviceMetadata;
  database: DatabaseAdapter | undefined;
  adapterError: string | null;
  settingsVisible: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  reconnect: (url: string) => void;
};

export const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function useDevTools(): DevToolsContextValue {
  const context = useContext(DevToolsContext);

  if (!context) {
    throw new Error('useDevTools must be used within DevToolsProvider');
  }

  return context;
}
