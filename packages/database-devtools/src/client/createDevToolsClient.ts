import {
  buildDevToolsWsUrl,
  createMessage,
  DEFAULT_DEVTOOLS_PORT,
  DevToolsRole,
  isDeviceStatusMessage,
  isPingMessage,
  MessageType,
  type DeviceMetadata,
  type DeviceStatusPayload,
  type RegisterMessage,
} from '../types/protocol.js';
import { generateDeviceId } from '../utils/ids.js';
import { ReconnectScheduler } from '../utils/reconnect.js';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type DevToolsClientOptions = {
  serverUrl?: string;
  role?: DevToolsRole;
  deviceId?: string;
  metadata?: DeviceMetadata;
  WebSocketImpl?: typeof WebSocket;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onDeviceStatus?: (status: DeviceStatusPayload) => void;
  onError?: (error: Error) => void;
};

export type DevToolsClient = {
  connect: () => void;
  disconnect: () => void;
  getConnectionState: () => ConnectionState;
  getDeviceStatus: () => DeviceStatusPayload | null;
};

export function createDevToolsClient(options: DevToolsClientOptions = {}): DevToolsClient {
  const role = options.role ?? DevToolsRole.MOBILE;
  const WebSocketImpl = options.WebSocketImpl ?? globalThis.WebSocket;

  if (!WebSocketImpl) {
    throw new Error('WebSocket is not available in this environment.');
  }

  let socket: InstanceType<typeof WebSocketImpl> | null = null;
  let deviceStatus: DeviceStatusPayload | null = null;
  let connectionState: ConnectionState = 'disconnected';
  let intentionalDisconnect = false;

  const deviceId =
    role === DevToolsRole.MOBILE ? (options.deviceId ?? generateDeviceId()) : undefined;

  const wsUrl =
    options.serverUrl ?? buildDevToolsWsUrl('localhost', DEFAULT_DEVTOOLS_PORT);

  const setConnectionState = (state: ConnectionState): void => {
    if (connectionState === state) {
      return;
    }

    connectionState = state;
    options.onConnectionStateChange?.(state);
  };

  const reconnectScheduler = new ReconnectScheduler({
    onReconnect: () => {
      openSocket();
    },
  });

  const sendRegister = (): void => {
    const message = createMessage<RegisterMessage>({
      type: MessageType.REGISTER,
      role,
      ...(deviceId ? { deviceId } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    });

    socket?.send(JSON.stringify(message));
  };

  const openSocket = (): void => {
    if (
      socket &&
      (socket.readyState === WebSocketImpl.OPEN || socket.readyState === WebSocketImpl.CONNECTING)
    ) {
      return;
    }

    setConnectionState(intentionalDisconnect ? 'disconnected' : connectionState === 'disconnected' ? 'connecting' : 'reconnecting');

    socket = new WebSocketImpl(wsUrl);

    socket.addEventListener('open', () => {
      reconnectScheduler.reset();
      setConnectionState('connected');
      options.onConnect?.();
      sendRegister();
    });

    socket.addEventListener('message', (event) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (isPingMessage(parsed)) {
        socket?.send(
          JSON.stringify(
            createMessage({
              type: MessageType.PONG,
              pingId: parsed.pingId,
            }),
          ),
        );
        return;
      }

      if (isDeviceStatusMessage(parsed)) {
        deviceStatus = parsed.payload;
        options.onDeviceStatus?.(parsed.payload);
      }
    });

    socket.addEventListener('close', () => {
      socket = null;
      options.onDisconnect?.();

      if (intentionalDisconnect) {
        setConnectionState('disconnected');
        return;
      }

      setConnectionState('reconnecting');
      reconnectScheduler.schedule();
    });

    socket.addEventListener('error', () => {
      options.onError?.(new Error(`WebSocket connection failed: ${wsUrl}`));
    });
  };

  const connect = (): void => {
    intentionalDisconnect = false;
    openSocket();
  };

  const disconnect = (): void => {
    intentionalDisconnect = true;
    reconnectScheduler.cancel();
    socket?.close();
    socket = null;
    setConnectionState('disconnected');
  };

  return {
    connect,
    disconnect,
    getConnectionState: () => connectionState,
    getDeviceStatus: () => deviceStatus,
  };
}
