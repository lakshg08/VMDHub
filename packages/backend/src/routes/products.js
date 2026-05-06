const express = require('express');
const { productQueries } = require('@vmd/shared');
const Product = require('@vmd/shared/src/models/Product');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { vendor_id } = req.query;
    const products = vendor_id
      ? productQueries.getByVendor(db, vendor_id)
      : productQueries.getAll(db);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const product = productQueries.getById(db, req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const product = new Product(req.body);
    const errors = product.validate();
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    const result = productQueries.create(db, product.toDBObject());
    res.status(201).json(productQueries.getById(db, result.lastInsertRowid));
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = productQueries.getById(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    const product = new Product({ ...existing, ...req.body });
    const errors = product.validate();
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    productQueries.update(db, req.params.id, product.toDBObject());
    res.json(productQueries.getById(db, req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = productQueries.getById(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    productQueries.delete(db, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
