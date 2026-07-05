# Architecture

Database DevTools uses a **hub-and-spoke** model:

```
Browser ──WebSocket──► Inspector Hub ◄──WebSocket── Mobile App
```

The mobile app exports database snapshots over HTTP. The browser inspects snapshots locally (sql.js for SQLite).

## Published packages

| Package | Role |
|---------|------|
| `database-devtools` | RN component, CLI hub, **built-in SQLite adapter**, adapter registry, browser inspector (`database-devtools/inspector-sqlite`) |

## Adapter resolution

```tsx
<DatabaseDevTools database={db} />           // auto-detect SQLite
<DatabaseDevTools database={db} type="sqlite" />
<DatabaseDevTools database={db} adapter={custom} />
```

Priority: **custom adapter → explicit type → auto-detection → error**.

## Multi-database adapters

SQLite ships built into `database-devtools`. Adding Realm or DuckDB requires:

1. New optional adapter package
2. Matching inspector package
3. `register*()` call — no core protocol changes

## Write protocol (edit mode)

1. Browser sends `beginTransactionRequest` to the hub
2. Hub forwards to the mobile device; adapter runs `BEGIN IMMEDIATE`
3. Browser sends `writeRequest` messages (parameterized SQL)
4. On **Commit**: `commitTransaction` → snapshot refresh
5. On **Discard**: `rollbackTransaction`

## Security

- DevTools overlay is **disabled in production** by default (`__DEV__`)
- The hub listens on `0.0.0.0` — use only on trusted networks
- Edit mode writes to the **live** device database
