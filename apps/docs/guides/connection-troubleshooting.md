# Connection troubleshooting

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
