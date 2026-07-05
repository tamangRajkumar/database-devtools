import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  DEVTOOLS_WS_PATH,
  DevToolsRole,
  isBeginTransactionRequestMessage,
  isCommitTransactionRequestMessage,
  isExportSnapshotRequestMessage,
  isPongMessage,
  isRefreshRequestMessage,
  isRegisterMessage,
  isRollbackTransactionRequestMessage,
  isTransactionAckMessage,
  isWriteAckMessage,
  isWriteRequestMessage,
} from '../types/protocol';
import { logger } from '../utils/logger';
import type { ConnectionManager } from './connectionManager';
import type { Heartbeat } from './heartbeat';
import type { MessageRouter } from './messageRouter';
import type { RefreshCoordinator } from './refreshCoordinator';
import type { SnapshotFileStore } from './snapshotFileStore';
import type { WriteCoordinator } from './writeCoordinator';

export type AttachWebSocketOptions = {
  snapshotFileStore?: SnapshotFileStore;
};

export type AttachWebSocketResult = {
  wss: WebSocketServer;
};

export function attachWebSocket(
  httpServer: Server,
  connectionManager: ConnectionManager,
  router: MessageRouter,
  heartbeat: Heartbeat,
  refreshCoordinator: RefreshCoordinator,
  writeCoordinator: WriteCoordinator,
  options?: AttachWebSocketOptions,
): AttachWebSocketResult {
  const wss = new WebSocketServer({ server: httpServer, path: DEVTOOLS_WS_PATH });

  const handleDisconnect = (socket: WebSocket): void => {
    const client = connectionManager.remove(socket);

    if (!client) {
      return;
    }

    if (client.role === DevToolsRole.MOBILE) {
      if (client.deviceId) {
        writeCoordinator.rollbackSessionsForDevice(client.deviceId);
      }

      logger.mobileDisconnected(client.deviceId);
    } else {
      writeCoordinator.rollbackSessionsOnBrowserDisconnect(client.connectionId);
      logger.browserDisconnected(client.connectionId);
    }

    router.broadcastDeviceStatus();
  };

  wss.on('connection', (socket: WebSocket) => {
    socket.on('message', (raw) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(String(raw));
      } catch {
        return;
      }

      if (isRegisterMessage(parsed)) {
        const existing = connectionManager.getBySocket(socket);

        if (existing) {
          return;
        }

        const client = connectionManager.add({
          socket,
          role: parsed.role,
          deviceId: parsed.deviceId,
          metadata: parsed.metadata,
        });

        if (client.role === DevToolsRole.MOBILE) {
          logger.mobileConnected(client.deviceId);

          if (client.deviceId && options?.snapshotFileStore) {
            void options.snapshotFileStore
              .reconcileOnMobileConnect({
                deviceId: client.deviceId,
                bundleId: client.metadata?.bundleId,
              })
              .finally(() => {
                router.broadcastDeviceStatus();
              });
            return;
          }
        } else {
          logger.browserConnected(client.connectionId);
        }

        router.broadcastDeviceStatus();
        return;
      }

      if (isPongMessage(parsed)) {
        connectionManager.updateLastPong(socket);
        return;
      }

      if (isRefreshRequestMessage(parsed)) {
        refreshCoordinator.handleRefreshRequest(socket, parsed);
        return;
      }

      if (isExportSnapshotRequestMessage(parsed)) {
        refreshCoordinator.handleMobileExportRequest(socket, parsed);
        return;
      }

      if (isBeginTransactionRequestMessage(parsed)) {
        writeCoordinator.handleBeginTransactionRequest(socket, parsed);
        return;
      }

      if (isCommitTransactionRequestMessage(parsed)) {
        writeCoordinator.handleCommitTransactionRequest(socket, parsed);
        return;
      }

      if (isRollbackTransactionRequestMessage(parsed)) {
        writeCoordinator.handleRollbackTransactionRequest(socket, parsed);
        return;
      }

      if (isWriteRequestMessage(parsed)) {
        writeCoordinator.handleWriteRequest(socket, parsed);
        return;
      }

      if (isTransactionAckMessage(parsed)) {
        writeCoordinator.handleTransactionAck(parsed);
        return;
      }

      if (isWriteAckMessage(parsed)) {
        writeCoordinator.handleWriteAck(parsed);
      }
    });

    socket.on('close', () => {
      handleDisconnect(socket);
    });

    socket.on('error', () => {
      handleDisconnect(socket);
    });
  });

  heartbeat.start();

  return { wss };
}
