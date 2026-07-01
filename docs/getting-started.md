# Getting started

> Full documentation site: run `pnpm dev:docs` or visit [GitHub Pages](https://yellowbooking.github.io/database-devtools/).

## Install

```bash
npm install database-devtools @database-devtools/sqlite
```

## Mobile app

```tsx
import * as SQLite from 'expo-sqlite';
import { DatabaseDevTools } from 'database-devtools';
import '@database-devtools/sqlite';

const db = await SQLite.openDatabaseAsync('myapp.db');

<DatabaseDevTools database={db} />
```

## Run the inspector

```bash
npx database-devtools          # hub
pnpm dev:web                   # browser UI (monorepo)
```

Open the web UI, select your device, and click **Refresh**.

## Physical devices

```bash
EXPO_PUBLIC_DATABASE_DEVTOOLS_URL=ws://192.168.1.10:3847/ws
```
