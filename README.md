# Database DevTools

Chrome DevTools-like experience for databases running inside React Native applications.

Inspect schema, browse rows, run SQL, and edit live data on connected devices — all from your browser.

**Documentation:** [database-devtools on GitHub Pages](https://yellowbooking.github.io/database-devtools/) (or run `pnpm dev:docs` locally)

## Install

```bash
npm install database-devtools expo-sqlite
```

Peer dependencies: `react`, `react-native`, `expo-sqlite`.

## Quick start

### Mobile app

```tsx
import * as SQLite from 'expo-sqlite';
import { DatabaseDevTools } from 'database-devtools';

const db = await SQLite.openDatabaseAsync('myapp.db');

export function App() {
  return (
    <>
      {/* your app */}
      <DatabaseDevTools database={db} />
    </>
  );
}
```

Pass the **raw expo-sqlite instance** — SQLite is auto-detected. Optional overrides:

- `<DatabaseDevTools database={db} type="sqlite" />`
- `<DatabaseDevTools database={db} adapter={customAdapter} />`

### Inspector hub + browser UI

```bash
npx database-devtools
```

That single command starts the hub and opens the browser UI on [http://localhost:3847](http://localhost:3847). Each device export is saved to `.devtools/databases/devices/{bundleId}/database.db` (one file per app) and can be browsed even when the phone is offline.

**Monorepo development** (hot reload for the web UI):

```bash
pnpm install && pnpm build
pnpm dev:cli    # hub on :3847
pnpm dev:web    # browser UI on :5173 (proxies API to hub)
```

**Optional environment variables:**

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_DEVTOOLS_NO_OPEN` | unset | Set to `1` to skip auto-opening the browser |
| `DATABASE_DEVTOOLS_PORT` | `3847` | Hub + UI port when using `npx database-devtools` |

For physical devices, set your machine's LAN IP:

```bash
EXPO_PUBLIC_DATABASE_DEVTOOLS_URL=ws://192.168.1.10:3847/ws
```

## Features

- **Zero-config SQLite** — built-in expo-sqlite auto-detection
- **Explorer** — tables, schema, paginated rows, search, row detail drawer
- **SQL workspace** — read-only queries with history, favorites, export (TSV, CSV, JSON)
- **Edit mode** — transactional inserts, updates, and deletes on the live device database
- **Multi-database architecture** — adapter registry for future engines (Realm, DuckDB, etc.)

## Packages

| Package | Description |
|---------|-------------|
| [`database-devtools`](./packages/database-devtools) | RN component, CLI hub, built-in SQLite adapter, WebSocket protocol |
| [`@database-devtools/inspector-sqlite`](./packages/inspector-sqlite) | Browser snapshot inspector (sql.js) |

Advanced SQLite wiring: `import { createExpoSqliteAdapter } from 'database-devtools/adapters/sqlite'`.

## Monorepo layout

```
database-devtools/
├── packages/database-devtools/   # Core publishable package (includes SQLite adapter)
├── packages/inspector-sqlite/    # Browser inspector
├── apps/web/                     # Browser UI
├── apps/example/                 # Expo example app
└── apps/docs/                    # VitePress documentation site
```

## Development

```bash
pnpm install
pnpm build          # builds hub, inspector, and bundled browser UI (dist/web)
pnpm test
pnpm dev:example   # Expo example app
```

**Local development:**

```bash
pnpm dev:cli       # hub on :3847 (serves bundled UI if you ran pnpm build)
pnpm dev:web       # Vite dev server on :5173 with hot reload
```

End users run a single command after install: `npx database-devtools`.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and [CHANGELOG.md](./CHANGELOG.md) for release history.

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `DATABASE_DEVTOOLS_HOST` | `0.0.0.0` | CLI |
| `DATABASE_DEVTOOLS_PORT` | `3847` | CLI |
| `EXPO_PUBLIC_DATABASE_DEVTOOLS_URL` | Auto (see below) | Mobile app |

**Default hub URL on mobile:** Android emulator uses `10.0.2.2`; physical devices use Metro's LAN IP; iOS simulator uses `localhost`. See [connection troubleshooting](./apps/docs/guides/connection-troubleshooting.md).

## Security

Database DevTools is for **local development only**. The hub binds to `0.0.0.0` and edit mode writes to the live device database. The RN overlay is disabled in production by default (`__DEV__`). See [SECURITY.md](./SECURITY.md).

## License

MIT — see [LICENSE](./LICENSE).
