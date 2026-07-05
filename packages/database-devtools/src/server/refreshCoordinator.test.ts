import { describe, expect, it, vi } from 'vitest';
import { MessageType } from '../types/protocol';
import { RefreshCoordinator } from './refreshCoordinator';
import { PendingRefreshStore } from './pendingRefreshStore';
import { SnapshotStore } from './snapshotStore';

function createMocks() {
  const sentToMobile: unknown[] = [];
  const sentToBrowsers: unknown[] = [];
  const sentToSocket: unknown[] = [];

  const connectionManager = {
    getBySocket: vi.fn(),
    getByDeviceId: vi.fn(),
    getByConnectionId: vi.fn(),
  };

  const router = {
    sendToMobile: vi.fn((_deviceId: string, message: unknown) => {
      sentToMobile.push(message);
    }),
    sendToBrowser: vi.fn((_connectionId: string, message: unknown) => {
      sentToBrowsers.push(message);
    }),
    broadcastToBrowsers: vi.fn((message: unknown) => {
      sentToBrowsers.push(message);
    }),
    sendToSocket: vi.fn((_socket: unknown, message: unknown) => {
      sentToSocket.push(message);
    }),
  };

  return {
    connectionManager,
    router,
    sentToMobile,
    sentToBrowsers,
    sentToSocket,
  };
}

describe('RefreshCoordinator mobile export', () => {
  it('starts mobile export and requests upload from device', () => {
    const { connectionManager, router, sentToMobile } = createMocks();
    const pending = new PendingRefreshStore();
    const snapshots = new SnapshotStore();
    const mobileSocket = { readyState: 1 };

    connectionManager.getBySocket.mockReturnValue({
      role: 'mobile',
      deviceId: 'device-1',
      connectionId: 'mobile-1',
      socket: mobileSocket,
    });

    const coordinator = new RefreshCoordinator(
      connectionManager as never,
      router as never,
      pending,
      snapshots,
    );

    coordinator.handleMobileExportRequest(mobileSocket as never, {
      type: MessageType.EXPORT_SNAPSHOT_REQUEST,
      timestamp: Date.now(),
      refreshType: 'snapshot',
    });

    expect(pending.has('device-1')).toBe(true);
    expect(sentToMobile).toHaveLength(1);
    expect(sentToMobile[0]).toMatchObject({
      type: MessageType.SNAPSHOT_UPLOAD_REQUESTED,
      deviceId: 'device-1',
    });
  });

  it('broadcasts snapshotReady to browsers after mobile upload', async () => {
    const { connectionManager, router, sentToBrowsers } = createMocks();
    const pending = new PendingRefreshStore();
    const snapshots = new SnapshotStore();
    const mobileSocket = { readyState: 1 };

    connectionManager.getBySocket.mockReturnValue({
      role: 'mobile',
      deviceId: 'device-1',
      connectionId: 'mobile-1',
      socket: mobileSocket,
    });

    const coordinator = new RefreshCoordinator(
      connectionManager as never,
      router as never,
      pending,
      snapshots,
    );

    coordinator.handleMobileExportRequest(mobileSocket as never, {
      type: MessageType.EXPORT_SNAPSHOT_REQUEST,
      timestamp: Date.now(),
      refreshType: 'snapshot',
    });

    const result = await coordinator.handleSnapshotUpload('device-1', Buffer.from([1, 2, 3]), {
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      databaseName: 'booking.db',
    });

    expect(result.ok).toBe(true);
    expect(sentToBrowsers).toHaveLength(1);
    expect(sentToBrowsers[0]).toMatchObject({
      type: MessageType.SNAPSHOT_READY,
      deviceId: 'device-1',
      size: 3,
      databaseName: 'booking.db',
    });
    expect(pending.has('device-1')).toBe(false);
  });

  it('rejects duplicate mobile export while pending', () => {
    const { connectionManager, router, sentToSocket } = createMocks();
    const pending = new PendingRefreshStore();
    const snapshots = new SnapshotStore();
    const mobileSocket = { readyState: 1 };

    connectionManager.getBySocket.mockReturnValue({
      role: 'mobile',
      deviceId: 'device-1',
      connectionId: 'mobile-1',
      socket: mobileSocket,
    });

    const coordinator = new RefreshCoordinator(
      connectionManager as never,
      router as never,
      pending,
      snapshots,
    );

    const request = {
      type: MessageType.EXPORT_SNAPSHOT_REQUEST,
      timestamp: Date.now(),
      refreshType: 'snapshot' as const,
    };

    coordinator.handleMobileExportRequest(mobileSocket as never, request);
    coordinator.handleMobileExportRequest(mobileSocket as never, request);

    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0]).toMatchObject({
      type: MessageType.EXPORT_SNAPSHOT_ERROR,
      code: 'REFRESH_IN_PROGRESS',
    });
  });
});
