import {
  buildDevToolsWsUrl,
  DEFAULT_DEVTOOLS_PORT,
  isServerMessage,
  type DevToolsRole,
  type ServerMessage,
} from '../types/protocol.js';

export type DevToolsClientOptions = {
  serverUrl?: string;
  role?: DevToolsRole;
  WebSocketImpl?: typeof WebSocket;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onDeviceStatus?: (status: ServerMessage['payload']) => void;
  onError?: (error: Error) => void;
};

export type DevToolsClient = {
  connect: () => void;
  disconnect: () => void;
  getDeviceStatus: () => ServerMessage['payload'] | null;
};

export function createDevToolsClient(options: DevToolsClientOptions = {}): DevToolsClient {
  const role = options.role ?? 'mobile';
  const WebSocketImpl = options.WebSocketImpl ?? globalThis.WebSocket;

  if (!WebSocketImpl) {
    throw new Error('WebSocket is not available in this environment.');
  }

  let socket: InstanceType<typeof WebSocketImpl> | null = null;
  let deviceStatus: ServerMessage['payload'] | null = null;

  const wsUrl =
    options.serverUrl ??
    buildDevToolsWsUrl('localhost', DEFAULT_DEVTOOLS_PORT);

  const connect = (): void => {
    if (socket && (socket.readyState === WebSocketImpl.OPEN || socket.readyState === WebSocketImpl.CONNECTING)) {
      return;
    }

    socket = new WebSocketImpl(wsUrl);

    socket.addEventListener('open', () => {
      console.log('[database-devtools] Connected to Database DevTools');
      options.onConnect?.();

      socket?.send(
        JSON.stringify({
          type: 'register',
          payload: { role },
        }),
      );
    });

    socket.addEventListener('message', (event) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (!isServerMessage(parsed)) {
        return;
      }

      deviceStatus = parsed.payload;
      options.onDeviceStatus?.(parsed.payload);
    });

    socket.addEventListener('close', () => {
      socket = null;
      options.onDisconnect?.();
    });

    socket.addEventListener('error', () => {
      options.onError?.(new Error(`WebSocket connection failed: ${wsUrl}`));
    });
  };

  const disconnect = (): void => {
    socket?.close();
    socket = null;
  };

  return {
    connect,
    disconnect,
    getDeviceStatus: () => deviceStatus,
  };
}
