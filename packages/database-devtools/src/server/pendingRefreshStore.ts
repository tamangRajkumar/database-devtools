import type { RefreshInitiator, RefreshType } from '../types/protocol';
import { REFRESH_TIMEOUT_MS } from '../types/protocol';

export type PendingRefresh = {
  deviceId: string;
  refreshType: RefreshType;
  startedAt: number;
  initiator: RefreshInitiator;
  browserConnectionId?: string;
  notifyAllBrowsers?: boolean;
};

export class PendingRefreshStore {
  private readonly pendingByDevice = new Map<string, PendingRefresh>();

  create(input: PendingRefresh): void {
    this.pendingByDevice.set(input.deviceId, input);
  }

  get(deviceId: string): PendingRefresh | undefined {
    return this.pendingByDevice.get(deviceId);
  }

  has(deviceId: string): boolean {
    return this.pendingByDevice.has(deviceId);
  }

  remove(deviceId: string): void {
    this.pendingByDevice.delete(deviceId);
  }

  getExpired(now = Date.now()): PendingRefresh[] {
    return [...this.pendingByDevice.values()].filter(
      (pending) => now - pending.startedAt >= REFRESH_TIMEOUT_MS,
    );
  }
}
