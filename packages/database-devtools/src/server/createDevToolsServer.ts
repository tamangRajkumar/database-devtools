import express from 'express';
import { createServer, type Server } from 'node:http';
import {
  DEFAULT_DEVTOOLS_HOST,
  DEFAULT_DEVTOOLS_PORT,
  buildDevToolsHttpUrl,
  buildDevToolsWsUrl,
} from '../types/protocol';
import { logger } from '../utils/logger';
import { attachWebSocket } from './attachWebSocket';
import { ConnectionManager } from './connectionManager';
import { DeviceRegistry } from './deviceRegistry';
import { Heartbeat } from './heartbeat';
import { MessageRouter } from './messageRouter';

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

  app.get('/health', (_request, response) => {
    response.json({ ok: true, ...deviceRegistry.snapshot() });
  });

  const httpServer = createServer(app);
  attachWebSocket(httpServer, connectionManager, router, heartbeat);

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
    close: () =>
      new Promise((resolve, reject) => {
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
