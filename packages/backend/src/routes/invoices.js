const express = require('express');
const InvoiceService = require('@vmd/shared/src/services/InvoiceService');
const { Exporters } = require('@vmd/shared');

const router = express.Router();

function getService(req) {
  return new InvoiceService(req.app.locals.db);
}

router.get('/', (req, res) => {
  try {
    const svc = getService(req);
    const { start_date, end_date, month } = req.query;
    let invoices;
    if (start_date && end_date) {
      invoices = svc.getByDateRange(start_date, end_date);
    } else if (month) {
      invoices = svc.getByMonth(month);
    } else {
      invoices = svc.getAll();
    }
    res.json(invoices.map(i => i.toJSON ? i.toJSON() : i));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/next-number', (req, res) => {
  try {
    const svc = getService(req);
    res.json({ nextNumber: svc.getNextInvoiceNumber() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/csv', (req, res) => {
  try {
    const svc = getService(req);
    const invoices = svc.getAll();
    const csv = Exporters.invoicesToCSV(invoices.map(i => i.toJSON ? i.toJSON() : i));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const svc = getService(req);
    const invoice = svc.getById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice.toJSON ? invoice.toJSON() : invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const svc = getService(req);
    const invoice = svc.create(req.body);
    res.status(201).json(invoice.toJSON ? invoice.toJSON() : invoice);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const svc = getService(req);
    const invoice = svc.update(req.params.id, req.body);
    res.json(invoice.toJSON ? invoice.toJSON() : invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const svc = getService(req);
    svc.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
