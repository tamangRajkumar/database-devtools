import {
  createMessage,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  MessageType,
  type PingMessage,
} from '../types/protocol.js';
import { generatePingId } from '../utils/ids.js';
import { logger } from '../utils/logger.js';
import type { ConnectionManager } from './connectionManager.js';
import type { MessageRouter } from './messageRouter.js';

export class Heartbeat {
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly router: MessageRouter,
  ) {}

  start(): void {
    if (this.interval !== null) {
      return;
    }

    this.interval = setInterval(() => {
      this.pingAll();
      this.removeStaleConnections();
    }, HEARTBEAT_INTERVAL_MS);
  }

  stop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private pingAll(): void {
    const pingId = generatePingId();
    const message = createMessage<PingMessage>({
      type: MessageType.PING,
      pingId,
    });

    for (const client of this.connectionManager.getAll()) {
      this.router.sendToSocket(client.socket, message);
    }
  }

  private removeStaleConnections(): void {
    const now = Date.now();

    for (const client of this.connectionManager.getAll()) {
      if (now - client.lastPongAt > HEARTBEAT_INTERVAL_MS + HEARTBEAT_TIMEOUT_MS) {
        logger.heartbeatTimeout(client.connectionId);
        client.socket.terminate();
        this.connectionManager.remove(client.socket);
      }
    }
  }
}
