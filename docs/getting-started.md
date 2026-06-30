# Getting started

## Prerequisites

- Node.js 20+
- pnpm 9+
- For the example app: Expo Go or a dev client on a device/emulator

## Install

From the repository root:

```bash
pnpm install
pnpm build
```

## Run the full stack

1. **Start the CLI server**

   ```bash
   pnpm dev:cli
   ```

   Starts Express (health check at `/health`) and WebSocket hub at `/ws` on port **3847**.

2. **Start the web app**

   ```bash
   pnpm dev:web
   ```

   Open http://localhost:5173 — shows connection status and waits for a mobile client.

3. **Start the example app**

   ```bash
   pnpm dev:example
   ```

   Renders `<DatabaseDevTools />` which connects to the CLI over WebSocket.

## Package usage (React Native)

```tsx
import { DatabaseDevTools } from 'database-devtools';

export function App() {
  return <DatabaseDevTools />;
}
```

The `database` prop is reserved for future adapters (SQLite, Realm, DuckDB, custom).

## CLI usage

```bash
npx database-devtools
```

Or after building locally:

```bash
pnpm --filter database-devtools dev
```

## Subpath exports

| Import | Purpose |
|--------|---------|
| `database-devtools` | Full package including React Native component |
| `database-devtools/client` | WebSocket client (browser-safe) |
| `database-devtools/server` | Programmatic server creation |
| `database-devtools/protocol` | Shared message types |
