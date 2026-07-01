import type { ConnectionManager } from './connectionManager.js';
import type { DeviceStatusPayload } from '../types/protocol.js';
import { DevToolsRole } from '../types/protocol.js';

export class DeviceRegistry {
  constructor(private readonly connectionManager: ConnectionManager) {}

  snapshot(): DeviceStatusPayload {
    const browsers = this.connectionManager
      .getByRole(DevToolsRole.BROWSER)
      .map((client) => ({
        connectionId: client.connectionId,
        connectedAt: client.connectedAt,
      }));

    const mobiles = this.connectionManager
      .getByRole(DevToolsRole.MOBILE)
      .map((client) => ({
        deviceId: client.deviceId ?? client.connectionId,
        connectionId: client.connectionId,
        connectedAt: client.connectedAt,
        metadata: client.metadata,
      }));

    return {
      browserCount: browsers.length,
      mobileCount: mobiles.length,
      browsers,
      mobiles,
    };
  }
}
