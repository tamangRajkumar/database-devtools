import type { WriteOperation } from './write';

/** Client and server roles on the WebSocket hub. */
export const DevToolsRole = {
  MOBILE: 'mobile',
  BROWSER: 'browser',
} as const;

export type DevToolsRole = (typeof DevToolsRole)[keyof typeof DevToolsRole];

/** All wire message type identifiers. */
export const MessageType = {
  REGISTER: 'register',
  PING: 'ping',
  PONG: 'pong',
  DEVICE_STATUS: 'deviceStatus',
  BROADCAST: 'broadcast',
  REFRESH_REQUEST: 'refreshRequest',
  SYNC_DATABASE: 'syncDatabase',
  SYNC_STATUS: 'syncStatus',
  DATABASE_READY: 'databaseReady',
  SYNC_ERROR: 'syncError',
  EXPORT_FAILED: 'exportFailed',
  BEGIN_TRANSACTION_REQUEST: 'beginTransactionRequest',
  COMMIT_TRANSACTION_REQUEST: 'commitTransactionRequest',
  ROLLBACK_TRANSACTION_REQUEST: 'rollbackTransactionRequest',
  WRITE_REQUEST: 'writeRequest',
  BEGIN_TRANSACTION: 'beginTransaction',
  COMMIT_TRANSACTION: 'commitTransaction',
  ROLLBACK_TRANSACTION: 'rollbackTransaction',
  EXECUTE_WRITE: 'executeWrite',
  TRANSACTION_ACK: 'transactionAck',
  WRITE_ACK: 'writeAck',
  TRANSACTION_STATUS: 'transactionStatus',
  WRITE_RESULT: 'writeResult',
  WRITE_ERROR: 'writeError',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

/** Shared base for every protocol message. */
export interface DevToolsMessageBase {
  type: MessageTypeValue;
  timestamp: number;
}

export type DeviceMetadata = {
  platform?: string;
  appName?: string;
  [key: string]: string | undefined;
};

/** Client → Server: register role on connect. */
export interface RegisterMessage extends DevToolsMessageBase {
  type: typeof MessageType.REGISTER;
  role: DevToolsRole;
  deviceId?: string;
  metadata?: DeviceMetadata;
}

/** Server → Client: heartbeat probe. */
export interface PingMessage extends DevToolsMessageBase {
  type: typeof MessageType.PING;
  pingId: string;
}

/** Client → Server: heartbeat response. */
export interface PongMessage extends DevToolsMessageBase {
  type: typeof MessageType.PONG;
  pingId: string;
}

export type BrowserConnectionInfo = {
  connectionId: string;
  connectedAt: number;
};

export type MobileDeviceInfo = {
  deviceId: string;
  connectionId: string;
  connectedAt: number;
  metadata?: DeviceMetadata;
};

export type DeviceStatusPayload = {
  browserCount: number;
  mobileCount: number;
  browsers: BrowserConnectionInfo[];
  mobiles: MobileDeviceInfo[];
};

/** Server → Client: hub snapshot after connect/disconnect. */
export interface DeviceStatusMessage extends DevToolsMessageBase {
  type: typeof MessageType.DEVICE_STATUS;
  payload: DeviceStatusPayload;
}

/** Server → Client: generic routed envelope for future features. */
export interface BroadcastMessage extends DevToolsMessageBase {
  type: typeof MessageType.BROADCAST;
  payload: unknown;
}

export type SyncState =
  | 'requested'
  | 'exporting'
  | 'uploading'
  | 'ready'
  | 'failed'
  | 'timeout';

export type SyncErrorCode =
  | 'DEVICE_OFFLINE'
  | 'SYNC_IN_PROGRESS'
  | 'EXPORT_FAILED'
  | 'UPLOAD_FAILED'
  | 'TIMEOUT'
  | 'SNAPSHOT_NOT_FOUND'
  | 'INVALID_REQUEST';

/** Browser → Server: request a database snapshot from a mobile device. */
export interface RefreshRequestMessage extends DevToolsMessageBase {
  type: typeof MessageType.REFRESH_REQUEST;
  syncId: string;
  deviceId: string;
}

/** Server → Mobile: export database and upload to the given URL. */
export interface SyncDatabaseMessage extends DevToolsMessageBase {
  type: typeof MessageType.SYNC_DATABASE;
  syncId: string;
  uploadUrl: string;
}

/** Server → Browser: sync progress update. */
export interface SyncStatusMessage extends DevToolsMessageBase {
  type: typeof MessageType.SYNC_STATUS;
  syncId: string;
  deviceId: string;
  state: SyncState;
}

/** Server → Browser: snapshot uploaded and ready to download. */
export interface DatabaseReadyMessage extends DevToolsMessageBase {
  type: typeof MessageType.DATABASE_READY;
  syncId: string;
  deviceId: string;
  size: number;
  exportedAt: number;
  downloadUrl: string;
}

/** Server → Browser: sync failed. */
export interface SyncErrorMessage extends DevToolsMessageBase {
  type: typeof MessageType.SYNC_ERROR;
  syncId: string;
  deviceId?: string;
  code: SyncErrorCode;
  message: string;
}

/** Mobile → Server: export or upload failed on device. */
export interface ExportFailedMessage extends DevToolsMessageBase {
  type: typeof MessageType.EXPORT_FAILED;
  syncId: string;
  message: string;
}

export type TransactionStatusState =
  | 'idle'
  | 'opening'
  | 'open'
  | 'committing'
  | 'rolling_back'
  | 'failed';

export type WriteErrorCode =
  | 'DEVICE_OFFLINE'
  | 'NO_TRANSACTION'
  | 'TRANSACTION_BUSY'
  | 'INVALID_OPERATION'
  | 'WRITE_FAILED'
  | 'ADAPTER_ERROR'
  | 'TIMEOUT';

/** Browser → Server: open a write transaction on a device. */
export interface BeginTransactionRequestMessage extends DevToolsMessageBase {
  type: typeof MessageType.BEGIN_TRANSACTION_REQUEST;
  transactionId: string;
  deviceId: string;
}

/** Browser → Server: commit the active transaction. */
export interface CommitTransactionRequestMessage extends DevToolsMessageBase {
  type: typeof MessageType.COMMIT_TRANSACTION_REQUEST;
  transactionId: string;
  deviceId: string;
}

/** Browser → Server: roll back the active transaction. */
export interface RollbackTransactionRequestMessage extends DevToolsMessageBase {
  type: typeof MessageType.ROLLBACK_TRANSACTION_REQUEST;
  transactionId: string;
  deviceId: string;
}

/** Browser → Server: execute a structured write inside a transaction. */
export interface WriteRequestMessage extends DevToolsMessageBase {
  type: typeof MessageType.WRITE_REQUEST;
  writeId: string;
  transactionId: string;
  deviceId: string;
  operation: WriteOperation;
}

/** Server → Mobile: begin a transaction on the live database. */
export interface BeginTransactionMessage extends DevToolsMessageBase {
  type: typeof MessageType.BEGIN_TRANSACTION;
  transactionId: string;
}

/** Server → Mobile: commit the open transaction. */
export interface CommitTransactionMessage extends DevToolsMessageBase {
  type: typeof MessageType.COMMIT_TRANSACTION;
  transactionId: string;
}

/** Server → Mobile: roll back the open transaction. */
export interface RollbackTransactionMessage extends DevToolsMessageBase {
  type: typeof MessageType.ROLLBACK_TRANSACTION;
  transactionId: string;
}

/** Server → Mobile: run a structured write operation. */
export interface ExecuteWriteMessage extends DevToolsMessageBase {
  type: typeof MessageType.EXECUTE_WRITE;
  writeId: string;
  transactionId: string;
  operation: WriteOperation;
}

/** Mobile → Server: transaction lifecycle acknowledgement. */
export interface TransactionAckMessage extends DevToolsMessageBase {
  type: typeof MessageType.TRANSACTION_ACK;
  transactionId: string;
  action: 'begin' | 'commit' | 'rollback';
  ok: boolean;
  message?: string;
}

/** Mobile → Server: write operation acknowledgement. */
export interface WriteAckMessage extends DevToolsMessageBase {
  type: typeof MessageType.WRITE_ACK;
  writeId: string;
  transactionId: string;
  ok: boolean;
  rowsAffected?: number;
  message?: string;
}

/** Server → Browser: transaction state update. */
export interface TransactionStatusMessage extends DevToolsMessageBase {
  type: typeof MessageType.TRANSACTION_STATUS;
  transactionId: string;
  deviceId: string;
  state: TransactionStatusState;
  message?: string;
}

/** Server → Browser: write succeeded. */
export interface WriteResultMessage extends DevToolsMessageBase {
  type: typeof MessageType.WRITE_RESULT;
  writeId: string;
  transactionId: string;
  rowsAffected: number;
}

/** Server → Browser: write or transaction failed. */
export interface WriteErrorMessage extends DevToolsMessageBase {
  type: typeof MessageType.WRITE_ERROR;
  transactionId: string;
  writeId?: string;
  code: WriteErrorCode;
  message: string;
}

export type ClientMessage =
  | RegisterMessage
  | PongMessage
  | RefreshRequestMessage
  | ExportFailedMessage
  | BeginTransactionRequestMessage
  | CommitTransactionRequestMessage
  | RollbackTransactionRequestMessage
  | WriteRequestMessage
  | TransactionAckMessage
  | WriteAckMessage;

export type ServerMessage =
  | PingMessage
  | DeviceStatusMessage
  | BroadcastMessage
  | SyncDatabaseMessage
  | SyncStatusMessage
  | DatabaseReadyMessage
  | SyncErrorMessage
  | BeginTransactionMessage
  | CommitTransactionMessage
  | RollbackTransactionMessage
  | ExecuteWriteMessage
  | TransactionStatusMessage
  | WriteResultMessage
  | WriteErrorMessage;

export type DevToolsMessage = ClientMessage | ServerMessage;

export const DEVTOOLS_WS_PATH = '/ws';

export const DEFAULT_DEVTOOLS_PORT = 3847;

export const DEFAULT_DEVTOOLS_HOST = '0.0.0.0';

export const HEARTBEAT_INTERVAL_MS = 30_000;

export const HEARTBEAT_TIMEOUT_MS = 10_000;

export const SNAPSHOT_API_PATH = '/api/snapshots';

export const SYNC_TIMEOUT_MS = 60_000;

export const WRITE_TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000;

export const MAX_SNAPSHOT_BYTES = 50 * 1024 * 1024;

export function createMessage<T extends DevToolsMessageBase>(
  message: Omit<T, 'timestamp'>,
): T {
  return { ...message, timestamp: Date.now() } as T;
}

export function buildDevToolsHttpUrl(
  host = 'localhost',
  port = DEFAULT_DEVTOOLS_PORT,
): string {
  return `http://${host}:${port}`;
}

export function buildDevToolsWsUrl(
  host = 'localhost',
  port = DEFAULT_DEVTOOLS_PORT,
): string {
  return `ws://${host}:${port}${DEVTOOLS_WS_PATH}`;
}

export function buildSnapshotUrl(httpBaseUrl: string, syncId: string): string {
  const base = httpBaseUrl.replace(/\/$/, '');
  return `${base}${SNAPSHOT_API_PATH}/${syncId}`;
}

export function wsUrlToHttpUrl(wsUrl: string): string {
  const url = new URL(wsUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function hasMessageType(value: unknown): value is { type: string } {
  return typeof value === 'object' && value !== null && typeof (value as { type: unknown }).type === 'string';
}

export function isRegisterMessage(value: unknown): value is RegisterMessage {
  if (!hasMessageType(value) || value.type !== MessageType.REGISTER) {
    return false;
  }

  const message = value as RegisterMessage;
  return (
    message.role === DevToolsRole.MOBILE || message.role === DevToolsRole.BROWSER
  );
}

export function isPongMessage(value: unknown): value is PongMessage {
  if (!hasMessageType(value) || value.type !== MessageType.PONG) {
    return false;
  }

  const message = value as PongMessage;
  return typeof message.pingId === 'string';
}

export function isRefreshRequestMessage(value: unknown): value is RefreshRequestMessage {
  if (!hasMessageType(value) || value.type !== MessageType.REFRESH_REQUEST) {
    return false;
  }

  const message = value as RefreshRequestMessage;
  return typeof message.syncId === 'string' && typeof message.deviceId === 'string';
}

export function isExportFailedMessage(value: unknown): value is ExportFailedMessage {
  if (!hasMessageType(value) || value.type !== MessageType.EXPORT_FAILED) {
    return false;
  }

  const message = value as ExportFailedMessage;
  return typeof message.syncId === 'string' && typeof message.message === 'string';
}

export function isBeginTransactionRequestMessage(
  value: unknown,
): value is BeginTransactionRequestMessage {
  if (!hasMessageType(value) || value.type !== MessageType.BEGIN_TRANSACTION_REQUEST) {
    return false;
  }

  const message = value as BeginTransactionRequestMessage;
  return typeof message.transactionId === 'string' && typeof message.deviceId === 'string';
}

export function isCommitTransactionRequestMessage(
  value: unknown,
): value is CommitTransactionRequestMessage {
  if (!hasMessageType(value) || value.type !== MessageType.COMMIT_TRANSACTION_REQUEST) {
    return false;
  }

  const message = value as CommitTransactionRequestMessage;
  return typeof message.transactionId === 'string' && typeof message.deviceId === 'string';
}

export function isRollbackTransactionRequestMessage(
  value: unknown,
): value is RollbackTransactionRequestMessage {
  if (!hasMessageType(value) || value.type !== MessageType.ROLLBACK_TRANSACTION_REQUEST) {
    return false;
  }

  const message = value as RollbackTransactionRequestMessage;
  return typeof message.transactionId === 'string' && typeof message.deviceId === 'string';
}

export function isWriteRequestMessage(value: unknown): value is WriteRequestMessage {
  if (!hasMessageType(value) || value.type !== MessageType.WRITE_REQUEST) {
    return false;
  }

  const message = value as WriteRequestMessage;
  return (
    typeof message.writeId === 'string' &&
    typeof message.transactionId === 'string' &&
    typeof message.deviceId === 'string' &&
    typeof message.operation === 'object' &&
    message.operation !== null
  );
}

export function isTransactionAckMessage(value: unknown): value is TransactionAckMessage {
  if (!hasMessageType(value) || value.type !== MessageType.TRANSACTION_ACK) {
    return false;
  }

  const message = value as TransactionAckMessage;
  return (
    typeof message.transactionId === 'string' &&
    (message.action === 'begin' || message.action === 'commit' || message.action === 'rollback') &&
    typeof message.ok === 'boolean'
  );
}

export function isWriteAckMessage(value: unknown): value is WriteAckMessage {
  if (!hasMessageType(value) || value.type !== MessageType.WRITE_ACK) {
    return false;
  }

  const message = value as WriteAckMessage;
  return (
    typeof message.writeId === 'string' &&
    typeof message.transactionId === 'string' &&
    typeof message.ok === 'boolean'
  );
}

export function isClientMessage(value: unknown): value is ClientMessage {
  return (
    isRegisterMessage(value) ||
    isPongMessage(value) ||
    isRefreshRequestMessage(value) ||
    isExportFailedMessage(value) ||
    isBeginTransactionRequestMessage(value) ||
    isCommitTransactionRequestMessage(value) ||
    isRollbackTransactionRequestMessage(value) ||
    isWriteRequestMessage(value) ||
    isTransactionAckMessage(value) ||
    isWriteAckMessage(value)
  );
}

export function isPingMessage(value: unknown): value is PingMessage {
  if (!hasMessageType(value) || value.type !== MessageType.PING) {
    return false;
  }

  const message = value as PingMessage;
  return typeof message.pingId === 'string';
}

export function isDeviceStatusMessage(value: unknown): value is DeviceStatusMessage {
  if (!hasMessageType(value) || value.type !== MessageType.DEVICE_STATUS) {
    return false;
  }

  const message = value as DeviceStatusMessage;
  return typeof message.payload === 'object' && message.payload !== null;
}

export function isBroadcastMessage(value: unknown): value is BroadcastMessage {
  if (!hasMessageType(value) || value.type !== MessageType.BROADCAST) {
    return false;
  }

  return true;
}

export function isSyncDatabaseMessage(value: unknown): value is SyncDatabaseMessage {
  if (!hasMessageType(value) || value.type !== MessageType.SYNC_DATABASE) {
    return false;
  }

  const message = value as SyncDatabaseMessage;
  return typeof message.syncId === 'string' && typeof message.uploadUrl === 'string';
}

export function isSyncStatusMessage(value: unknown): value is SyncStatusMessage {
  if (!hasMessageType(value) || value.type !== MessageType.SYNC_STATUS) {
    return false;
  }

  const message = value as SyncStatusMessage;
  return (
    typeof message.syncId === 'string' &&
    typeof message.deviceId === 'string' &&
    typeof message.state === 'string'
  );
}

export function isDatabaseReadyMessage(value: unknown): value is DatabaseReadyMessage {
  if (!hasMessageType(value) || value.type !== MessageType.DATABASE_READY) {
    return false;
  }

  const message = value as DatabaseReadyMessage;
  return (
    typeof message.syncId === 'string' &&
    typeof message.deviceId === 'string' &&
    typeof message.size === 'number' &&
    typeof message.exportedAt === 'number' &&
    typeof message.downloadUrl === 'string'
  );
}

export function isSyncErrorMessage(value: unknown): value is SyncErrorMessage {
  if (!hasMessageType(value) || value.type !== MessageType.SYNC_ERROR) {
    return false;
  }

  const message = value as SyncErrorMessage;
  return typeof message.syncId === 'string' && typeof message.code === 'string';
}

export function isBeginTransactionMessage(value: unknown): value is BeginTransactionMessage {
  if (!hasMessageType(value) || value.type !== MessageType.BEGIN_TRANSACTION) {
    return false;
  }

  const message = value as BeginTransactionMessage;
  return typeof message.transactionId === 'string';
}

export function isCommitTransactionMessage(value: unknown): value is CommitTransactionMessage {
  if (!hasMessageType(value) || value.type !== MessageType.COMMIT_TRANSACTION) {
    return false;
  }

  const message = value as CommitTransactionMessage;
  return typeof message.transactionId === 'string';
}

export function isRollbackTransactionMessage(value: unknown): value is RollbackTransactionMessage {
  if (!hasMessageType(value) || value.type !== MessageType.ROLLBACK_TRANSACTION) {
    return false;
  }

  const message = value as RollbackTransactionMessage;
  return typeof message.transactionId === 'string';
}

export function isExecuteWriteMessage(value: unknown): value is ExecuteWriteMessage {
  if (!hasMessageType(value) || value.type !== MessageType.EXECUTE_WRITE) {
    return false;
  }

  const message = value as ExecuteWriteMessage;
  return (
    typeof message.writeId === 'string' &&
    typeof message.transactionId === 'string' &&
    typeof message.operation === 'object' &&
    message.operation !== null
  );
}

export function isTransactionStatusMessage(value: unknown): value is TransactionStatusMessage {
  if (!hasMessageType(value) || value.type !== MessageType.TRANSACTION_STATUS) {
    return false;
  }

  const message = value as TransactionStatusMessage;
  return (
    typeof message.transactionId === 'string' &&
    typeof message.deviceId === 'string' &&
    typeof message.state === 'string'
  );
}

export function isWriteResultMessage(value: unknown): value is WriteResultMessage {
  if (!hasMessageType(value) || value.type !== MessageType.WRITE_RESULT) {
    return false;
  }

  const message = value as WriteResultMessage;
  return (
    typeof message.writeId === 'string' &&
    typeof message.transactionId === 'string' &&
    typeof message.rowsAffected === 'number'
  );
}

export function isWriteErrorMessage(value: unknown): value is WriteErrorMessage {
  if (!hasMessageType(value) || value.type !== MessageType.WRITE_ERROR) {
    return false;
  }

  const message = value as WriteErrorMessage;
  return typeof message.transactionId === 'string' && typeof message.code === 'string';
}

export function isServerMessage(value: unknown): value is ServerMessage {
  return (
    isPingMessage(value) ||
    isDeviceStatusMessage(value) ||
    isBroadcastMessage(value) ||
    isSyncDatabaseMessage(value) ||
    isSyncStatusMessage(value) ||
    isDatabaseReadyMessage(value) ||
    isSyncErrorMessage(value) ||
    isBeginTransactionMessage(value) ||
    isCommitTransactionMessage(value) ||
    isRollbackTransactionMessage(value) ||
    isExecuteWriteMessage(value) ||
    isTransactionStatusMessage(value) ||
    isWriteResultMessage(value) ||
    isWriteErrorMessage(value)
  );
}
