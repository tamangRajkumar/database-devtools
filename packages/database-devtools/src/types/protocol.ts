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

export type ClientMessage = RegisterMessage | PongMessage;

export type ServerMessage = PingMessage | DeviceStatusMessage | BroadcastMessage;

export type DevToolsMessage = ClientMessage | ServerMessage;

export const DEVTOOLS_WS_PATH = '/ws';

export const DEFAULT_DEVTOOLS_PORT = 3847;

export const DEFAULT_DEVTOOLS_HOST = '0.0.0.0';

export const HEARTBEAT_INTERVAL_MS = 30_000;

export const HEARTBEAT_TIMEOUT_MS = 10_000;

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

export function isClientMessage(value: unknown): value is ClientMessage {
  return isRegisterMessage(value) || isPongMessage(value);
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

export function isServerMessage(value: unknown): value is ServerMessage {
  return isPingMessage(value) || isDeviceStatusMessage(value) || isBroadcastMessage(value);
}
