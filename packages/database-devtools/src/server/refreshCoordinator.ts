import type { WebSocket } from 'ws';
import {
  buildSnapshotUrl,
  createMessage,
  DevToolsRole,
  MessageType,
  type DatabaseReadyMessage,
  type RefreshRequestMessage,
  type SyncDatabaseMessage,
  type SyncErrorCode,
  type SyncErrorMessage,
  type SyncState,
  type SyncStatusMessage,
} from '../types/protocol';
import { logger } from '../utils/logger';
import type { ConnectionManager } from './connectionManager';
import type { MessageRouter } from './messageRouter';
import type { SyncSessionManager } from './syncSessionManager';

export class RefreshCoordinator {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly router: MessageRouter,
    private readonly sessions: SyncSessionManager,
    private readonly httpBaseUrl: string,
  ) {}

  handleRefreshRequest(browserSocket: WebSocket, message: RefreshRequestMessage): void {
    const browser = this.connectionManager.getBySocket(browserSocket);

    if (!browser || browser.role !== DevToolsRole.BROWSER) {
      return;
    }

    const mobile = this.connectionManager.getByDeviceId(message.deviceId);

    if (!mobile) {
      this.sendSyncError(browser.connectionId, {
        syncId: message.syncId,
        deviceId: message.deviceId,
        code: 'DEVICE_OFFLINE',
        message: `Device ${message.deviceId} is not connected`,
      });
      return;
    }

    if (this.sessions.getActiveForDevice(message.deviceId)) {
      this.sendSyncError(browser.connectionId, {
        syncId: message.syncId,
        deviceId: message.deviceId,
        code: 'SYNC_IN_PROGRESS',
        message: 'A refresh is already in progress for this device',
      });
      return;
    }

    this.sessions.create({
      syncId: message.syncId,
      deviceId: message.deviceId,
      browserConnectionId: browser.connectionId,
    });

    logger.syncStarted(message.syncId, message.deviceId);

    this.sendSyncStatus(browser.connectionId, message.syncId, message.deviceId, 'requested');
    this.sendSyncStatus(browser.connectionId, message.syncId, message.deviceId, 'exporting');

    this.sessions.setState(message.syncId, 'exporting');

    this.router.sendToMobile(
      message.deviceId,
      createMessage<SyncDatabaseMessage>({
        type: MessageType.SYNC_DATABASE,
        syncId: message.syncId,
        uploadUrl: buildSnapshotUrl(this.httpBaseUrl, message.syncId),
      }),
    );
  }

  handleExportFailed(syncId: string, errorMessage: string): void {
    const session = this.sessions.get(syncId);

    if (!session || session.state === 'ready' || session.state === 'failed') {
      return;
    }

    this.failSession(syncId, 'EXPORT_FAILED', errorMessage);
  }

  handleSnapshotUpload(
    syncId: string,
    body: Buffer,
    metadata?: { kind?: string; mimeType?: string },
  ): { ok: true } | { ok: false; code: SyncErrorCode } {
    const session = this.sessions.get(syncId);

    if (!session) {
      return { ok: false, code: 'SNAPSHOT_NOT_FOUND' };
    }

    if (session.state !== 'exporting' && session.state !== 'uploading') {
      return { ok: false, code: 'INVALID_REQUEST' };
    }

    this.sendSyncStatus(session.browserConnectionId, syncId, session.deviceId, 'uploading');
    this.sessions.setState(syncId, 'uploading');

    const stored = this.sessions.storeSnapshot(syncId, body, metadata);

    if (!stored?.snapshot || stored.exportedAt === undefined) {
      this.failSession(syncId, 'UPLOAD_FAILED', 'Failed to store snapshot');
      return { ok: false, code: 'UPLOAD_FAILED' };
    }

    logger.syncUploaded(syncId, body.byteLength);

    this.sendSyncStatus(session.browserConnectionId, syncId, session.deviceId, 'ready');

    const downloadUrl = buildSnapshotUrl(this.httpBaseUrl, syncId);
    const readyMessage = createMessage<DatabaseReadyMessage>({
      type: MessageType.DATABASE_READY,
      syncId,
      deviceId: session.deviceId,
      size: body.byteLength,
      exportedAt: stored.exportedAt,
      downloadUrl,
      kind: stored.kind ?? 'sqlite',
      mimeType: stored.mimeType ?? 'application/x-sqlite3',
    });

    this.router.sendToBrowser(session.browserConnectionId, readyMessage);
    return { ok: true };
  }

  getSnapshot(syncId: string): Buffer | undefined {
    return this.sessions.get(syncId)?.snapshot;
  }

  checkTimeouts(): void {
    for (const session of this.sessions.getExpired()) {
      this.failSession(session.syncId, 'TIMEOUT', 'Sync timed out waiting for device upload');
    }
  }

  private failSession(syncId: string, code: SyncErrorCode, message: string): void {
    const session = this.sessions.get(syncId);

    if (!session) {
      return;
    }

    this.sessions.setState(syncId, code === 'TIMEOUT' ? 'timeout' : 'failed');
    logger.syncFailed(syncId, code, message);

    this.sendSyncError(session.browserConnectionId, {
      syncId,
      deviceId: session.deviceId,
      code,
      message,
    });

    this.sessions.remove(syncId);
  }

  private sendSyncStatus(
    browserConnectionId: string,
    syncId: string,
    deviceId: string,
    state: SyncState,
  ): void {
    const message = createMessage<SyncStatusMessage>({
      type: MessageType.SYNC_STATUS,
      syncId,
      deviceId,
      state,
    });

    this.router.sendToBrowser(browserConnectionId, message);
  }

  private sendSyncError(
    browserConnectionId: string,
    input: {
      syncId: string;
      deviceId?: string;
      code: SyncErrorCode;
      message: string;
    },
  ): void {
    const message = createMessage<SyncErrorMessage>({
      type: MessageType.SYNC_ERROR,
      syncId: input.syncId,
      deviceId: input.deviceId,
      code: input.code,
      message: input.message,
    });

    this.router.sendToBrowser(browserConnectionId, message);
    logger.syncFailed(input.syncId, input.code, input.message);
  }
}
