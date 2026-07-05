import {
  buildDevToolsWsUrl,
  DEFAULT_DEVTOOLS_PORT,
  DevToolsRole,
  isBeginTransactionMessage,
  isCommitTransactionMessage,
  isDeviceStatusMessage,
  isExecuteWriteMessage,
  isExportSnapshotErrorMessage,
  isPingMessage,
  isRefreshErrorMessage,
  isRefreshStatusMessage,
  isRollbackTransactionMessage,
  isSnapshotReadyMessage,
  isSnapshotUploadRequestedMessage,
  isTransactionStatusMessage,
  isWriteErrorMessage,
  isWriteResultMessage,
  MessageType,
  type ClientMessage,
  type DeviceMetadata,
  type DeviceStatusPayload,
  type ExportSnapshotErrorMessage,
  type PongMessage,
  type RefreshErrorMessage,
  type RefreshRequestMessage,
  type RefreshStatusMessage,
  type RegisterMessage,
  type SnapshotReadyMessage,
  type SnapshotUploadRequestedMessage,
  type TransactionAckMessage,
  type TransactionStatusMessage,
  type WriteAckMessage,
  type WriteErrorMessage,
  type WriteResultMessage,
} from '../types/protocol';
import type { WriteOperation } from '../types/write';
import { generateDeviceId, generateTransactionId, generateWriteId } from '../utils/ids';
import { ReconnectScheduler } from '../utils/reconnect';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type TransactionState = 'idle' | 'opening' | 'open' | 'committing' | 'rolling_back';

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
  onSnapshotUploadRequested?: (message: SnapshotUploadRequestedMessage) => void;
  onExportSnapshotError?: (message: ExportSnapshotErrorMessage) => void;
  onRefreshStatus?: (message: RefreshStatusMessage) => void;
  onSnapshotReady?: (message: SnapshotReadyMessage) => void;
  onRefreshError?: (message: RefreshErrorMessage) => void;
  onBeginTransaction?: (message: import('../types/protocol').BeginTransactionMessage) => void;
  onCommitTransaction?: (message: import('../types/protocol').CommitTransactionMessage) => void;
  onRollbackTransaction?: (message: import('../types/protocol').RollbackTransactionMessage) => void;
  onExecuteWrite?: (message: import('../types/protocol').ExecuteWriteMessage) => void;
  onTransactionStatus?: (message: TransactionStatusMessage) => void;
  onWriteResult?: (message: WriteResultMessage) => void;
  onWriteError?: (message: WriteErrorMessage) => void;
  onTransactionStateChange?: (state: TransactionState) => void;
  onError?: (error: Error) => void;
};

export type DevToolsClient = {
  connect: () => void;
  disconnect: () => void;
  getConnectionState: () => ConnectionState;
  getLastConnectionError: () => string | null;
  getDeviceStatus: () => DeviceStatusPayload | null;
  getDeviceId: () => string | undefined;
  getServerUrl: () => string;
  setServerUrl: (url: string) => void;
  send: (message: ClientMessageInput) => void;
  requestRefresh: (deviceId: string) => void;
  requestExportSnapshot: () => void;
  sendTransactionAck: (message: Omit<TransactionAckMessage, 'timestamp' | 'type'>) => void;
  sendWriteAck: (message: Omit<WriteAckMessage, 'timestamp' | 'type'>) => void;
  beginTransaction: (deviceId: string) => Promise<void>;
  commitTransaction: () => Promise<void>;
  rollbackTransaction: () => Promise<void>;
  executeWrite: (operation: WriteOperation) => Promise<{ rowsAffected: number }>;
  getTransactionState: () => TransactionState;
  getActiveTransactionId: () => string | null;
};

type ClientMessageInput =
  | Omit<RegisterMessage, 'timestamp'>
  | Omit<PongMessage, 'timestamp'>
  | Omit<RefreshRequestMessage, 'timestamp'>
  | Omit<import('../types/protocol').ExportSnapshotRequestMessage, 'timestamp'>
  | Omit<TransactionAckMessage, 'timestamp'>
  | Omit<WriteAckMessage, 'timestamp'>
  | Omit<import('../types/protocol').BeginTransactionRequestMessage, 'timestamp'>
  | Omit<import('../types/protocol').CommitTransactionRequestMessage, 'timestamp'>
  | Omit<import('../types/protocol').RollbackTransactionRequestMessage, 'timestamp'>
  | Omit<import('../types/protocol').WriteRequestMessage, 'timestamp'>;

const WRITE_TIMEOUT_MS = 30_000;

export function createDevToolsClient(options: DevToolsClientOptions = {}): DevToolsClient {
  const role = options.role ?? DevToolsRole.MOBILE;
  const WebSocketImpl = options.WebSocketImpl ?? globalThis.WebSocket;

  if (!WebSocketImpl) {
    throw new Error('WebSocket is not available in this environment.');
  }

  let socket: InstanceType<typeof WebSocketImpl> | null = null;
  let deviceStatus: DeviceStatusPayload | null = null;
  let connectionState: ConnectionState = 'disconnected';
  let lastConnectionError: string | null = null;
  let intentionalDisconnect = false;
  let transactionState: TransactionState = 'idle';
  let activeTransactionId: string | null = null;
  let activeDeviceId: string | null = null;

  const pendingTransaction = new Map<
    string,
    { resolve: () => void; reject: (error: Error) => void; action: 'begin' | 'commit' | 'rollback' }
  >();
  const pendingWrites = new Map<
    string,
    { resolve: (result: { rowsAffected: number }) => void; reject: (error: Error) => void }
  >();

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

  const setTransactionState = (state: TransactionState): void => {
    if (transactionState === state) {
      return;
    }

    transactionState = state;
    options.onTransactionStateChange?.(state);
  };

  const resetTransaction = (): void => {
    setTransactionState('idle');
    activeTransactionId = null;
    activeDeviceId = null;
  };

  const rejectPendingTransaction = (transactionId: string, error: Error): void => {
    const pending = pendingTransaction.get(transactionId);

    if (pending) {
      pending.reject(error);
      pendingTransaction.delete(transactionId);
    }
  };

  const rejectAllPending = (error: Error): void => {
    for (const [id, pending] of pendingTransaction) {
      pending.reject(error);
      pendingTransaction.delete(id);
    }

    for (const [id, pending] of pendingWrites) {
      pending.reject(error);
      pendingWrites.delete(id);
    }

    resetTransaction();
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

    if (isSnapshotUploadRequestedMessage(parsed)) {
      options.onSnapshotUploadRequested?.(parsed);
      return;
    }

    if (isExportSnapshotErrorMessage(parsed)) {
      options.onExportSnapshotError?.(parsed);
      return;
    }

    if (isRefreshStatusMessage(parsed)) {
      options.onRefreshStatus?.(parsed);
      return;
    }

    if (isSnapshotReadyMessage(parsed)) {
      options.onSnapshotReady?.(parsed);
      return;
    }

    if (isRefreshErrorMessage(parsed)) {
      options.onRefreshError?.(parsed);
      return;
    }

    if (isBeginTransactionMessage(parsed)) {
      options.onBeginTransaction?.(parsed);
      return;
    }

    if (isCommitTransactionMessage(parsed)) {
      options.onCommitTransaction?.(parsed);
      return;
    }

    if (isRollbackTransactionMessage(parsed)) {
      options.onRollbackTransaction?.(parsed);
      return;
    }

    if (isExecuteWriteMessage(parsed)) {
      options.onExecuteWrite?.(parsed);
      return;
    }

    if (isTransactionStatusMessage(parsed)) {
      options.onTransactionStatus?.(parsed);

      if (role !== DevToolsRole.BROWSER) {
        return;
      }

      const pending = pendingTransaction.get(parsed.transactionId);

      if (parsed.state === 'open' && pending?.action === 'begin') {
        setTransactionState('open');
        activeTransactionId = parsed.transactionId;
        activeDeviceId = parsed.deviceId;
        pending.resolve();
        pendingTransaction.delete(parsed.transactionId);
        return;
      }

      if (parsed.state === 'idle' && pending && (pending.action === 'commit' || pending.action === 'rollback')) {
        resetTransaction();
        pending.resolve();
        pendingTransaction.delete(parsed.transactionId);
        return;
      }

      if (parsed.state === 'failed') {
        rejectPendingTransaction(
          parsed.transactionId,
          new Error(parsed.message ?? 'Transaction failed'),
        );
        resetTransaction();
      }

      return;
    }

    if (isWriteResultMessage(parsed)) {
      options.onWriteResult?.(parsed);

      const pending = pendingWrites.get(parsed.writeId);

      if (pending) {
        pending.resolve({ rowsAffected: parsed.rowsAffected });
        pendingWrites.delete(parsed.writeId);
      }

      return;
    }

    if (isWriteErrorMessage(parsed)) {
      options.onWriteError?.(parsed);

      const error = new Error(parsed.message);

      if (parsed.writeId) {
        const pendingWrite = pendingWrites.get(parsed.writeId);

        if (pendingWrite) {
          pendingWrite.reject(error);
          pendingWrites.delete(parsed.writeId);
        }
      } else {
        rejectPendingTransaction(parsed.transactionId, error);
        resetTransaction();
      }
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
      lastConnectionError = null;
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
      rejectAllPending(new Error('Disconnected from DevTools hub'));

      if (intentionalDisconnect) {
        setConnectionState('disconnected');
        return;
      }

      setConnectionState('reconnecting');
      reconnectScheduler.schedule();
    });

    socket.addEventListener('error', () => {
      const error = new Error(`WebSocket connection failed: ${wsUrl}`);
      lastConnectionError = error.message;
      options.onError?.(error);
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
    rejectAllPending(new Error('Disconnected'));
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

  const requestRefresh = (targetDeviceId: string): void => {
    send({
      type: MessageType.REFRESH_REQUEST,
      deviceId: targetDeviceId,
      refreshType: 'snapshot',
    });
  };

  const requestExportSnapshot = (): void => {
    send({
      type: MessageType.EXPORT_SNAPSHOT_REQUEST,
      refreshType: 'snapshot',
    });
  };

  const sendTransactionAck = (message: Omit<TransactionAckMessage, 'timestamp' | 'type'>): void => {
    send({
      type: MessageType.TRANSACTION_ACK,
      ...message,
    });
  };

  const sendWriteAck = (message: Omit<WriteAckMessage, 'timestamp' | 'type'>): void => {
    send({
      type: MessageType.WRITE_ACK,
      ...message,
    });
  };

  const waitForTransaction = (
    transactionId: string,
    action: 'begin' | 'commit' | 'rollback',
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingTransaction.delete(transactionId);
        reject(new Error(`Transaction ${action} timed out`));
      }, WRITE_TIMEOUT_MS);

      pendingTransaction.set(transactionId, {
        action,
        resolve: () => {
          clearTimeout(timer);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  };

  const beginTransaction = async (targetDeviceId: string): Promise<void> => {
    if (role !== DevToolsRole.BROWSER) {
      throw new Error('beginTransaction is only available for browser clients');
    }

    if (transactionState !== 'idle') {
      throw new Error('A transaction is already active');
    }

    const transactionId = generateTransactionId();
    setTransactionState('opening');
    activeTransactionId = transactionId;
    activeDeviceId = targetDeviceId;

    const promise = waitForTransaction(transactionId, 'begin');

    send({
      type: MessageType.BEGIN_TRANSACTION_REQUEST,
      transactionId,
      deviceId: targetDeviceId,
    });

    await promise;
  };

  const commitTransaction = async (): Promise<void> => {
    if (role !== DevToolsRole.BROWSER) {
      throw new Error('commitTransaction is only available for browser clients');
    }

    if (!activeTransactionId || !activeDeviceId || transactionState !== 'open') {
      throw new Error('No open transaction');
    }

    const transactionId = activeTransactionId;
    const deviceIdForCommit = activeDeviceId;
    setTransactionState('committing');

    const promise = waitForTransaction(transactionId, 'commit');

    send({
      type: MessageType.COMMIT_TRANSACTION_REQUEST,
      transactionId,
      deviceId: deviceIdForCommit,
    });

    await promise;
  };

  const rollbackTransaction = async (): Promise<void> => {
    if (role !== DevToolsRole.BROWSER) {
      throw new Error('rollbackTransaction is only available for browser clients');
    }

    if (!activeTransactionId || !activeDeviceId) {
      throw new Error('No active transaction');
    }

    const transactionId = activeTransactionId;
    const deviceIdForRollback = activeDeviceId;
    setTransactionState('rolling_back');

    const promise = waitForTransaction(transactionId, 'rollback');

    send({
      type: MessageType.ROLLBACK_TRANSACTION_REQUEST,
      transactionId,
      deviceId: deviceIdForRollback,
    });

    await promise;
  };

  const executeWrite = async (operation: WriteOperation): Promise<{ rowsAffected: number }> => {
    if (role !== DevToolsRole.BROWSER) {
      throw new Error('executeWrite is only available for browser clients');
    }

    if (!activeTransactionId || !activeDeviceId || transactionState !== 'open') {
      throw new Error('No open transaction');
    }

    const writeId = generateWriteId();

    const promise = new Promise<{ rowsAffected: number }>((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingWrites.delete(writeId);
        reject(new Error('Write operation timed out'));
      }, WRITE_TIMEOUT_MS);

      pendingWrites.set(writeId, {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });

    send({
      type: MessageType.WRITE_REQUEST,
      writeId,
      transactionId: activeTransactionId,
      deviceId: activeDeviceId,
      operation,
    });

    return promise;
  };

  return {
    connect,
    disconnect,
    getConnectionState: () => connectionState,
    getLastConnectionError: () => lastConnectionError,
    getDeviceStatus: () => deviceStatus,
    getDeviceId: () => deviceId,
    getServerUrl: () => wsUrl,
    setServerUrl,
    send,
    requestRefresh,
    requestExportSnapshot,
    sendTransactionAck,
    sendWriteAck,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    executeWrite,
    getTransactionState: () => transactionState,
    getActiveTransactionId: () => activeTransactionId,
  };
}
