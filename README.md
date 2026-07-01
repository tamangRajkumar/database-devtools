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
# From this monorepo (development)
pnpm install && pnpm build
pnpm dev:cli    # hub on :3847
pnpm dev:web    # browser UI on :5173

# Or publish workflow — run the CLI from npm
npx database-devtools
```

Open the web UI, select your device, and click **Refresh** to sync a snapshot.

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
pnpm build
pnpm test
pnpm dev:example   # Expo example app
```

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
