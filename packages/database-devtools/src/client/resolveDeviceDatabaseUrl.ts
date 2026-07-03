import {
  PROJECT_DEVICE_EXPORTS_API_PATH,
  wsUrlToHttpUrl,
} from '../types/protocol';
import type { ResolveProjectDatabaseUrlOptions } from './resolveProjectDatabaseUrl';

function resolveApiBase(serverUrl: string, options?: ResolveProjectDatabaseUrlOptions): string {
  if (options?.useSameOriginApi && typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (serverUrl.startsWith('ws://') || serverUrl.startsWith('wss://')) {
    return wsUrlToHttpUrl(serverUrl);
  }

  return serverUrl.replace(/\/$/, '');
}

export function resolveDeviceExportDatabaseUrl(
  serverUrl: string,
  deviceId: string,
  options?: ResolveProjectDatabaseUrlOptions,
): string {
  const base = resolveApiBase(serverUrl, options);
  return `${base}${PROJECT_DEVICE_EXPORTS_API_PATH}/${encodeURIComponent(deviceId)}/database`;
}

export function resolveDeviceExportDatabaseMetaUrl(
  serverUrl: string,
  deviceId: string,
  options?: ResolveProjectDatabaseUrlOptions,
): string {
  const base = resolveApiBase(serverUrl, options);
  return `${base}${PROJECT_DEVICE_EXPORTS_API_PATH}/${encodeURIComponent(deviceId)}/database/meta`;
}

export function resolveDeviceExportsUrl(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): string {
  const base = resolveApiBase(serverUrl, options);
  return `${base}${PROJECT_DEVICE_EXPORTS_API_PATH}`;
}
