import type { NextFunction, Request, Response } from 'express';
import {
  SNAPSHOT_KIND_HEADER,
  SNAPSHOT_MIME_HEADER,
  SNAPSHOT_NAME_HEADER,
} from '../types/snapshot';

const ALLOWED_METHODS = 'GET, POST, OPTIONS';

const ALLOWED_HEADERS = [
  'Content-Type',
  SNAPSHOT_KIND_HEADER,
  SNAPSHOT_MIME_HEADER,
  SNAPSHOT_NAME_HEADER,
].join(', ');

export type CorsOptions = {
  /** Fixed origin, or `*` when request has no Origin header. */
  allowedOrigin?: string;
};

export function resolveCorsOrigin(
  requestOrigin: string | undefined,
  configuredOrigin?: string,
): string {
  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (!requestOrigin) {
    return '*';
  }

  try {
    const url = new URL(requestOrigin);
    const isLocalDev =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '10.0.2.2';

    if (isLocalDev) {
      return requestOrigin;
    }
  } catch {
    return '*';
  }

  return '*';
}

export function createCorsMiddleware(options: CorsOptions = {}) {
  const configuredOrigin = options.allowedOrigin ?? process.env.DATABASE_DEVTOOLS_CORS_ORIGIN;

  return (request: Request, response: Response, next: NextFunction): void => {
    const origin = resolveCorsOrigin(request.header('origin'), configuredOrigin);

    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    response.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    response.setHeader('Vary', 'Origin');

    if (request.method === 'OPTIONS') {
      response.status(204).end();
      return;
    }

    next();
  };
}
