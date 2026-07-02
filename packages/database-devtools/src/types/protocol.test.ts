import { describe, expect, it } from 'vitest';
import {
  isExportSnapshotRequestMessage,
  isRefreshRequestMessage,
  isRegisterMessage,
  isSnapshotReadyMessage,
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
        deviceId: 'device-1',
        refreshType: 'snapshot',
      }),
    ).toBe(true);

    expect(
      isRefreshRequestMessage({
        type: MessageType.REFRESH_REQUEST,
        timestamp: Date.now(),
        deviceId: 'device-1',
        refreshType: 'other',
      }),
    ).toBe(false);
  });

  it('validates export snapshot request messages', () => {
    expect(
      isExportSnapshotRequestMessage({
        type: MessageType.EXPORT_SNAPSHOT_REQUEST,
        timestamp: Date.now(),
        refreshType: 'snapshot',
      }),
    ).toBe(true);
  });

  it('validates snapshot ready messages with kind and mimeType', () => {
    expect(
      isSnapshotReadyMessage({
        type: MessageType.SNAPSHOT_READY,
        timestamp: Date.now(),
        deviceId: 'device-1',
        size: 128,
        exportedAt: Date.now(),
        kind: 'sqlite',
        mimeType: 'application/x-sqlite3',
        databaseName: 'booking.db',
      }),
    ).toBe(true);

    expect(
      isSnapshotReadyMessage({
        type: MessageType.SNAPSHOT_READY,
        timestamp: Date.now(),
        deviceId: 'device-1',
        size: 128,
        exportedAt: Date.now(),
      }),
    ).toBe(false);
  });
});
