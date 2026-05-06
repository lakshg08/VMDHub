const express = require('express');
const PLService = require('@vmd/shared/src/services/PLService');

const router = express.Router();

router.get('/summary', (req, res) => {
  try {
    const db = req.app.locals.db;
    const plService = new PLService(db);
    res.json(plService.getDashboardSummary());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monthly', (req, res) => {
  try {
    const db = req.app.locals.db;
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = db.prepare(`
        SELECT strftime('%Y-%m', invoice_date) as ym,
          COUNT(*) as count,
          COALESCE(SUM(total_amount_after_tax), 0) as revenue,
          COALESCE(SUM(total_tax), 0) as tax
        FROM invoices
        WHERE strftime('%Y-%m', invoice_date) = ? AND status != 'cancelled'
        GROUP BY ym
      `).get(ym) || { count: 0, revenue: 0, tax: 0 };

      months.push({
        month: ym.slice(5),
        yearMonth: ym,
        count: row.count,
        revenue: row.revenue,
        tax: row.tax,
      });
    }

    res.json(months);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
