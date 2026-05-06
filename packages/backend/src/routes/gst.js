const express = require('express');
const { gstQueries } = require('@vmd/shared');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { year } = req.query;
    let data;
    if (year) {
      data = db.prepare(
        "SELECT * FROM monthly_gst WHERE year_month LIKE ? ORDER BY year_month"
      ).all(`${year}-%`);
    } else {
      data = gstQueries.getAll(db);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoice-summary', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { year } = req.query;
    const condition = year ? `WHERE strftime('%Y', invoice_date) = '${year}'` : '';
    const rows = db.prepare(`
      SELECT strftime('%Y-%m', invoice_date) as year_month,
        SUM(total_igst) as igst,
        SUM(total_cgst) as cgst,
        SUM(total_sgst) as sgst
      FROM invoices
      ${condition}
      AND status != 'cancelled'
      GROUP BY year_month
    `).all();
    const map = {};
    rows.forEach(r => { map[r.year_month] = r; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:yearMonth', (req, res) => {
  try {
    const db = req.app.locals.db;
    const data = gstQueries.getByMonth(db, req.params.yearMonth);
    res.json(data || { year_month: req.params.yearMonth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { year_month, input_igst = 0, input_cgst = 0, input_sgst = 0,
      input_notes = '', output_igst = 0, output_cgst = 0, output_sgst = 0 } = req.body;
    if (!year_month) return res.status(400).json({ error: 'year_month is required (YYYY-MM)' });
    gstQueries.upsert(db, { year_month, input_igst, input_cgst, input_sgst, input_notes, output_igst, output_cgst, output_sgst });
    res.json(gstQueries.getByMonth(db, year_month));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
