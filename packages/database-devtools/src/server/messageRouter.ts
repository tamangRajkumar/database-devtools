import type { WebSocket } from 'ws';
import {
  createMessage,
  DevToolsRole,
  MessageType,
  type BroadcastMessage,
  type DeviceStatusMessage,
  type ServerMessage,
} from '../types/protocol';
import { logger } from '../utils/logger';
import type { ConnectionManager } from './connectionManager';
import type { DeviceRegistry } from './deviceRegistry';

export type OutboundMessage = ServerMessage;

export class MessageRouter {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly deviceRegistry: DeviceRegistry,
  ) {}

  sendToSocket(socket: WebSocket, message: OutboundMessage): void {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  sendToBrowser(connectionId: string, message: OutboundMessage): void {
    const client = this.connectionManager.getByConnectionId(connectionId);

    if (client?.role === DevToolsRole.BROWSER) {
      this.sendToSocket(client.socket, message);
    }
  }

  sendToMobile(deviceId: string, message: OutboundMessage): void {
    const client = this.connectionManager.getByDeviceId(deviceId);

    if (client?.role === DevToolsRole.MOBILE) {
      this.sendToSocket(client.socket, message);
    }
  }

  broadcastToBrowsers(message: OutboundMessage): void {
    for (const client of this.connectionManager.getByRole(DevToolsRole.BROWSER)) {
      this.sendToSocket(client.socket, message);
    }

    logger.broadcastSent('browsers');
  }

  broadcastToMobiles(message: OutboundMessage): void {
    for (const client of this.connectionManager.getByRole(DevToolsRole.MOBILE)) {
      this.sendToSocket(client.socket, message);
    }

    logger.broadcastSent('mobiles');
  }

  broadcastToAll(message: OutboundMessage): void {
    for (const client of this.connectionManager.getAll()) {
      this.sendToSocket(client.socket, message);
    }

    logger.broadcastSent('all');
  }

  broadcast(message: unknown, target: 'browsers' | 'mobiles' | 'all' = 'all'): void {
    const broadcastMessage = createMessage<BroadcastMessage>({
      type: MessageType.BROADCAST,
      payload: message,
    });

    if (target === 'browsers') {
      this.broadcastToBrowsers(broadcastMessage);
      return;
    }

    if (target === 'mobiles') {
      this.broadcastToMobiles(broadcastMessage);
      return;
    }

    this.broadcastToAll(broadcastMessage);
  }

  broadcastDeviceStatus(): void {
    const message = createMessage<DeviceStatusMessage>({
      type: MessageType.DEVICE_STATUS,
      payload: this.deviceRegistry.snapshot(),
    });

    this.broadcastToAll(message);
  }
}
