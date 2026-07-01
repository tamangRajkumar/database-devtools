# Getting started

## Install

```bash
npm install database-devtools expo-sqlite
```

Peer dependencies: `react`, `react-native`, `expo-sqlite` (for the SQLite adapter).

## Mobile app

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

## Run the inspector

```bash
# Terminal 1 — hub
npx database-devtools

# Terminal 2 — clone this repo and run the web UI, or use your own browser client
pnpm dev:web
```

Open the web UI, select your device, and click **Refresh** to sync a snapshot.

## Physical devices

Set the WebSocket URL so your phone can reach your machine:

```bash
EXPO_PUBLIC_DATABASE_DEVTOOLS_URL=ws://192.168.1.10:3847/ws
```

## Next steps

- [Expo SQLite guide](./guides/expo-sqlite.md)
- [Editing data](./guides/editing.md)
- [Architecture](./architecture.md)
