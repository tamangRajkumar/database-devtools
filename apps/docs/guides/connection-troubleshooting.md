# Connection troubleshooting

## Symptom: "Snapshot uploaded but download failed"

The mobile device (or hub) successfully received the snapshot, but the **web browser** could not download it over HTTP.

### Cause

The web UI runs on a different origin than the hub (for example `http://localhost:5173` → `http://localhost:3847`). Browsers block cross-origin `fetch` unless the hub sends CORS headers.

### Fix (built in)

- The hub enables CORS on its HTTP API (`GET`/`POST` `/api/devices/.../snapshot`).
- In development, the web app also proxies `/api` to the hub via Vite and downloads snapshots from same-origin `/api/...` URLs.

### Verify

1. Hub is running: `curl http://localhost:3847/health`
2. After a refresh/export, snapshot exists:
   ```bash
   curl -I http://localhost:3847/api/devices/<deviceId>/snapshot
   ```
   Expect `200` and `Access-Control-Allow-Origin` in response headers.
3. Restart both hub and web after pulling updates:
   ```bash
   pnpm dev:cli
   pnpm dev:web
   ```

If download still fails, check the full error next to the Refresh button — it now includes HTTP status or network details.

## Symptom: Refresh shows Blob / ArrayBuffer error

If the web UI shows **"Creating blobs from 'ArrayBuffer'…"**, the mobile app failed to upload the snapshot. This is fixed by uploading raw `Uint8Array` bytes (not `Blob`) and rewriting `localhost` upload URLs to match the hub WebSocket host (`10.0.2.2` on Android emulator).

## Symptom: mobile shows "Reconnecting", web shows no devices

The web UI can be connected to the hub while the mobile app cannot. The device dropdown stays empty until a phone registers.

### 1. Start all three processes

```bash
pnpm dev:cli      # hub on :3847
pnpm dev:web      # browser UI
pnpm dev:example  # Expo app
```

Verify the hub:

```bash
curl http://localhost:3847/health
```

### 2. Fix the WebSocket URL on mobile

| Environment | Use |
|-------------|-----|
| Web browser / iOS Simulator | `ws://localhost:3847/ws` |
| **Android emulator** | `ws://10.0.2.2:3847/ws` |
| **Physical phone** | `ws://<YOUR_PC_LAN_IP>:3847/ws` |

`localhost` on Android points at the **phone**, not your PC.

The example app auto-detects these defaults. Override with `EXPO_PUBLIC_DATABASE_DEVTOOLS_URL` in `apps/example/.env` if needed.

### 3. Android cleartext

The example app enables `usesCleartextTraffic` for `ws://` in development. Custom apps may need the same in `app.json`.

### 4. Firewall

Allow inbound TCP **3847** on your development machine.

### 5. Success checklist

- Mobile settings: **Connected**
- `curl localhost:3847/health` → `"mobileCount": 1`
- CLI log: `✓ Mobile Connected`
- Web device dropdown lists your app

## Symptom: floating database button not visible (Android emulator)

The FAB is disabled in production (`__DEV__` false) unless you pass `enabled={true}`. From **0.1.9**, it uses a same-window absolute overlay with `pointerEvents="box-none"` so only the visible button handles touches.

### Checklist

1. Upgrade to `database-devtools@0.1.9` or later and clear Metro: `npx expo start -c`.
2. Confirm `<DatabaseDevTools />` (or your Gate) mounts as a late child of a full-screen root view in a **dev** build.
3. Confirm you are not gating on AsyncStorage/`ready` forever — the overlay should mount once the package loads.
4. Temporarily try `draggable={false}` and `enabled` to rule out position / `__DEV__` issues.

Hub URL / `10.0.2.2` only affects WebSocket export, not whether the button draws.
