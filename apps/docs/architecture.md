# Architecture

Database DevTools uses a **hub-and-spoke** model:

```
Browser ──WebSocket──► Inspector Hub ◄──WebSocket── Mobile App
```

The mobile app exports database snapshots over HTTP. The browser inspects snapshots locally (sql.js for SQLite).

## Published packages

| Package | Role |
|---------|------|
| `database-devtools` | RN component, CLI hub, client/server, adapter registry |
| `@database-devtools/sqlite` | Mobile SQLite adapter (expo-sqlite) |
| `@database-devtools/inspector-sqlite` | Browser snapshot inspector |

## Adapter resolution

```tsx
<DatabaseDevTools database={db} />           // auto-detect
<DatabaseDevTools database={db} type="sqlite" />
<DatabaseDevTools database={db} adapter={custom} />
```

Priority: **custom adapter → explicit type → auto-detection → error**.

## Multi-database adapters

Adding Realm or DuckDB requires:

1. New adapter package (`packages/adapters/realm`)
2. New inspector package (`packages/inspectors/realm`)
3. `register*()` call — no core protocol changes

See [Custom adapters](./guides/custom-adapter.md).

## Security

- DevTools overlay is **disabled in production** by default (`__DEV__`)
- The hub listens on `0.0.0.0` — use only on trusted networks
- Edit mode writes to the **live** device database
