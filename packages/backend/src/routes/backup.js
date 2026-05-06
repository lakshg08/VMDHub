const express = require('express');
const BackupService = require('@vmd/shared/src/services/BackupService');

const router = express.Router();

router.get('/export', (req, res) => {
  try {
    const db = req.app.locals.db;
    const svc = new BackupService(db);
    const json = svc.exportAll();
    const filename = `vmdhub-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    svc.recordBackup(filename, Buffer.byteLength(json), 'download');
    res.send(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import', (req, res) => {
  try {
    const db = req.app.locals.db;
    const svc = new BackupService(db);
    const { data, clearExisting = false } = req.body;
    if (!data) return res.status(400).json({ error: 'No backup data provided' });
    const result = svc.importAll(data, { clearExisting });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/history', (req, res) => {
  try {
    const db = req.app.locals.db;
    const svc = new BackupService(db);
    res.json(svc.getBackupHistory());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
