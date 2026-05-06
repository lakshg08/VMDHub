const Calculations = require('../utils/calculations');

class PLService {
  constructor(db) {
    this.db = db;
  }

  getPLForPeriod(startDate, endDate, products) {
    const invoices = this.db.prepare(
      "SELECT * FROM invoices WHERE invoice_date BETWEEN ? AND ? AND status != 'cancelled'"
    ).all(startDate, endDate);

    for (const inv of invoices) {
      inv.items = this.db.prepare(
        'SELECT * FROM invoice_items WHERE invoice_id = ?'
      ).all(inv.id);
    }

    return Calculations.calculatePL(invoices, products || []);
  }

  getMonthlyPL(year, products) {
    const allInvoices = this.db.prepare(
      "SELECT * FROM invoices WHERE strftime('%Y', invoice_date) = ? AND status != 'cancelled'"
    ).all(String(year));

    for (const inv of allInvoices) {
      inv.items = this.db.prepare(
        'SELECT * FROM invoice_items WHERE invoice_id = ?'
      ).all(inv.id);
    }

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const yearMonth = `${year}-${String(m).padStart(2, '0')}`;
      const monthInvoices = allInvoices.filter(inv =>
        (inv.invoice_date || '').startsWith(yearMonth)
      );
      const pl = Calculations.calculatePL(monthInvoices, products || []);
      months.push({ yearMonth, ...pl, invoiceCount: monthInvoices.length });
    }

    const yearly = months.reduce((acc, m) => {
      acc.revenue += m.revenue;
      acc.cost += m.cost;
      acc.profit += m.profit;
      return acc;
    }, { revenue: 0, cost: 0, profit: 0 });

    yearly.margin = yearly.revenue > 0 ? (yearly.profit / yearly.revenue) * 100 : 0;

    return { year, monthly: months, yearly };
  }

  getDashboardSummary() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthInvoices = this.db.prepare(
      "SELECT * FROM invoices WHERE strftime('%Y-%m', invoice_date) = ? AND status != 'cancelled'"
    ).all(currentMonth);

    const totalRevenue = monthInvoices.reduce(
      (sum, inv) => sum + (inv.total_amount_after_tax || 0), 0
    );
    const totalTax = monthInvoices.reduce((sum, inv) => sum + (inv.total_tax || 0), 0);

    const vendorCount = this.db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;
    const productCount = this.db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalInvoices = this.db.prepare(
      "SELECT COUNT(*) as count FROM invoices WHERE status != 'cancelled'"
    ).get().count;

    const recentInvoices = this.db.prepare(
      "SELECT * FROM invoices ORDER BY created_at DESC LIMIT 5"
    ).all();

    return {
      currentMonth,
      monthlyRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyTax: Math.round(totalTax * 100) / 100,
      monthlyInvoiceCount: monthInvoices.length,
      totalVendors: vendorCount,
      totalProducts: productCount,
      totalInvoices,
      recentInvoices,
    };
  }
}

module.exports = PLService;
