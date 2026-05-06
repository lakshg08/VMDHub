const express = require('express');
const { customerQueries } = require('@vmd/shared');
const Customer = require('@vmd/shared/src/models/Customer');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { type, search } = req.query;
    let customers;
    if (search) {
      customers = customerQueries.search(db, search);
    } else if (type) {
      customers = customerQueries.getByType(db, type);
    } else {
      customers = customerQueries.getAll(db);
    }
    res.json(customers.map(c => new Customer(c).toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const row = customerQueries.getById(db, req.params.id);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(new Customer(row).toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const customer = new Customer(req.body);
    const errors = customer.validate();
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    const result = customerQueries.create(db, customer.toDBObject());
    res.status(201).json(new Customer(customerQueries.getById(db, result.lastInsertRowid)).toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = customerQueries.getById(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });
    const customer = new Customer({ ...existing, ...req.body });
    const errors = customer.validate();
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    customerQueries.update(db, req.params.id, customer.toDBObject());
    res.json(new Customer(customerQueries.getById(db, req.params.id)).toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!customerQueries.getById(db, req.params.id)) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    customerQueries.delete(db, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
