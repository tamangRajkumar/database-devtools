import type { SyncState } from '../types/protocol';
import { SYNC_TIMEOUT_MS } from '../types/protocol';

export type SyncSession = {
  syncId: string;
  deviceId: string;
  browserConnectionId: string;
  state: SyncState;
  snapshot?: Buffer;
  kind?: string;
  mimeType?: string;
  createdAt: number;
  exportedAt?: number;
};

export class SyncSessionManager {
  private readonly sessions = new Map<string, SyncSession>();
  private readonly activeByDevice = new Map<string, string>();

  create(input: {
    syncId: string;
    deviceId: string;
    browserConnectionId: string;
  }): SyncSession {
    const session: SyncSession = {
      syncId: input.syncId,
      deviceId: input.deviceId,
      browserConnectionId: input.browserConnectionId,
      state: 'requested',
      createdAt: Date.now(),
    };

    this.sessions.set(input.syncId, session);
    this.activeByDevice.set(input.deviceId, input.syncId);
    return session;
  }

  get(syncId: string): SyncSession | undefined {
    return this.sessions.get(syncId);
  }

  getActiveForDevice(deviceId: string): SyncSession | undefined {
    const syncId = this.activeByDevice.get(deviceId);

    if (!syncId) {
      return undefined;
    }

    return this.sessions.get(syncId);
  }

  setState(syncId: string, state: SyncState): SyncSession | undefined {
    const session = this.sessions.get(syncId);

    if (!session) {
      return undefined;
    }

    session.state = state;
    return session;
  }

  storeSnapshot(
    syncId: string,
    snapshot: Buffer,
    metadata?: { kind?: string; mimeType?: string },
  ): SyncSession | undefined {
    const session = this.sessions.get(syncId);

    if (!session) {
      return undefined;
    }

    session.snapshot = snapshot;
    session.exportedAt = Date.now();
    session.state = 'ready';
    session.kind = metadata?.kind ?? session.kind;
    session.mimeType = metadata?.mimeType ?? session.mimeType;
    return session;
  }

  remove(syncId: string): void {
    const session = this.sessions.get(syncId);

    if (!session) {
      return;
    }

    if (this.activeByDevice.get(session.deviceId) === syncId) {
      this.activeByDevice.delete(session.deviceId);
    }

    this.sessions.delete(syncId);
  }

  getExpired(now = Date.now()): SyncSession[] {
    return [...this.sessions.values()].filter((session) => {
      if (session.state === 'ready' || session.state === 'failed' || session.state === 'timeout') {
        return false;
      }

      return now - session.createdAt >= SYNC_TIMEOUT_MS;
    });
  }
}
