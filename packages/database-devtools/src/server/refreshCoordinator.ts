import type { WebSocket } from 'ws';
import {
  createMessage,
  DevToolsRole,
  MessageType,
  type ExportSnapshotErrorMessage,
  type ExportSnapshotRequestMessage,
  type RefreshErrorCode,
  type RefreshErrorMessage,
  type RefreshRequestMessage,
  type RefreshState,
  type RefreshStatusMessage,
  type SnapshotReadyMessage,
  type SnapshotUploadRequestedMessage,
} from '../types/protocol';
import { logger } from '../utils/logger';
import type { ConnectionManager } from './connectionManager';
import type { MessageRouter } from './messageRouter';
import type { PendingRefreshStore } from './pendingRefreshStore';
import type { SnapshotFileStore } from './snapshotFileStore';
import type { SnapshotStore } from './snapshotStore';

export class RefreshCoordinator {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly router: MessageRouter,
    private readonly pending: PendingRefreshStore,
    private readonly snapshots: SnapshotStore,
    private readonly snapshotFiles?: SnapshotFileStore,
  ) {}

  handleRefreshRequest(browserSocket: WebSocket, message: RefreshRequestMessage): void {
    const browser = this.connectionManager.getBySocket(browserSocket);

    if (!browser || browser.role !== DevToolsRole.BROWSER) {
      return;
    }

    if (message.refreshType !== 'snapshot') {
      this.sendRefreshError(browser.connectionId, {
        deviceId: message.deviceId,
        code: 'INVALID_REQUEST',
        message: `Unsupported refresh type: ${message.refreshType}`,
      });
      return;
    }

    const mobile = this.connectionManager.getByDeviceId(message.deviceId);

    if (!mobile) {
      this.sendRefreshError(browser.connectionId, {
        deviceId: message.deviceId,
        code: 'DEVICE_OFFLINE',
        message: `Device ${message.deviceId} is not connected`,
      });
      return;
    }

    if (this.pending.has(message.deviceId)) {
      this.sendRefreshError(browser.connectionId, {
        deviceId: message.deviceId,
        code: 'REFRESH_IN_PROGRESS',
        message: 'A refresh is already in progress for this device',
      });
      return;
    }

    this.pending.create({
      deviceId: message.deviceId,
      initiator: 'browser',
      browserConnectionId: browser.connectionId,
      refreshType: message.refreshType,
      startedAt: Date.now(),
    });

    logger.refreshStarted(message.deviceId);

    this.sendRefreshStatus(browser.connectionId, message.deviceId, 'requested');
    this.sendRefreshStatus(browser.connectionId, message.deviceId, 'exporting');

    this.requestMobileUpload(message.deviceId, message.refreshType);
  }

  handleMobileExportRequest(mobileSocket: WebSocket, message: ExportSnapshotRequestMessage): void {
    const mobile = this.connectionManager.getBySocket(mobileSocket);

    if (!mobile || mobile.role !== DevToolsRole.MOBILE || !mobile.deviceId) {
      return;
    }

    if (message.refreshType !== 'snapshot') {
      this.sendExportSnapshotError(mobileSocket, {
        code: 'INVALID_REQUEST',
        message: `Unsupported refresh type: ${message.refreshType}`,
      });
      return;
    }

    if (this.pending.has(mobile.deviceId)) {
      this.sendExportSnapshotError(mobileSocket, {
        code: 'REFRESH_IN_PROGRESS',
        message: 'An export is already in progress for this device',
      });
      return;
    }

    this.pending.create({
      deviceId: mobile.deviceId,
      initiator: 'mobile',
      notifyAllBrowsers: true,
      refreshType: message.refreshType,
      startedAt: Date.now(),
    });

    logger.refreshStarted(mobile.deviceId);

    this.requestMobileUpload(mobile.deviceId, message.refreshType);
  }

  async handleSnapshotUpload(
    deviceId: string,
    body: Buffer,
    metadata?: { kind?: string; mimeType?: string; databaseName?: string },
  ): Promise<{ ok: true; stored: SnapshotReadyMessage } | { ok: false; code: RefreshErrorCode }> {
    const pending = this.pending.get(deviceId);

    if (!pending) {
      return { ok: false, code: 'SNAPSHOT_NOT_FOUND' };
    }

    if (pending.browserConnectionId) {
      this.sendRefreshStatus(pending.browserConnectionId, deviceId, 'uploading');
    }

    const stored = this.snapshots.set(deviceId, body, {
      kind: metadata?.kind ?? 'sqlite',
      mimeType: metadata?.mimeType ?? 'application/x-sqlite3',
      databaseName: metadata?.databaseName,
    });

    await this.snapshotFiles?.persistDeviceSnapshot({
      deviceId,
      bytes: body,
      kind: stored.kind,
      mimeType: stored.mimeType,
      databaseName: stored.databaseName,
    });

    logger.refreshUploaded(deviceId, body.byteLength);

    const readyMessage = createMessage<SnapshotReadyMessage>({
      type: MessageType.SNAPSHOT_READY,
      deviceId,
      size: body.byteLength,
      exportedAt: stored.exportedAt,
      kind: stored.kind,
      mimeType: stored.mimeType,
      ...(stored.databaseName ? { databaseName: stored.databaseName } : {}),
    });

    if (pending.notifyAllBrowsers) {
      this.router.broadcastToBrowsers(readyMessage);
    } else if (pending.browserConnectionId) {
      this.sendRefreshStatus(pending.browserConnectionId, deviceId, 'ready');
      this.router.sendToBrowser(pending.browserConnectionId, readyMessage);
    }

    this.pending.remove(deviceId);

    return { ok: true, stored: readyMessage };
  }

  getSnapshot(deviceId: string): Buffer | undefined {
    return this.snapshots.getBytes(deviceId);
  }

  async getSnapshotAsync(deviceId: string): Promise<Buffer | undefined> {
    if (this.snapshotFiles) {
      const fromDisk = await this.snapshotFiles.readDeviceSnapshot(deviceId);

      if (fromDisk) {
        return fromDisk;
      }
    }

    return this.snapshots.getBytes(deviceId);
  }

  checkTimeouts(): void {
    for (const pending of this.pending.getExpired()) {
      if (pending.initiator === 'mobile') {
        this.failMobileExport(
          pending.deviceId,
          'TIMEOUT',
          'Export timed out waiting for device upload',
        );
        continue;
      }

      if (pending.browserConnectionId) {
        this.failRefresh(
          pending.deviceId,
          pending.browserConnectionId,
          'TIMEOUT',
          'Refresh timed out waiting for device upload',
        );
      } else {
        this.pending.remove(pending.deviceId);
      }
    }
  }

  private requestMobileUpload(deviceId: string, refreshType: 'snapshot'): void {
    this.router.sendToMobile(
      deviceId,
      createMessage<SnapshotUploadRequestedMessage>({
        type: MessageType.SNAPSHOT_UPLOAD_REQUESTED,
        deviceId,
        refreshType,
      }),
    );
  }

  private failRefresh(
    deviceId: string,
    browserConnectionId: string,
    code: RefreshErrorCode,
    message: string,
  ): void {
    logger.refreshFailed(deviceId, code, message);

    this.sendRefreshError(browserConnectionId, {
      deviceId,
      code,
      message,
    });

    this.pending.remove(deviceId);
  }

  private failMobileExport(
    deviceId: string,
    code: RefreshErrorCode,
    message: string,
  ): void {
    logger.refreshFailed(deviceId, code, message);

    const mobile = this.connectionManager.getByDeviceId(deviceId);

    if (mobile) {
      this.sendExportSnapshotError(mobile.socket, { code, message });
    }

    const refreshError = createMessage<RefreshErrorMessage>({
      type: MessageType.REFRESH_ERROR,
      deviceId,
      code,
      message,
    });

    this.router.broadcastToBrowsers(refreshError);
    this.pending.remove(deviceId);
  }

  private sendRefreshStatus(
    browserConnectionId: string,
    deviceId: string,
    state: RefreshState,
  ): void {
    const statusMessage = createMessage<RefreshStatusMessage>({
      type: MessageType.REFRESH_STATUS,
      deviceId,
      state,
    });

    this.router.sendToBrowser(browserConnectionId, statusMessage);
  }

  private sendRefreshError(
    browserConnectionId: string,
    input: {
      deviceId: string;
      code: RefreshErrorCode;
      message: string;
    },
  ): void {
    const message = createMessage<RefreshErrorMessage>({
      type: MessageType.REFRESH_ERROR,
      deviceId: input.deviceId,
      code: input.code,
      message: input.message,
    });

    this.router.sendToBrowser(browserConnectionId, message);
    logger.refreshFailed(input.deviceId, input.code, input.message);
  }

  private sendExportSnapshotError(
    mobileSocket: WebSocket,
    input: {
      code: RefreshErrorCode;
      message: string;
    },
  ): void {
    const message = createMessage<ExportSnapshotErrorMessage>({
      type: MessageType.EXPORT_SNAPSHOT_ERROR,
      code: input.code,
      message: input.message,
    });

    this.router.sendToSocket(mobileSocket, message);
  }
}
