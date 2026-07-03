import path from 'node:path';
import { createDevToolsServer } from '../server/createDevToolsServer';
import { resolveWebDistPath } from '../utils/resolveWebDistPath';
import { openBrowser } from './openBrowser';

function resolveCliEntryDir(): string {
  const scriptPath = process.argv[1];

  if (scriptPath) {
    return path.dirname(path.resolve(scriptPath));
  }

  return process.cwd();
}

async function main(): Promise<void> {
  const port = Number(process.env.DATABASE_DEVTOOLS_PORT ?? process.env.PORT ?? 3847);
  const host = process.env.DATABASE_DEVTOOLS_HOST ?? '0.0.0.0';
  const webDistPath = resolveWebDistPath(resolveCliEntryDir());

  const server = await createDevToolsServer({
    host,
    port,
    webDistPath,
  });

  if (server.urls.webUiEnabled) {
    openBrowser(server.urls.httpUrl);
  } else {
    console.warn(
      '[database-devtools] Web UI assets not found. Run `pnpm build` in the monorepo or use `pnpm dev:web` during development.',
    );
  }
}

main().catch((error: unknown) => {
  console.error('[database-devtools] Failed to start server:', error);
  process.exit(1);
});
