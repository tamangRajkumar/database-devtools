# database-devtools

[![npm version](https://img.shields.io/npm/v/database-devtools.svg)](https://www.npmjs.com/package/database-devtools)
[![license](https://img.shields.io/npm/l/database-devtools.svg)](https://github.com/tamangRajkumar/database-devtools/blob/master/LICENSE)

> Inspect and debug **SQLite** in **React Native** and **Expo** apps from your browser — browse tables, run SQL, and edit live data on connected devices.

**database-devtools** is a Chrome DevTools-like toolkit for mobile app databases. Add one component to your app, run `npx database-devtools` on your machine, and inspect your local SQLite database in a full browser UI.

## Features

- **React Native SQLite inspector** — zero-config [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) auto-detection
- **Expo & React Native debugging** — floating dev overlay in your app during development
- **Browser database explorer** — tables, schema, paginated rows, search, and sort
- **SQL workspace** — run queries with history, favorites, and export (TSV, CSV, JSON)
- **Edit mode** — transactional inserts, updates, and deletes on the live device database
- **Offline exports** — snapshot saved per app; inspect even when the device disconnects
- **Single npm install** — no extra inspector packages required

## Install

```bash
npm install database-devtools expo-sqlite
```

Peer dependencies: `react`, `react-native`, `expo-sqlite`.

## Quick start — React Native / Expo

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

SQLite is auto-detected from the raw `expo-sqlite` instance. Optional:

```tsx
<DatabaseDevTools database={db} type="sqlite" />
<DatabaseDevTools database={db} adapter={customAdapter} />
```

## Run the inspector hub

After installing, start the local hub and browser UI:

```bash
npx database-devtools
```

Opens [http://localhost:3847](http://localhost:3847). Connect your app (simulator, emulator, or physical device on the same network), then **Refresh** to pull a database snapshot.

### Physical device

Point the mobile app at your machine's LAN IP:

```bash
EXPO_PUBLIC_DATABASE_DEVTOOLS_URL=ws://192.168.1.10:3847/ws
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_DEVTOOLS_PORT` | `3847` | Hub and web UI port |
| `DATABASE_DEVTOOLS_NO_OPEN` | unset | Set to `1` to skip opening the browser |

## Advanced exports

| Import | Use case |
|--------|----------|
| `database-devtools/adapters/sqlite` | Custom SQLite adapter wiring |
| `database-devtools/inspector-sqlite` | Browser-side sql.js inspector (custom UI) |
| `database-devtools/client` | WebSocket client for custom tools |
| `database-devtools/server` | Embed the hub in Node.js |

## Documentation

- **Repository:** [github.com/tamangRajkumar/database-devtools](https://github.com/tamangRajkumar/database-devtools)
- **Issues:** [github.com/tamangRajkumar/database-devtools/issues](https://github.com/tamangRajkumar/database-devtools/issues)

## Security

For **local development only**. The hub listens on `0.0.0.0`. The RN overlay is disabled in production by default (`__DEV__`). Edit mode writes to the live device database.

## License

MIT © [tamangRajkumar/database-devtools](https://github.com/tamangRajkumar/database-devtools)

## Publishing (maintainers)

The npm package ships **two artifacts**: the JS library (`dist/*.js`) and the static browser hub (`dist/web/` including `sql-wasm.wasm`).

Always run the **full** build before publishing:

```bash
pnpm build                    # from monorepo root
pnpm --filter database-devtools publish --no-git-checks --otp=CODE
```

Do **not** run `tsup` alone — it wipes `dist/` and does not rebuild the web UI. `prepublishOnly` will fail if `dist/web` or wasm assets are missing.
