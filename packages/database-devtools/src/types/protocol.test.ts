import { describe, expect, it } from 'vitest';
import {
  isDatabaseReadyMessage,
  isRefreshRequestMessage,
  isRegisterMessage,
  MessageType,
} from './protocol';

describe('protocol type guards', () => {
  it('validates register messages', () => {
    expect(
      isRegisterMessage({
        type: MessageType.REGISTER,
        timestamp: Date.now(),
        role: 'mobile',
        deviceId: 'device-1',
      }),
    ).toBe(true);

    expect(
      isRegisterMessage({
        type: MessageType.REGISTER,
        timestamp: Date.now(),
        role: 'invalid',
      }),
    ).toBe(false);
  });

  it('validates refresh request messages', () => {
    expect(
      isRefreshRequestMessage({
        type: MessageType.REFRESH_REQUEST,
        timestamp: Date.now(),
        syncId: 'sync-1',
        deviceId: 'device-1',
      }),
    ).toBe(true);
  });

  it('validates database ready messages with kind and mimeType', () => {
    expect(
      isDatabaseReadyMessage({
        type: MessageType.DATABASE_READY,
        timestamp: Date.now(),
        syncId: 'sync-1',
        deviceId: 'device-1',
        size: 128,
        exportedAt: Date.now(),
        downloadUrl: 'http://localhost/snap',
        kind: 'sqlite',
        mimeType: 'application/x-sqlite3',
      }),
    ).toBe(true);

    expect(
      isDatabaseReadyMessage({
        type: MessageType.DATABASE_READY,
        timestamp: Date.now(),
        syncId: 'sync-1',
        deviceId: 'device-1',
        size: 128,
        exportedAt: Date.now(),
        downloadUrl: 'http://localhost/snap',
      }),
    ).toBe(false);
  });
});
