import { createDevToolsServer } from '../server/createDevToolsServer';

async function main(): Promise<void> {
  const port = Number(process.env.DATABASE_DEVTOOLS_PORT ?? process.env.PORT ?? 3847);
  const host = process.env.DATABASE_DEVTOOLS_HOST ?? '0.0.0.0';

  await createDevToolsServer({ host, port });
}

main().catch((error: unknown) => {
  console.error('[database-devtools] Failed to start server:', error);
  process.exit(1);
});
