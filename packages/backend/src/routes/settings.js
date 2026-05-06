const express = require('express');
const { settingsQueries } = require('@vmd/shared');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    res.json(settingsQueries.get(db) || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    settingsQueries.upsert(db, {
      company_name: req.body.company_name || '',
      company_email: req.body.company_email || '',
      company_address: req.body.company_address || '',
      company_gst: req.body.company_gst || '',
      company_phone: req.body.company_phone || '',
      company_website: req.body.company_website || '',
      financial_year_start: req.body.financial_year_start || 4,
      currency: req.body.currency || 'INR',
    });
    res.json(settingsQueries.get(db));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
