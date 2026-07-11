# Getting started

> Full documentation site: run `pnpm dev:docs` or visit the [repository README](https://github.com/tamangRajkumar/database-devtools#readme).

## Install

```bash
npm install database-devtools

# Expo (recommended — matches your SDK versions)
npx expo install database-devtools expo-sqlite
```

## Mobile app

```tsx
import * as SQLite from 'expo-sqlite';
import { DatabaseDevTools } from 'database-devtools';

const db = await SQLite.openDatabaseAsync('myapp.db');

<DatabaseDevTools database={db} />
```

SQLite is auto-detected — no extra adapter package required.

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
