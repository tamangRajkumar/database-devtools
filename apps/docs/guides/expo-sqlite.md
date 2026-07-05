# Expo SQLite

## Install

```bash
npm install database-devtools expo-sqlite
```

## Usage

```tsx
import * as SQLite from 'expo-sqlite';
import { DatabaseDevTools } from 'database-devtools';

const db = await SQLite.openDatabaseAsync('app.db');

<DatabaseDevTools database={db} />
```

SQLite is **built in** and auto-detected from your expo-sqlite database instance.

## Explicit type override

```tsx
<DatabaseDevTools database={db} type="sqlite" />
```

Use when auto-detection fails or you want explicit configuration.

## Advanced: manual adapter

```tsx
import { createExpoSqliteAdapter } from 'database-devtools/adapters/sqlite';

<DatabaseDevTools
  database={db}
  adapter={createExpoSqliteAdapter({ database: db, name: 'app.db' })}
/>
```

## WAL mode

The adapter checkpoints WAL before export for consistent snapshots. Your app can use `PRAGMA journal_mode = WAL` as usual.
