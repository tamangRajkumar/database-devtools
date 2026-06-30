# Database DevTools

Chrome DevTools-like experience for databases running inside React Native applications.

This repository is a **pnpm workspace monorepo**. Phase 1 provides project architecture only — no database adapters yet.

## Quick start

```bash
pnpm install
pnpm build

# Terminal 1 — CLI server (Express + WebSocket)
pnpm dev:cli

# Terminal 2 — Web UI
pnpm dev:web

# Terminal 3 — Expo example app
pnpm dev:example
```

When the example app loads, the mobile client connects to the CLI server:

- **Mobile console:** `Connected to Database DevTools`
- **CLI console:** `Mobile Connected`
- **Web UI:** Connection status updates from "Waiting for mobile..." to "Mobile connected"

## Repository layout

```
database-devtools/
├── packages/database-devtools/   # Publishable npm package (component, CLI, client, server)
├── apps/web/                     # React + Vite browser UI
├── apps/example/                 # Expo example app consuming the local package
└── docs/                         # Documentation
```

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `DATABASE_DEVTOOLS_HOST` | `0.0.0.0` | CLI |
| `DATABASE_DEVTOOLS_PORT` | `3847` | CLI |
| `EXPO_PUBLIC_DATABASE_DEVTOOLS_URL` | `ws://localhost:3847/ws` | Example app |

## License

MIT
