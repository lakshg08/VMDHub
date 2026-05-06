# Backup Feature Plan — Google Drive Manual Backup

## Context

VMDHub runs locally on the user's laptop (Mac and Windows). The user wants a
one-click manual backup of the SQLite database (`data/vmdhub.db`) to their own
Google Drive. The feature is triggered from the left sidebar, blocks the UI while
uploading, and confirms the filename on success.

---

## Stack Facts

- **Backend**: Express + `better-sqlite3` v9.6.0 at `packages/backend/src/server.js`
- **Database**: `data/vmdhub.db` (relative to monorepo root), path in `DB_PATH` env var
- **Frontend**: React 18 + React Router v6, served on port 3000
- **API base**: `http://localhost:3001/api`
- **Existing modal CSS**: `.modal-overlay`, `.modal`, `.modal-header` in `packages/web/src/styles/global.css`
- **Existing backup route**: `packages/backend/src/routes/backup.js`

---

## What to Build

### 1. Sidebar — Backup button (`packages/web/src/App.js`)

Add a fixed `<button>` at the bottom of the `<Sidebar>` component, just above the
version footer. It opens a modal — it does **not** navigate to a route.

```jsx
// In App.js — add state
const [showBackup, setShowBackup] = useState(false);

// In Sidebar — add below the NAV_ITEMS loop, above version footer
<button onClick={onBackupClick} style={{
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '10px 16px', background: 'none', border: 'none',
  color: 'rgba(255,255,255,0.8)', cursor: 'pointer', width: '100%',
  fontSize: 14, borderLeft: '3px solid transparent'
}}>
  <span style={{ fontSize: 18 }}>☁</span>
  {!collapsed && <span>Backup</span>}
</button>

// In App — render modal
{showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
```

---

### 2. BackupModal component (`packages/web/src/components/BackupModal.js`)

Four internal UI states driven by a single `status` variable:

| status | What user sees |
|--------|---------------|
| `checking` | Brief spinner while fetching `/gdrive/status` |
| `not-connected` | "Connect Google Drive first" + Connect button |
| `idle` | "Backup to Google Drive" + Start Backup button |
| `loading` | Spinner + "Uploading…" — overlay blocks all interaction |
| `success` | "✓ Backup complete!" + filename + **Confirm** button |
| `error` | Error message + Try Again button |

**On mount**: call `GET /api/backup/gdrive/status` to determine starting state.

**Connect flow**: call `GET /api/backup/gdrive/auth-url` → open returned URL in
`window.open()` (new tab) → poll `GET /api/backup/gdrive/status` every 3 s until
`authenticated: true`, then switch to `idle`.

**Backup flow**: call `POST /api/backup/gdrive/run` → on success, extract `filename`
from response → switch to `success`. Disable close (`✕`) button during `loading`.

Uses existing CSS classes: `.modal-overlay`, `.modal`, `.modal-header`, `.modal-close`,
`.btn`, `.btn-primary`, `.alert-success`, `.alert-error`.

---

### 3. GoogleDriveService (`packages/shared/src/services/GoogleDriveService.js`)

Pure Node.js class. No platform-specific code.

```
isConfigured()            → bool  (GDRIVE_CLIENT_ID + GDRIVE_CLIENT_SECRET set)
isAuthenticated(tokenPath)→ bool  (data/gdrive-token.json exists)
getAuthUrl()              → string (OAuth2 URL)
handleCallback(code, tokenPath) → saves token JSON, returns tokens
getOrCreateFolder(auth, name)   → folderId string
uploadFile(auth, localPath, fileName, folderId) → { id, name }
deleteOldBackups(auth, folderId, keep=30)       → number deleted
```

Token file: `data/gdrive-token.json`
OAuth2 scope: `https://www.googleapis.com/auth/drive.file` (minimal — only files this app created)
Redirect URI: `http://localhost:3001/api/backup/gdrive/callback`

---

### 4. New backend endpoints (`packages/backend/src/routes/backup.js`)

Add these four routes to the existing file:

```
GET  /api/backup/gdrive/status
  → { configured: bool, authenticated: bool }

GET  /api/backup/gdrive/auth-url
  → { url: string }

GET  /api/backup/gdrive/callback
  → exchanges ?code, saves token, redirects to http://localhost:3000?gdrive=connected

POST /api/backup/gdrive/run
  → creates db.backup(tempPath)
  → uploads to Drive
  → deletes temp file
  → { filename: 'vmdhub-backup-2026-05-06_14-30-00.db' }
```

**Safe SQLite backup** (in the run handler):
```javascript
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
const filename = `vmdhub-backup-${ts}.db`;
const tempPath = path.join(DATA_DIR, filename);
await req.app.locals.db.backup(tempPath);       // better-sqlite3 built-in, safe while live
const folderId = await svc.getOrCreateFolder(auth, 'VMDHub-Backups');
await svc.uploadFile(auth, tempPath, filename, folderId);
await svc.deleteOldBackups(auth, folderId, 30); // keep last 30
fs.unlinkSync(tempPath);
res.json({ filename });
```

---

### 5. `packages/backend/src/server.js` changes

Add at the very top:
```javascript
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
```

No other changes needed — the backup route file is already registered as
`app.use('/api/backup', backupRoutes)`.

---

## New Dependencies

Add to `packages/backend/package.json`:
```json
"googleapis": "^144.0.0",
"dotenv": "^16.0.0"
```

Install: `npm install --prefix packages/backend googleapis dotenv`

---

## Files to Create

| File | Description |
|------|-------------|
| `packages/shared/src/services/GoogleDriveService.js` | Drive auth + upload logic |
| `packages/web/src/components/BackupModal.js` | Modal UI component |
| `.env.example` | Documents required env vars |
| `.env` | User creates this (not committed) |

## Files to Modify

| File | Change |
|------|--------|
| `packages/backend/package.json` | Add `googleapis`, `dotenv` |
| `packages/backend/src/server.js` | Add `dotenv.config()` at top |
| `packages/backend/src/routes/backup.js` | Add 4 gdrive endpoints |
| `packages/web/src/App.js` | Add Backup button in Sidebar + BackupModal |

---

## One-Time Google Cloud Setup (user does this once, ~10 min)

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Drive API** (APIs & Services → Library → search "Drive")
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URI: `http://localhost:3001/api/backup/gdrive/callback`
7. Copy **Client ID** and **Client Secret**
8. Create `.env` in the monorepo root:
   ```
   GDRIVE_CLIENT_ID=paste_client_id_here
   GDRIVE_CLIENT_SECRET=paste_client_secret_here
   ```
9. Add `.env` to `.gitignore` (if not already there)

Works identically on Windows and Mac — no platform-specific steps.

---

## First-Time Connect (once per machine)

1. Click **Backup** in sidebar → modal opens → "Connect Google Drive"
2. Click **Connect** → Google login opens in new browser tab
3. Grant permission → redirected to `http://localhost:3001/api/backup/gdrive/callback`
4. Token saved to `data/gdrive-token.json` — never asked again on this machine

---

## Verification Steps

1. `npm install --prefix packages/backend`
2. Start backend: `npm run dev` in `packages/backend`
3. Start frontend: `npm start` in `packages/web`
4. `curl http://localhost:3001/api/backup/gdrive/status` → `{"configured":true,"authenticated":false}`
5. Click **Backup** in sidebar → modal shows "Connect Google Drive"
6. Click **Connect** → Google login → token saved
7. Reopen modal → click **Start Backup** → spinner shows
8. Check Google Drive → `VMDHub-Backups/` folder contains `.db` file
9. Modal shows filename → click **Confirm** → modal closes

---

## Resume Prompt

To implement this feature in a future Claude Code session, paste the following prompt:

```
Implement the Google Drive manual backup feature for VMDHub as documented in
.plan/backup_feature/00-plan.md.

Summary of what to build:
1. Add googleapis + dotenv to packages/backend/package.json and install them
2. Create packages/shared/src/services/GoogleDriveService.js — OAuth2 + upload class
3. Add 4 new endpoints to packages/backend/src/routes/backup.js:
   GET  /api/backup/gdrive/status
   GET  /api/backup/gdrive/auth-url
   GET  /api/backup/gdrive/callback
   POST /api/backup/gdrive/run
4. Add require('dotenv').config() at top of packages/backend/src/server.js
5. Create packages/web/src/components/BackupModal.js — modal with states:
   checking → not-connected → idle → loading → success/error
6. Update packages/web/src/App.js — add Backup button in Sidebar + render BackupModal
7. Create .env.example with GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET

Read the full plan in .plan/backup_feature/00-plan.md before starting.
Follow the exact file structure and API contracts described there.
After implementation, test by running both servers and verifying
GET /api/backup/gdrive/status returns { configured, authenticated }.
```
