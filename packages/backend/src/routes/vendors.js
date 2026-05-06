const express = require('express');
const { vendorQueries } = require('@vmd/shared');
const Vendor = require('@vmd/shared/src/models/Vendor');
const Validators = require('@vmd/shared/src/utils/validators');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const vendors = vendorQueries.getAll(db);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const vendor = vendorQueries.getById(db, req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const vendor = new Vendor(req.body);
    const errors = vendor.validate();
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    const result = vendorQueries.create(db, vendor.toDBObject());
    const created = vendorQueries.getById(db, result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Vendor name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = vendorQueries.getById(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Vendor not found' });
    const vendor = new Vendor({ ...existing, ...req.body });
    const errors = vendor.validate();
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    vendorQueries.update(db, req.params.id, vendor.toDBObject());
    res.json(vendorQueries.getById(db, req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = vendorQueries.getById(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Vendor not found' });
    vendorQueries.delete(db, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
