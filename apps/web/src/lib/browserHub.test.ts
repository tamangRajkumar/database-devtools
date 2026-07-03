import { describe, expect, it } from 'vitest';
import { DEFAULT_DEVTOOLS_PORT, DEVTOOLS_WS_PATH } from 'database-devtools/protocol';
import { resolveBrowserApiOptions, resolveBrowserHubWsUrl } from './browserHub';

describe('browserHub', () => {
  it('uses the Vite dev-server proxy settings during local development', () => {
    expect(resolveBrowserApiOptions()).toEqual({
      useSameOriginApi: false,
    });
    expect(resolveBrowserHubWsUrl()).toBe(`ws://localhost:${DEFAULT_DEVTOOLS_PORT}${DEVTOOLS_WS_PATH}`);
  });
});
