# Database DevTools

Chrome DevTools-like experience for databases running inside React Native applications.

This repository is a **pnpm workspace monorepo**. Phase 2 provides the real-time communication layer; Phase 3 adds the mobile integration UI.

## Mobile usage

```tsx
import { DatabaseDevTools } from 'database-devtools';

<DatabaseDevTools database={db} />
```

- Renders only in development (`__DEV__`) by default
- Floating **DB** button with connection status dot
- Tap to open settings modal (device ID, server URL, reconnect)
- Pass `enabled={false}` to disable in dev, or `enabled={true}` to force on

## Browser UI

The web app (`apps/web`) is a Chrome DevTools-style shell for inspecting connected mobile devices.

- **Sidebar** — Overview, Explorer, SQL
- **Top bar** — device selector, hub connection status, light/dark theme toggle, one-click Refresh
- **Explorer** — table list, schema viewer, paginated rows, search, sorting, row detail drawer
- **SQL Workspace** — syntax-highlighted editor, query history, favorites, copy/export (TSV, CSV, JSON)
- **Responsive** — sidebar collapses to a drawer on narrow screens

Start the CLI server first (`pnpm dev:cli`), then `pnpm dev:web`. Theme preference is stored in `localStorage` under `database-devtools-theme`.

### One-click refresh

Click **Refresh** in the top bar to pull a database snapshot from the selected mobile device:

1. Browser sends `refreshRequest` to the hub
2. Hub forwards `syncDatabase` to the phone
3. Phone calls `database.exportSnapshot()` and uploads bytes via HTTP
4. Hub notifies the browser with `databaseReady`
5. Browser opens the snapshot with **sql.js** for inspection

### SQLite integration

Use `@database-devtools/sqlite` with expo-sqlite:

```tsx
import * as SQLite from 'expo-sqlite';
import { DatabaseDevTools } from 'database-devtools';
import { createExpoSqliteAdapter } from '@database-devtools/sqlite';

const db = await SQLite.openDatabaseAsync('myapp.db');

<DatabaseDevTools
  database={createExpoSqliteAdapter({ database: db, name: 'myapp.db' })}
/>
```

After **Refresh**, the browser UI shows real tables, schema, and supports read-only SQL queries (`SELECT`, `PRAGMA`, `EXPLAIN`, `WITH`). Use **Explorer** to browse tables; use **SQL** for the full query console with history and export.

## Quick start

```bash
pnpm install
pnpm build

# Terminal 1 — CLI server (Express + WebSocket)
pnpm dev:cli

# Terminal 2 — Web UI
pnpm dev:web

# Terminal 3 — Expo example app
pnpm dev:example
```

## Verify Phase 2

1. **Server health** — with the CLI running:
   ```bash
   curl http://localhost:3847/health
   ```
   Returns `browserCount`, `mobileCount`, and device lists.

2. **Single device** — open the web UI and example app:
   - Web UI shows **Connected** and **1 mobile device connected**
   - CLI logs `✓ Mobile Connected` and `✓ Browser Connected`
   - Mobile app shows floating **DB** button (green dot when connected)
   - Tap **DB** to open settings modal with device ID and server URL

3. **Multiple devices** — run the example app on two simulators/emulators:
   - Web UI shows **2 mobile devices connected** with device IDs listed

4. **Auto-reconnect** — restart the CLI server (`Ctrl+C`, then `pnpm dev:cli`):
   - Browser and mobile reconnect automatically within ~30s
   - Web UI briefly shows **Reconnecting**, then **Connected**

## Repository layout

```
database-devtools/
├── packages/database-devtools/   # Publishable npm package (component, CLI, client, server)
├── apps/web/                     # React + Vite browser UI
├── apps/example/                 # Expo example app consuming the local package
└── docs/                         # Documentation
```

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `DATABASE_DEVTOOLS_HOST` | `0.0.0.0` | CLI |
| `DATABASE_DEVTOOLS_PORT` | `3847` | CLI |
| `EXPO_PUBLIC_DATABASE_DEVTOOLS_URL` | `ws://localhost:3847/ws` | Example app |

For physical devices, set `EXPO_PUBLIC_DATABASE_DEVTOOLS_URL=ws://<YOUR_LAN_IP>:3847/ws`.

## License

MIT
