const express = require('express');
const PLService = require('@vmd/shared/src/services/PLService');
const { productQueries } = require('@vmd/shared');
const Exporters = require('@vmd/shared/src/utils/exporters');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const plService = new PLService(db);
    const products = productQueries.getAll(db);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    res.json(plService.getMonthlyPL(year, products));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export', (req, res) => {
  try {
    const db = req.app.locals.db;
    const plService = new PLService(db);
    const products = productQueries.getAll(db);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = plService.getMonthlyPL(year, products);
    const html = Exporters.plStatementToHTML({
      period: String(year),
      revenue: data.yearly.revenue,
      cost: data.yearly.cost,
      profit: data.yearly.profit,
      margin: data.yearly.margin,
      monthly: data.monthly,
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
