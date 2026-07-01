import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createDevToolsClient, type ConnectionState } from 'database-devtools/client';
import {
  DevToolsRole,
  type DeviceStatusPayload,
  type MobileDeviceInfo,
} from 'database-devtools/protocol';

type DevToolsContextValue = {
  connectionState: ConnectionState;
  deviceStatus: DeviceStatusPayload | null;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  selectedDevice: MobileDeviceInfo | null;
  lastUpdatedAt: number | null;
};

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusPayload | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const client = createDevToolsClient({
      role: DevToolsRole.BROWSER,
      onConnectionStateChange: setConnectionState,
      onDeviceStatus: (status) => {
        setDeviceStatus(status);
        setLastUpdatedAt(Date.now());
      },
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  useEffect(() => {
    const mobiles = deviceStatus?.mobiles ?? [];

    if (mobiles.length === 0) {
      setSelectedDeviceId(null);
      return;
    }

    const stillConnected = mobiles.some((device) => device.deviceId === selectedDeviceId);

    if (!selectedDeviceId || !stillConnected) {
      setSelectedDeviceId(mobiles[0]?.deviceId ?? null);
    }
  }, [deviceStatus, selectedDeviceId]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId || !deviceStatus) {
      return null;
    }

    return deviceStatus.mobiles.find((device) => device.deviceId === selectedDeviceId) ?? null;
  }, [deviceStatus, selectedDeviceId]);

  const value = useMemo(
    () => ({
      connectionState,
      deviceStatus,
      selectedDeviceId,
      setSelectedDeviceId,
      selectedDevice,
      lastUpdatedAt,
    }),
    [connectionState, deviceStatus, selectedDeviceId, selectedDevice, lastUpdatedAt],
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
