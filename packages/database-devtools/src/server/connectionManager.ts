import type { WebSocket } from 'ws';
import type { DevToolsRole, DeviceMetadata } from '../types/protocol';
import { generateConnectionId } from '../utils/ids';

export type ConnectedClient = {
  socket: WebSocket;
  connectionId: string;
  role: DevToolsRole;
  deviceId?: string;
  metadata?: DeviceMetadata;
  connectedAt: number;
  lastPongAt: number;
};

export type RegisterClientInput = {
  socket: WebSocket;
  role: DevToolsRole;
  deviceId?: string;
  metadata?: DeviceMetadata;
};

export class ConnectionManager {
  private readonly clients = new Map<WebSocket, ConnectedClient>();

  add(input: RegisterClientInput): ConnectedClient {
    const now = Date.now();
    const client: ConnectedClient = {
      socket: input.socket,
      connectionId: generateConnectionId(),
      role: input.role,
      deviceId: input.deviceId,
      metadata: input.metadata,
      connectedAt: now,
      lastPongAt: now,
    };

    this.clients.set(input.socket, client);
    return client;
  }

  remove(socket: WebSocket): ConnectedClient | undefined {
    const client = this.clients.get(socket);

    if (client) {
      this.clients.delete(socket);
    }

    return client;
  }

  getBySocket(socket: WebSocket): ConnectedClient | undefined {
    return this.clients.get(socket);
  }

  getByConnectionId(connectionId: string): ConnectedClient | undefined {
    for (const client of this.clients.values()) {
      if (client.connectionId === connectionId) {
        return client;
      }
    }

    return undefined;
  }

  getByDeviceId(deviceId: string): ConnectedClient | undefined {
    for (const client of this.clients.values()) {
      if (client.deviceId === deviceId) {
        return client;
      }
    }

    return undefined;
  }

  getByRole(role: DevToolsRole): ConnectedClient[] {
    return [...this.clients.values()].filter((client) => client.role === role);
  }

  updateLastPong(socket: WebSocket): void {
    const client = this.clients.get(socket);

    if (client) {
      client.lastPongAt = Date.now();
    }
  }

  getAll(): ConnectedClient[] {
    return [...this.clients.values()];
  }
}
