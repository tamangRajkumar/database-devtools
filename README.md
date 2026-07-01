# Database DevTools

Chrome DevTools-like experience for databases running inside React Native applications.

This repository is a **pnpm workspace monorepo**. Phase 2 provides the real-time communication layer; Phase 3 adds the mobile integration UI.

## Mobile usage

```tsx
import { DatabaseDevTools } from 'database-devtools';

<DatabaseDevTools database={db} />
```

- Renders only in development (`__DEV__`) by default
- Floating **DB** button with connection status dot
- Tap to open settings modal (device ID, server URL, reconnect)
- Pass `enabled={false}` to disable in dev, or `enabled={true}` to force on

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

## Verify Phase 2

1. **Server health** — with the CLI running:
   ```bash
   curl http://localhost:3847/health
   ```
   Returns `browserCount`, `mobileCount`, and device lists.

2. **Single device** — open the web UI and example app:
   - Web UI shows **Connected** and **1 mobile device connected**
   - CLI logs `✓ Mobile Connected` and `✓ Browser Connected`
   - Mobile app shows floating **DB** button (green dot when connected)
   - Tap **DB** to open settings modal with device ID and server URL

3. **Multiple devices** — run the example app on two simulators/emulators:
   - Web UI shows **2 mobile devices connected** with device IDs listed

4. **Auto-reconnect** — restart the CLI server (`Ctrl+C`, then `pnpm dev:cli`):
   - Browser and mobile reconnect automatically within ~30s
   - Web UI briefly shows **Reconnecting**, then **Connected**

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

For physical devices, set `EXPO_PUBLIC_DATABASE_DEVTOOLS_URL=ws://<YOUR_LAN_IP>:3847/ws`.

## License

MIT
