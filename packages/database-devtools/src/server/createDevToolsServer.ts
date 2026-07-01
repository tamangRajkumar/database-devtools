import express from 'express';
import { createServer, type Server } from 'node:http';
import {
  DEFAULT_DEVTOOLS_HOST,
  DEFAULT_DEVTOOLS_PORT,
  MAX_SNAPSHOT_BYTES,
  SNAPSHOT_API_PATH,
  buildDevToolsHttpUrl,
  buildDevToolsWsUrl,
} from '../types/protocol';
import { logger } from '../utils/logger';
import { attachWebSocket } from './attachWebSocket';
import { ConnectionManager } from './connectionManager';
import { DeviceRegistry } from './deviceRegistry';
import { Heartbeat } from './heartbeat';
import { MessageRouter } from './messageRouter';
import { RefreshCoordinator } from './refreshCoordinator';
import { SyncSessionManager } from './syncSessionManager';
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
  syncSessions: SyncSessionManager;
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
  const syncSessions = new SyncSessionManager();
  const writeSessions = new WriteSessionManager();

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  const httpBaseUrl = buildDevToolsHttpUrl(displayHost, port);
  const refreshCoordinator = new RefreshCoordinator(
    connectionManager,
    router,
    syncSessions,
    httpBaseUrl,
  );
  const writeCoordinator = new WriteCoordinator(connectionManager, router, writeSessions);

  app.get('/health', (_request, response) => {
    response.json({ ok: true, ...deviceRegistry.snapshot() });
  });

  app.post(
    `${SNAPSHOT_API_PATH}/:syncId`,
    express.raw({ type: 'application/octet-stream', limit: MAX_SNAPSHOT_BYTES }),
    (request, response) => {
      const syncId = request.params.syncId;
      const body = request.body;

      if (!Buffer.isBuffer(body) || body.length === 0) {
        response.status(400).json({ ok: false, error: 'Empty snapshot body' });
        return;
      }

      const result = refreshCoordinator.handleSnapshotUpload(syncId, body);

      if (!result.ok) {
        response.status(result.code === 'SNAPSHOT_NOT_FOUND' ? 404 : 400).json({
          ok: false,
          error: result.code,
        });
        return;
      }

      response.status(201).json({ ok: true, syncId, size: body.byteLength });
    },
  );

  app.get(`${SNAPSHOT_API_PATH}/:syncId`, (request, response) => {
    const snapshot = refreshCoordinator.getSnapshot(request.params.syncId);

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

  const syncTimeoutInterval = setInterval(() => {
    refreshCoordinator.checkTimeouts();
    writeCoordinator.checkTimeouts();
  }, 5_000);

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => resolve());
  });

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
    syncSessions,
    writeSessions,
    refreshCoordinator,
    writeCoordinator,
    close: () =>
      new Promise((resolve, reject) => {
        clearInterval(syncTimeoutInterval);
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
