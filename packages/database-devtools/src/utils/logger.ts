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

  syncStarted(syncId: string, deviceId: string): void {
    log(CYAN, '↻', `Sync started ${DIM}(${syncId} → ${deviceId})${RESET}`);
  },

  syncUploaded(syncId: string, bytes: number): void {
    log(GREEN, '↻', `Snapshot uploaded ${DIM}(${syncId}, ${bytes} bytes)${RESET}`);
  },

  syncFailed(syncId: string, code: string, message: string): void {
    log(RED, '↻', `Sync failed ${DIM}(${syncId}: ${code})${RESET} ${message}`);
  },

  error(message: string): void {
    log(RED, '✗', message);
  },
};
