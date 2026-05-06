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
   checking → not-connected → idle → loading → success → error
6. Update packages/web/src/App.js — add Backup button in Sidebar + render BackupModal
7. Create .env.example with GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET

Read the full plan in .plan/backup_feature/00-plan.md before starting.
Follow the exact file structure and API contracts described there.
After implementation, test by running both servers and verifying
GET /api/backup/gdrive/status returns { configured, authenticated }.
