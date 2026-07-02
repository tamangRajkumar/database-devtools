import express from 'express';
import { createServer, type Server } from 'node:http';
import {
  DEFAULT_DEVTOOLS_HOST,
  DEFAULT_DEVTOOLS_PORT,
  DEVICE_SNAPSHOT_API_PATH,
  MAX_SNAPSHOT_BYTES,
  buildDevToolsHttpUrl,
  buildDevToolsWsUrl,
} from '../types/protocol';
import { SNAPSHOT_KIND_HEADER, SNAPSHOT_MIME_HEADER, SNAPSHOT_NAME_HEADER } from '../types/snapshot';
import { logger } from '../utils/logger';
import { attachWebSocket } from './attachWebSocket';
import { ConnectionManager } from './connectionManager';
import { createCorsMiddleware } from './cors';
import { DeviceRegistry } from './deviceRegistry';
import { Heartbeat } from './heartbeat';
import { MessageRouter } from './messageRouter';
import { PendingRefreshStore } from './pendingRefreshStore';
import { RefreshCoordinator } from './refreshCoordinator';
import { SnapshotStore } from './snapshotStore';
import { WriteCoordinator } from './writeCoordinator';
import { WriteSessionManager } from './writeSessionManager';

export type DevToolsServerOptions = {
  host?: string;
  port?: number;
};

export type DevToolsServer = {
  app: express.Express;
  httpServer: Server;
  connectionManager: ConnectionManager;
  deviceRegistry: DeviceRegistry;
  router: MessageRouter;
  heartbeat: Heartbeat;
  snapshotStore: SnapshotStore;
  pendingRefreshStore: PendingRefreshStore;
  writeSessions: WriteSessionManager;
  refreshCoordinator: RefreshCoordinator;
  writeCoordinator: WriteCoordinator;
  close: () => Promise<void>;
};

export async function createDevToolsServer(
  options: DevToolsServerOptions = {},
): Promise<DevToolsServer> {
  const host = options.host ?? DEFAULT_DEVTOOLS_HOST;
  const port = options.port ?? DEFAULT_DEVTOOLS_PORT;

  const app = express();
  const connectionManager = new ConnectionManager();
  const deviceRegistry = new DeviceRegistry(connectionManager);
  const router = new MessageRouter(connectionManager, deviceRegistry);
  const heartbeat = new Heartbeat(connectionManager, router);
  const snapshotStore = new SnapshotStore();
  const pendingRefreshStore = new PendingRefreshStore();
  const writeSessions = new WriteSessionManager();

  const refreshCoordinator = new RefreshCoordinator(
    connectionManager,
    router,
    pendingRefreshStore,
    snapshotStore,
  );
  const writeCoordinator = new WriteCoordinator(connectionManager, router, writeSessions);

  app.use(createCorsMiddleware());

  app.get('/health', (_request, response) => {
    response.json({ ok: true, ...deviceRegistry.snapshot() });
  });

  app.post(
    `${DEVICE_SNAPSHOT_API_PATH}/:deviceId/snapshot`,
    express.raw({ type: 'application/octet-stream', limit: MAX_SNAPSHOT_BYTES }),
    (request, response) => {
      const deviceId = decodeURIComponent(request.params.deviceId);
      const body = request.body;

      if (!Buffer.isBuffer(body) || body.length === 0) {
        response.status(400).json({ ok: false, error: 'Empty snapshot body' });
        return;
      }

      const kindHeader = request.header(SNAPSHOT_KIND_HEADER);
      const mimeHeader = request.header(SNAPSHOT_MIME_HEADER);
      const nameHeader = request.header(SNAPSHOT_NAME_HEADER);

      const result = refreshCoordinator.handleSnapshotUpload(deviceId, body, {
        kind: typeof kindHeader === 'string' ? kindHeader : undefined,
        mimeType: typeof mimeHeader === 'string' ? mimeHeader : undefined,
        databaseName: typeof nameHeader === 'string' ? nameHeader : undefined,
      });

      if (!result.ok) {
        response.status(result.code === 'SNAPSHOT_NOT_FOUND' ? 404 : 400).json({
          ok: false,
          error: result.code,
        });
        return;
      }

      response.status(201).json({ ok: true, deviceId, size: body.byteLength });
    },
  );

  app.get(`${DEVICE_SNAPSHOT_API_PATH}/:deviceId/snapshot`, (request, response) => {
    const deviceId = decodeURIComponent(request.params.deviceId);
    const snapshot = refreshCoordinator.getSnapshot(deviceId);

    if (!snapshot) {
      response.status(404).json({ ok: false, error: 'SNAPSHOT_NOT_FOUND' });
      return;
    }

    response
      .status(200)
      .set('Content-Type', 'application/octet-stream')
      .send(snapshot);
  });

  const httpServer = createServer(app);
  attachWebSocket(
    httpServer,
    connectionManager,
    router,
    heartbeat,
    refreshCoordinator,
    writeCoordinator,
  );

  const refreshTimeoutInterval = setInterval(() => {
    refreshCoordinator.checkTimeouts();
    writeCoordinator.checkTimeouts();
  }, 5_000);

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => resolve());
  });

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  const url = buildDevToolsHttpUrl(displayHost, port);
  const wsUrl = buildDevToolsWsUrl(displayHost, port);

  logger.serverStarted(url, wsUrl);

  return {
    app,
    httpServer,
    connectionManager,
    deviceRegistry,
    router,
    heartbeat,
    snapshotStore,
    pendingRefreshStore,
    writeSessions,
    refreshCoordinator,
    writeCoordinator,
    close: () =>
      new Promise((resolve, reject) => {
        clearInterval(refreshTimeoutInterval);
        heartbeat.stop();
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}
