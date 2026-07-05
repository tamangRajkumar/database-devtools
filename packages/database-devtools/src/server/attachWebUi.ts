import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response } from 'express';
import express from 'express';

function shouldServeSpa(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  if (request.path.startsWith('/api')) {
    return false;
  }

  if (request.path === '/health') {
    return false;
  }

  return true;
}

export function attachWebUi(app: Express, webDistPath: string): void {
  const indexPath = path.join(webDistPath, 'index.html');

  if (!existsSync(indexPath)) {
    return;
  }

  app.use(
    express.static(webDistPath, {
      index: false,
      setHeaders(response, filePath) {
        if (filePath.endsWith('.wasm')) {
          response.setHeader('Content-Type', 'application/wasm');
        }
      },
    }),
  );

  app.get('*', (request: Request, response: Response, next) => {
    if (!shouldServeSpa(request)) {
      next();
      return;
    }

    response.sendFile(indexPath);
  });
}
