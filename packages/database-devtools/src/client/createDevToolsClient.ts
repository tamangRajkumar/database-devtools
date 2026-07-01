import {
  buildDevToolsWsUrl,
  DEFAULT_DEVTOOLS_PORT,
  DevToolsRole,
  isDatabaseReadyMessage,
  isDeviceStatusMessage,
  isPingMessage,
  isSyncDatabaseMessage,
  isSyncErrorMessage,
  isSyncStatusMessage,
  MessageType,
  type ClientMessage,
  type DatabaseReadyMessage,
  type DeviceMetadata,
  type DeviceStatusPayload,
  type ExportFailedMessage,
  type PongMessage,
  type RefreshRequestMessage,
  type RegisterMessage,
  type SyncDatabaseMessage,
  type SyncErrorMessage,
  type SyncStatusMessage,
} from '../types/protocol';
import { generateDeviceId, generateSyncId } from '../utils/ids';
import { ReconnectScheduler } from '../utils/reconnect';

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
  onSyncDatabase?: (message: SyncDatabaseMessage) => void;
  onSyncStatus?: (message: SyncStatusMessage) => void;
  onDatabaseReady?: (message: DatabaseReadyMessage) => void;
  onSyncError?: (message: SyncErrorMessage) => void;
  onError?: (error: Error) => void;
};

export type DevToolsClient = {
  connect: () => void;
  disconnect: () => void;
  getConnectionState: () => ConnectionState;
  getDeviceStatus: () => DeviceStatusPayload | null;
  getDeviceId: () => string | undefined;
  getServerUrl: () => string;
  setServerUrl: (url: string) => void;
  send: (message: ClientMessageInput) => void;
  requestRefresh: (deviceId: string) => string;
  reportExportFailed: (syncId: string, message: string) => void;
};

type ClientMessageInput =
  | Omit<RegisterMessage, 'timestamp'>
  | Omit<PongMessage, 'timestamp'>
  | Omit<RefreshRequestMessage, 'timestamp'>
  | Omit<ExportFailedMessage, 'timestamp'>;

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

  let wsUrl =
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

  const send = (message: ClientMessageInput): void => {
    if (!socket || socket.readyState !== WebSocketImpl.OPEN) {
      return;
    }

    socket.send(JSON.stringify({ ...message, timestamp: Date.now() }));
  };

  const sendRegister = (): void => {
    send({
      type: MessageType.REGISTER,
      role,
      ...(deviceId ? { deviceId } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    });
  };

  const handleServerMessage = (parsed: unknown): void => {
    if (isPingMessage(parsed)) {
      send({
        type: MessageType.PONG,
        pingId: parsed.pingId,
      });
      return;
    }

    if (isDeviceStatusMessage(parsed)) {
      deviceStatus = parsed.payload;
      options.onDeviceStatus?.(parsed.payload);
      return;
    }

    if (isSyncDatabaseMessage(parsed)) {
      options.onSyncDatabase?.(parsed);
      return;
    }

    if (isSyncStatusMessage(parsed)) {
      options.onSyncStatus?.(parsed);
      return;
    }

    if (isDatabaseReadyMessage(parsed)) {
      options.onDatabaseReady?.(parsed);
      return;
    }

    if (isSyncErrorMessage(parsed)) {
      options.onSyncError?.(parsed);
    }
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

      handleServerMessage(parsed);
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

  const setServerUrl = (url: string): void => {
    wsUrl = url;
    const wasConnected =
      connectionState === 'connected' ||
      connectionState === 'connecting' ||
      connectionState === 'reconnecting';

    disconnect();
    intentionalDisconnect = false;

    if (wasConnected) {
      connect();
    }
  };

  const requestRefresh = (targetDeviceId: string): string => {
    const syncId = generateSyncId();

    send({
      type: MessageType.REFRESH_REQUEST,
      syncId,
      deviceId: targetDeviceId,
    });

    return syncId;
  };

  const reportExportFailed = (syncId: string, message: string): void => {
    send({
      type: MessageType.EXPORT_FAILED,
      syncId,
      message,
    });
  };

  return {
    connect,
    disconnect,
    getConnectionState: () => connectionState,
    getDeviceStatus: () => deviceStatus,
    getDeviceId: () => deviceId,
    getServerUrl: () => wsUrl,
    setServerUrl,
    send,
    requestRefresh,
    reportExportFailed,
  };
}
