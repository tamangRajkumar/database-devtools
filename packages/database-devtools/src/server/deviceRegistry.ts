import type { DevToolsRole } from '../types/protocol.js';

export type DeviceRegistrySnapshot = {
  mobileConnected: boolean;
  browserConnected: boolean;
};

export class DeviceRegistry {
  private mobileCount = 0;
  private browserCount = 0;

  register(role: DevToolsRole): void {
    if (role === 'mobile') {
      this.mobileCount += 1;
      return;
    }

    this.browserCount += 1;
  }

  unregister(role: DevToolsRole): void {
    if (role === 'mobile') {
      this.mobileCount = Math.max(0, this.mobileCount - 1);
      return;
    }

    this.browserCount = Math.max(0, this.browserCount - 1);
  }

  snapshot(): DeviceRegistrySnapshot {
    return {
      mobileConnected: this.mobileCount > 0,
      browserConnected: this.browserCount > 0,
    };
  }
}
