import {
  buildDevToolsWsUrl,
  DEFAULT_DEVTOOLS_PORT,
  DEVTOOLS_WS_PATH,
} from 'database-devtools/protocol';

export type BrowserApiOptions = {
  useSameOriginApi: boolean;
};

export function resolveBrowserHubWsUrl(): string {
  if (import.meta.env.DEV) {
    return buildDevToolsWsUrl('localhost', DEFAULT_DEVTOOLS_PORT);
  }

  if (typeof window === 'undefined') {
    return buildDevToolsWsUrl('localhost', DEFAULT_DEVTOOLS_PORT);
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${DEVTOOLS_WS_PATH}`;
}

export function resolveBrowserApiOptions(): BrowserApiOptions {
  return {
    useSameOriginApi: !import.meta.env.DEV,
  };
}
