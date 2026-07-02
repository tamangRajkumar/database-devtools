import express from 'express';
import { createServer, type Server } from 'node:http';
import {
  DEFAULT_DEVTOOLS_HOST,
  DEFAULT_DEVTOOLS_PORT,
  DEVICE_SNAPSHOT_API_PATH,
  MAX_SNAPSHOT_BYTES,
  PROJECT_DATABASE_API_PATH,
  PROJECT_DATABASE_META_API_PATH,
  PROJECT_DATABASES_API_PATH,
  buildDevToolsHttpUrl,
  buildDevToolsWsUrl,
} from '../types/protocol';
import { SNAPSHOT_KIND_HEADER, SNAPSHOT_MIME_HEADER, SNAPSHOT_NAME_HEADER, SQLITE_SNAPSHOT_MIME_TYPE } from '../types/snapshot';
import { logger } from '../utils/logger';
import { attachWebSocket } from './attachWebSocket';
import { ConnectionManager } from './connectionManager';
import { createCorsMiddleware } from './cors';
import { DeviceRegistry } from './deviceRegistry';
import { Heartbeat } from './heartbeat';
import { MessageRouter } from './messageRouter';
import { PendingRefreshStore } from './pendingRefreshStore';
import { RefreshCoordinator } from './refreshCoordinator';
import { SnapshotFileStore } from './snapshotFileStore';
import { SnapshotStore } from './snapshotStore';
import { WriteCoordinator } from './writeCoordinator';
import { WriteSessionManager } from './writeSessionManager';

export type DevToolsServerOptions = {
  host?: string;
  port?: number;
  dataDir?: string;
  snapshotPersistence?: boolean;
};

export type DevToolsServer = {
  app: express.Express;
  httpServer: Server;
  connectionManager: ConnectionManager;
  deviceRegistry: DeviceRegistry;
  router: MessageRouter;
  heartbeat: Heartbeat;
  snapshotStore: SnapshotStore;
  snapshotFileStore: SnapshotFileStore;
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
  const snapshotFileStore = new SnapshotFileStore({
    dataDir: options.dataDir,
    enabled: options.snapshotPersistence,
  });
  const pendingRefreshStore = new PendingRefreshStore();
  const writeSessions = new WriteSessionManager();

  const refreshCoordinator = new RefreshCoordinator(
    connectionManager,
    router,
    pendingRefreshStore,
    snapshotStore,
    snapshotFileStore,
  );
  const writeCoordinator = new WriteCoordinator(connectionManager, router, writeSessions);

  app.use(createCorsMiddleware());

  app.get('/health', (_request, response) => {
    response.json({ ok: true, ...deviceRegistry.snapshot() });
  });

  app.post(
    `${DEVICE_SNAPSHOT_API_PATH}/:deviceId/snapshot`,
    express.raw({ type: 'application/octet-stream', limit: MAX_SNAPSHOT_BYTES }),
    async (request, response) => {
      const deviceId = decodeURIComponent(request.params.deviceId);
      const body = request.body;

      if (!Buffer.isBuffer(body) || body.length === 0) {
        response.status(400).json({ ok: false, error: 'Empty snapshot body' });
        return;
      }

      const kindHeader = request.header(SNAPSHOT_KIND_HEADER);
      const mimeHeader = request.header(SNAPSHOT_MIME_HEADER);
      const nameHeader = request.header(SNAPSHOT_NAME_HEADER);

      const result = await refreshCoordinator.handleSnapshotUpload(deviceId, body, {
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

  app.get(`${DEVICE_SNAPSHOT_API_PATH}/:deviceId/snapshot`, async (request, response) => {
    const deviceId = decodeURIComponent(request.params.deviceId);
    const snapshot = await refreshCoordinator.getSnapshotAsync(deviceId);

    if (!snapshot) {
      response.status(404).json({ ok: false, error: 'SNAPSHOT_NOT_FOUND' });
      return;
    }

    response
      .status(200)
      .set('Content-Type', 'application/octet-stream')
      .send(snapshot);
  });

  app.get(PROJECT_DATABASE_META_API_PATH, async (_request, response) => {
    const meta = await snapshotFileStore.getActiveDatabaseMeta();
    response.json(meta);
  });

  app.get(PROJECT_DATABASES_API_PATH, async (_request, response) => {
    const databases = await snapshotFileStore.listDatabases();
    response.json({ databases });
  });

  app.get(PROJECT_DATABASE_API_PATH, async (_request, response) => {
    const meta = await snapshotFileStore.getActiveDatabaseMeta();

    if (!meta.exists) {
      response.status(404).json({ ok: false, error: 'PROJECT_DATABASE_NOT_FOUND' });
      return;
    }

    const bytes = await snapshotFileStore.readActiveDatabase();

    if (!bytes) {
      response.status(404).json({ ok: false, error: 'PROJECT_DATABASE_NOT_FOUND' });
      return;
    }

    response
      .status(200)
      .set('Content-Type', meta.mimeType ?? SQLITE_SNAPSHOT_MIME_TYPE)
      .send(bytes);
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
    snapshotFileStore,
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
