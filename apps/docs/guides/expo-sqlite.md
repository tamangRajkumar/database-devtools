# Expo SQLite

## Install

```bash
npm install database-devtools @database-devtools/sqlite expo-sqlite
```

## Usage

```tsx
import * as SQLite from 'expo-sqlite';
import { DatabaseDevTools } from 'database-devtools';
import '@database-devtools/sqlite';

const db = await SQLite.openDatabaseAsync('app.db');

<DatabaseDevTools database={db} />
```

Importing `@database-devtools/sqlite` registers the adapter for auto-detection.

## Explicit type override

```tsx
<DatabaseDevTools database={db} type="sqlite" />
```

Use when auto-detection fails or you want explicit configuration.

## Advanced: manual adapter

```tsx
import { createExpoSqliteAdapter } from '@database-devtools/sqlite';

<DatabaseDevTools
  database={db}
  adapter={createExpoSqliteAdapter({ database: db, name: 'app.db' })}
/>
```

## WAL mode

The adapter checkpoints WAL before export for consistent snapshots. Your app can use `PRAGMA journal_mode = WAL` as usual.
