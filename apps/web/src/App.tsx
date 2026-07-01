import { useEffect, useState } from 'react';
import { createDevToolsClient, type ConnectionState } from 'database-devtools/client';
import { DevToolsRole, type DeviceStatusPayload } from 'database-devtools/protocol';

function formatConnectionLabel(state: ConnectionState): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'reconnecting':
      return 'Reconnecting';
    case 'connecting':
      return 'Connecting';
    case 'disconnected':
      return 'Disconnected';
  }
}

function formatMobileCount(count: number): string {
  if (count === 0) {
    return '0 mobile devices connected';
  }

  if (count === 1) {
    return '1 mobile device connected';
  }

  return `${count} mobile devices connected`;
}

export function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusPayload | null>(null);

  useEffect(() => {
    const client = createDevToolsClient({
      role: DevToolsRole.BROWSER,
      onConnectionStateChange: setConnectionState,
      onDeviceStatus: setDeviceStatus,
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  const mobileCount = deviceStatus?.mobileCount ?? 0;

  return (
    <main className="app">
      <header>
        <h1>Database DevTools</h1>
      </header>

      <section className="panel">
        <h2>Connection Status</h2>
        <p className={`status status--${connectionState}`}>
          {formatConnectionLabel(connectionState)}
        </p>
        <p className="mobile-count">{formatMobileCount(mobileCount)}</p>

        {deviceStatus && deviceStatus.mobiles.length > 0 && (
          <ul className="device-list">
            {deviceStatus.mobiles.map((device) => (
              <li key={device.deviceId}>
                <span className="device-id">{device.deviceId}</span>
                {device.metadata?.platform && (
                  <span className="device-meta"> ({device.metadata.platform})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
