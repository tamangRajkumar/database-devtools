/** Client and server roles on the WebSocket hub. */
export type DevToolsRole = 'mobile' | 'browser';

/** Messages sent from clients to the server. */
export type ClientMessage = {
  type: 'register';
  payload: {
    role: DevToolsRole;
  };
};

/** Messages broadcast from server to clients. */
export type ServerMessage = {
  type: 'deviceStatus';
  payload: {
    mobileConnected: boolean;
    browserConnected: boolean;
  };
};

export type DevToolsMessage = ClientMessage | ServerMessage;

export const DEVTOOLS_WS_PATH = '/ws';

export const DEFAULT_DEVTOOLS_PORT = 3847;

export const DEFAULT_DEVTOOLS_HOST = '0.0.0.0';

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
  const protocol = host === 'localhost' || host === '127.0.0.1' ? 'ws' : 'ws';
  return `${protocol}://${host}:${port}${DEVTOOLS_WS_PATH}`;
}

export function isClientMessage(value: unknown): value is ClientMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = value as ClientMessage;
  return message.type === 'register' && typeof message.payload?.role === 'string';
}

export function isServerMessage(value: unknown): value is ServerMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = value as ServerMessage;
  return message.type === 'deviceStatus' && typeof message.payload === 'object';
}
