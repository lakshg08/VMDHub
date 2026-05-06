# @vmd/desktop — VMDHub Desktop Application

Electron app with embedded SQLite (no server needed).

## Development

```bash
npm run dev
```

## Build

```bash
npm run build:win   # Windows .exe
npm run build:mac   # macOS .dmg
```

## Architecture

- **Electron Main** (`src/main/main.js`) — App lifecycle, window creation
- **Preload** (`src/main/preload.js`) — Exposes `window.vmdAPI` via IPC
- **IPC Handlers** (`src/main/ipc-handlers.js`) — All DB operations
- **Renderer** (`src/renderer/`) — React UI (uses `window.vmdAPI` instead of HTTP)

Database stored at: `{userData}/vmdhub.db`
