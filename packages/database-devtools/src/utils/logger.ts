const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

const PREFIX = `${DIM}[database-devtools]${RESET}`;

function log(color: string, symbol: string, message: string): void {
  console.log(`${PREFIX} ${color}${symbol}${RESET} ${message}`);
}

export const logger = {
  browserConnected(connectionId?: string): void {
    const suffix = connectionId ? ` ${DIM}(${connectionId})${RESET}` : '';
    log(GREEN, '✓', `Browser Connected${suffix}`);
  },

  browserDisconnected(connectionId?: string): void {
    const suffix = connectionId ? ` ${DIM}(${connectionId})${RESET}` : '';
    log(YELLOW, '✓', `Browser Disconnected${suffix}`);
  },

  mobileConnected(deviceId?: string): void {
    const suffix = deviceId ? ` ${DIM}(deviceId: ${deviceId})${RESET}` : '';
    log(GREEN, '✓', `Mobile Connected${suffix}`);
  },

  mobileDisconnected(deviceId?: string): void {
    const suffix = deviceId ? ` ${DIM}(deviceId: ${deviceId})${RESET}` : '';
    log(YELLOW, '✓', `Mobile Disconnected${suffix}`);
  },

  broadcastSent(target?: string): void {
    const suffix = target ? ` ${DIM}→ ${target}${RESET}` : '';
    log(CYAN, '✓', `Broadcast Sent${suffix}`);
  },

  serverStarted(url: string, wsUrl: string): void {
    log(GREEN, '✓', `Server started at ${url}`);
    log(GREEN, '✓', `WebSocket endpoint ${wsUrl}`);
  },

  heartbeatTimeout(connectionId: string): void {
    log(RED, '✓', `Heartbeat timeout — removing ${connectionId}`);
  },

  refreshStarted(deviceId: string): void {
    log(CYAN, '↻', `Refresh started ${DIM}(${deviceId})${RESET}`);
  },

  refreshUploaded(deviceId: string, bytes: number): void {
    log(GREEN, '↻', `Snapshot uploaded ${DIM}(${deviceId}, ${bytes} bytes)${RESET}`);
  },

  refreshFailed(deviceId: string, code: string, message: string): void {
    log(RED, '↻', `Refresh failed ${DIM}(${deviceId}: ${code})${RESET} ${message}`);
  },

  /** @deprecated Use refreshStarted */
  syncStarted(syncId: string, deviceId: string): void {
    this.refreshStarted(deviceId);
  },

  /** @deprecated Use refreshUploaded */
  syncUploaded(syncId: string, bytes: number): void {
    this.refreshUploaded(syncId, bytes);
  },

  /** @deprecated Use refreshFailed */
  syncFailed(syncId: string, code: string, message: string): void {
    this.refreshFailed(syncId, code, message);
  },

  error(message: string): void {
    log(RED, '✗', message);
  },
};
