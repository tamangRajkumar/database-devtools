import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  DEVTOOLS_WS_PATH,
  isClientMessage,
  type DevToolsRole,
  type ServerMessage,
} from '../types/protocol.js';
import { DeviceRegistry } from './deviceRegistry.js';

type AttachedSocket = WebSocket & {
  devToolsRole?: DevToolsRole;
};

export type AttachWebSocketOptions = {
  onMobileConnected?: () => void;
  onMobileDisconnected?: () => void;
};

export function attachWebSocket(
  httpServer: Server,
  registry: DeviceRegistry,
  options: AttachWebSocketOptions = {},
): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: DEVTOOLS_WS_PATH });

  const broadcastStatus = (): void => {
    const message: ServerMessage = {
      type: 'deviceStatus',
      payload: registry.snapshot(),
    };
    const payload = JSON.stringify(message);

    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  };

  wss.on('connection', (socket: AttachedSocket) => {
    socket.on('message', (raw) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(String(raw));
      } catch {
        return;
      }

      if (!isClientMessage(parsed) || parsed.type !== 'register') {
        return;
      }

      const role = parsed.payload.role;
      socket.devToolsRole = role;
      registry.register(role);

      if (role === 'mobile') {
        console.log('[database-devtools] Mobile Connected');
        options.onMobileConnected?.();
      }

      broadcastStatus();
    });

    socket.on('close', () => {
      if (!socket.devToolsRole) {
        return;
      }

      registry.unregister(socket.devToolsRole);

      if (socket.devToolsRole === 'mobile') {
        options.onMobileDisconnected?.();
      }

      broadcastStatus();
    });
  });

  return wss;
}
