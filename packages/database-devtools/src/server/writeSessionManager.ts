import type { TransactionStatusState } from '../types/protocol';
import { WRITE_TRANSACTION_TIMEOUT_MS } from '../types/protocol';

export type WriteSession = {
  transactionId: string;
  deviceId: string;
  browserConnectionId: string;
  state: TransactionStatusState;
  pendingWrites: number;
  createdAt: number;
};

export class WriteSessionManager {
  private readonly sessions = new Map<string, WriteSession>();
  private readonly activeByDevice = new Map<string, string>();

  create(input: {
    transactionId: string;
    deviceId: string;
    browserConnectionId: string;
  }): WriteSession {
    const session: WriteSession = {
      transactionId: input.transactionId,
      deviceId: input.deviceId,
      browserConnectionId: input.browserConnectionId,
      state: 'opening',
      pendingWrites: 0,
      createdAt: Date.now(),
    };

    this.sessions.set(input.transactionId, session);
    this.activeByDevice.set(input.deviceId, input.transactionId);
    return session;
  }

  get(transactionId: string): WriteSession | undefined {
    return this.sessions.get(transactionId);
  }

  getActiveForDevice(deviceId: string): WriteSession | undefined {
    const transactionId = this.activeByDevice.get(deviceId);

    if (!transactionId) {
      return undefined;
    }

    return this.sessions.get(transactionId);
  }

  setState(transactionId: string, state: TransactionStatusState): WriteSession | undefined {
    const session = this.sessions.get(transactionId);

    if (!session) {
      return undefined;
    }

    session.state = state;
    return session;
  }

  incrementPendingWrites(transactionId: string): WriteSession | undefined {
    const session = this.sessions.get(transactionId);

    if (!session) {
      return undefined;
    }

    session.pendingWrites += 1;
    return session;
  }

  decrementPendingWrites(transactionId: string): WriteSession | undefined {
    const session = this.sessions.get(transactionId);

    if (!session) {
      return undefined;
    }

    session.pendingWrites = Math.max(0, session.pendingWrites - 1);
    return session;
  }

  remove(transactionId: string): void {
    const session = this.sessions.get(transactionId);

    if (!session) {
      return;
    }

    if (this.activeByDevice.get(session.deviceId) === transactionId) {
      this.activeByDevice.delete(session.deviceId);
    }

    this.sessions.delete(transactionId);
  }

  getExpired(now = Date.now()): WriteSession[] {
    return [...this.sessions.values()].filter((session) => {
      if (session.state === 'idle' || session.state === 'failed') {
        return false;
      }

      return now - session.createdAt >= WRITE_TRANSACTION_TIMEOUT_MS;
    });
  }
}
