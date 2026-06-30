import express from 'express';
import { createServer, type Server } from 'node:http';
import {
  DEFAULT_DEVTOOLS_HOST,
  DEFAULT_DEVTOOLS_PORT,
  buildDevToolsHttpUrl,
} from '../types/protocol.js';
import { attachWebSocket } from './attachWebSocket.js';
import { DeviceRegistry } from './deviceRegistry.js';

export type DevToolsServerOptions = {
  host?: string;
  port?: number;
};

export type DevToolsServer = {
  app: express.Express;
  httpServer: Server;
  registry: DeviceRegistry;
  close: () => Promise<void>;
};

export async function createDevToolsServer(
  options: DevToolsServerOptions = {},
): Promise<DevToolsServer> {
  const host = options.host ?? DEFAULT_DEVTOOLS_HOST;
  const port = options.port ?? DEFAULT_DEVTOOLS_PORT;

  const app = express();
  const registry = new DeviceRegistry();

  app.get('/health', (_request, response) => {
    response.json({ ok: true, ...registry.snapshot() });
  });

  const httpServer = createServer(app);
  attachWebSocket(httpServer, registry);

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => resolve());
  });

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  const url = buildDevToolsHttpUrl(displayHost, port);

  console.log(`[database-devtools] Server started at ${url}`);
  console.log(`[database-devtools] WebSocket endpoint ws://${displayHost}:${port}/ws`);

  return {
    app,
    httpServer,
    registry,
    close: () =>
      new Promise((resolve, reject) => {
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
