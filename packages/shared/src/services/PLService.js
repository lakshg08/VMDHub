const prisma = require('../database/prisma');
const Calculations = require('../utils/calculations');

class PLService {
  async getPLForPeriod(startDate, endDate, products) {
    const invoices = await prisma.invoice.findMany({
      where: {
        invoice_date: { gte: startDate, lte: endDate },
        NOT: { status: 'cancelled' },
      },
      include: { items: true },
    });
    return Calculations.calculatePL(invoices, products || []);
  }

  async getMonthlyPL(year, products) {
    const allInvoices = await prisma.invoice.findMany({
      where: {
        invoice_date: { startsWith: String(year) },
        NOT: { status: 'cancelled' },
      },
      include: { items: true },
    });

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const yearMonth = `${year}-${String(m).padStart(2, '0')}`;
      const monthInvoices = allInvoices.filter((inv) =>
        (inv.invoice_date || '').startsWith(yearMonth)
      );
      const pl = Calculations.calculatePL(monthInvoices, products || []);
      months.push({ yearMonth, ...pl, invoiceCount: monthInvoices.length });
    }

    const yearly = months.reduce(
      (acc, m) => {
        acc.revenue += m.revenue;
        acc.cost += m.cost;
        acc.profit += m.profit;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0 }
    );
    yearly.margin = yearly.revenue > 0 ? (yearly.profit / yearly.revenue) * 100 : 0;

    return { year, monthly: months, yearly };
  }

  async getDashboardSummary() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [monthInvoices, vendorCount, productCount, totalInvoices, recentInvoices] =
      await Promise.all([
        prisma.invoice.findMany({
          where: { invoice_date: { startsWith: currentMonth }, NOT: { status: 'cancelled' } },
        }),
        prisma.vendor.count(),
        prisma.product.count(),
        prisma.invoice.count({ where: { NOT: { status: 'cancelled' } } }),
        prisma.invoice.findMany({ orderBy: { created_at: 'desc' }, take: 5 }),
      ]);

    const totalRevenue = monthInvoices.reduce(
      (sum, inv) => sum + (inv.total_amount_after_tax || 0),
      0
    );
    const totalTax = monthInvoices.reduce((sum, inv) => sum + (inv.total_tax || 0), 0);

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
