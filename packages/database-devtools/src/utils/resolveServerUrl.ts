import { buildDevToolsWsUrl, DEFAULT_DEVTOOLS_PORT } from '../types/protocol';

export function resolveServerUrl(serverUrl?: string): string {
  if (serverUrl) {
    return serverUrl;
  }

  const envUrl =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_DATABASE_DEVTOOLS_URL
      : undefined;

  if (envUrl) {
    return envUrl.startsWith('ws://') || envUrl.startsWith('wss://')
      ? envUrl
      : buildDevToolsWsUrl(envUrl.replace(/^https?:\/\//, ''), DEFAULT_DEVTOOLS_PORT);
  }

  return buildDevToolsWsUrl('localhost', DEFAULT_DEVTOOLS_PORT);
}
