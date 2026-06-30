# Architecture

## Monorepo

pnpm workspaces isolate publishable library code from demo applications.

| Path | Role |
|------|------|
| `packages/database-devtools` | npm package: React Native component, WebSocket client, CLI server |
| `apps/web` | Browser UI for inspecting connected mobile apps |
| `apps/example` | Minimal Expo app proving local workspace integration |
| `docs/` | Human-readable documentation |

## Package internals

```
packages/database-devtools/src/
├── cli/           # `npx database-devtools` entry
├── client/        # WebSocket client (mobile + browser)
├── components/    # `<DatabaseDevTools />` React Native UI
├── server/        # Express + WebSocket hub
└── types/         # Shared protocol types
```

### Future adapter layer

The `database` prop on `<DatabaseDevTools />` will accept adapter instances. Adapters will live in separate packages (e.g. `@database-devtools/sqlite`) to keep the core small.

## WebSocket protocol

1. Client connects to `ws://host:3847/ws`
2. Client sends `{ type: 'register', payload: { role: 'mobile' | 'browser' } }`
3. Server tracks connections and broadcasts `{ type: 'deviceStatus', payload: { mobileConnected, browserConnected } }`

## Why subpath exports?

- `database-devtools` — full export including React Native component
- `database-devtools/client` — browser-safe WebSocket client (used by `apps/web`)
- `database-devtools/server` — programmatic server for advanced embedding
- `database-devtools/protocol` — shared types without runtime code
