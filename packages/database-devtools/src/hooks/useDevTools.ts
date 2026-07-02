import { createContext, useContext } from 'react';
import type { ConnectionState } from '../client/createDevToolsClient';
import type { DatabaseAdapter } from '../types/adapter';
import type { DeviceMetadata } from '../types/protocol';
import type { MobileDatabaseInspector } from '../mobile/types';

export type ExportState = 'idle' | 'exporting' | 'success' | 'error';

export type DevToolsContextValue = {
  connectionState: ConnectionState;
  connectionError: string | null;
  connectionHint: string | null;
  deviceId: string | undefined;
  serverUrl: string;
  metadata: DeviceMetadata;
  database: DatabaseAdapter | undefined;
  adapterError: string | null;
  mobileInspector: MobileDatabaseInspector | null;
  launcherVisible: boolean;
  openLauncher: () => void;
  closeLauncher: () => void;
  explorerVisible: boolean;
  openExplorer: () => void;
  closeExplorer: () => void;
  settingsVisible: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  reconnect: (url: string) => void;
  exportState: ExportState;
  exportError: string | null;
  exportDatabase: () => Promise<void>;
};

export const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function useDevTools(): DevToolsContextValue {
  const context = useContext(DevToolsContext);

  if (!context) {
    throw new Error('useDevTools must be used within DevToolsProvider');
  }

  return context;
}
