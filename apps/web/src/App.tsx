import { useEffect, useState } from 'react';
import { createDevToolsClient } from 'database-devtools/client';
import type { ServerMessage } from 'database-devtools/protocol';

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [deviceStatus, setDeviceStatus] = useState<ServerMessage['payload'] | null>(null);

  useEffect(() => {
    const client = createDevToolsClient({
      role: 'browser',
      onConnect: () => setConnectionState('connected'),
      onDisconnect: () => setConnectionState('disconnected'),
      onDeviceStatus: setDeviceStatus,
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  const mobileStatus = deviceStatus?.mobileConnected
    ? 'Mobile connected'
    : 'Waiting for mobile...';

  return (
    <main className="app">
      <header>
        <h1>Database DevTools</h1>
      </header>

      <section className="panel">
        <h2>Connection Status</h2>
        <p className={`status status--${connectionState}`}>{connectionState}</p>
        <p className="mobile-status">{mobileStatus}</p>
      </section>
    </main>
  );
}
