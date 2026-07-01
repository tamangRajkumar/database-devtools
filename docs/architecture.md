# Architecture

## Monorepo

pnpm workspaces isolate publishable library code from demo applications.

| Path | Role |
|------|------|
| `packages/database-devtools` | npm package: React Native component, WebSocket client, CLI server |
| `apps/web` | Browser UI for inspecting connected mobile apps |
| `apps/example` | Minimal Expo app proving local workspace integration |
| `docs/` | Human-readable documentation |

## Communication topology

```
Browser ──WebSocket──► Inspector Server ◄──WebSocket── Mobile App
```

The Inspector Server is the hub. Browser and mobile never communicate directly.

## Package internals

```
packages/database-devtools/src/
├── cli/              # `npx database-devtools` entry
├── client/           # Reconnecting WebSocket client (mobile + browser)
├── components/       # `<DatabaseDevTools />` overlay UI
├── hooks/            # `useDevTools` context hook
├── server/           # Express + WebSocket hub
├── types/            # Shared protocol + adapter types
└── utils/            # Logger, reconnect, dev gate, metadata
```

### Mobile component (`<DatabaseDevTools />`)

| Piece | Role |
|-------|------|
| `DatabaseDevTools` | Dev-only gate + overlay shell |
| `DevToolsProvider` | WebSocket lifecycle, context state |
| `FloatingDevToolsButton` | Fixed FAB with connection status dot |
| `DevToolsSettingsModal` | Connection info, device ID, server URL editor |
| `ConnectionStatusBadge` | Labeled status pill for modal |

Development-only by default (`__DEV__`). Returns `null` in production builds.

### Server modules

| Module | Responsibility |
|--------|----------------|
| `connectionManager` | In-memory map of socket → client record (role, deviceId, timestamps) |
| `deviceRegistry` | Derives `deviceStatus` snapshot from connection manager |
| `messageRouter` | `sendToBrowser`, `sendToMobile`, `broadcastToBrowsers`, `broadcastToMobiles` |
| `heartbeat` | Server-initiated ping/pong; terminates dead sockets |
| `attachWebSocket` | Wires connection lifecycle to manager + router |

### Database adapter layer

The `database` prop accepts a `DatabaseAdapter` with `exportSnapshot()` and `dialect: 'sqlite'`.

`@database-devtools/sqlite` provides `createExpoSqliteAdapter()` using expo-sqlite's `serializeAsync()` for consistent exports.

### Browser inspection (sql.js)

After refresh, `apps/web` opens the downloaded snapshot in **sql.js** (WASM):

- **Tables** — `sqlite_master` + row counts
- **Schema** — `PRAGMA table_info`
- **Query** — read-only SQL execution against the in-memory copy

## WebSocket protocol

All messages extend a shared base:

```typescript
interface DevToolsMessageBase {
  type: MessageTypeValue;
  timestamp: number;
}
```

### Message types

| Type | Direction | Purpose |
|------|-----------|---------|
| `register` | Client → Server | Assign role (`browser` or `mobile`); mobile sends `deviceId` + optional `metadata` |
| `ping` | Server → Client | Heartbeat probe with `pingId` |
| `pong` | Client → Server | Heartbeat response with matching `pingId` |
| `deviceStatus` | Server → Client | Hub snapshot: browser/mobile counts and device lists |
| `broadcast` | Server → Client | Generic envelope for future features |
| `refreshRequest` | Browser → Server | Start database sync for a `deviceId` |
| `syncDatabase` | Server → Mobile | Export and upload snapshot to `uploadUrl` |
| `syncStatus` | Server → Browser | Sync progress (`requested` → `exporting` → `uploading` → `ready`) |
| `databaseReady` | Server → Browser | Snapshot available at `downloadUrl` |
| `syncError` | Server → Browser | Sync failure with `code` and `message` |
| `exportFailed` | Mobile → Server | Export or upload failed on device |

### Database refresh flow

```
Browser ──refreshRequest──► Server ──syncDatabase──► Mobile
Mobile ──POST /api/snapshots/:syncId──► Server ──databaseReady──► Browser
```

Snapshots are uploaded over HTTP (`application/octet-stream`, max 50 MB). Sync sessions time out after 60 seconds.

### Connection flow

1. Client connects to `ws://host:3847/ws`
2. Client sends `{ type: 'register', role: 'mobile' | 'browser', deviceId?, metadata? }`
3. Server tracks the socket, logs connection, broadcasts `deviceStatus` to all clients
4. Server sends `ping` every 30s; clients reply with `pong`
5. On disconnect or heartbeat timeout, server removes client and rebroadcasts `deviceStatus`

### deviceStatus payload

```typescript
{
  browserCount: number;
  mobileCount: number;
  browsers: { connectionId, connectedAt }[];
  mobiles: { deviceId, connectionId, connectedAt, metadata? }[];
}
```

## Auto-reconnect

Both mobile and browser clients use exponential backoff (1s base, 30s max, jitter). On unexpected disconnect they enter `reconnecting` state and re-send `register` on success.

## Why subpath exports?

- `database-devtools` — full export including React Native component
- `database-devtools/client` — browser-safe WebSocket client (used by `apps/web`)
- `database-devtools/server` — programmatic server for advanced embedding
- `database-devtools/protocol` — shared types without runtime code
