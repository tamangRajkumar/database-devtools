import { buildDevToolsWsUrl, DEFAULT_DEVTOOLS_PORT } from '../types/protocol';
import { resolveDevToolsHost } from './resolveDevToolsHost';

export function normalizeServerUrl(url: string): string {
  const trimmed = url.trim();

  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    return trimmed;
  }

  return buildDevToolsWsUrl(trimmed.replace(/^https?:\/\//, ''), DEFAULT_DEVTOOLS_PORT);
}

export function resolveServerUrl(serverUrl?: string): string {
  if (serverUrl) {
    return normalizeServerUrl(serverUrl);
  }

  const envUrl =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_DATABASE_DEVTOOLS_URL
      : undefined;

  if (envUrl) {
    return normalizeServerUrl(envUrl);
  }

  return buildDevToolsWsUrl(resolveDevToolsHost(), DEFAULT_DEVTOOLS_PORT);
}
