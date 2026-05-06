class Calculations {
  static calculateMargin(costPrice, sellingPrice) {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  }

  static calculateMarkup(costPrice, sellingPrice) {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  }

  static calculatePL(invoices, products) {
    const productMap = new Map(products.map(p => [p.id, p]));
    let revenue = 0;
    let cost = 0;

    for (const invoice of invoices) {
      if (invoice.status === 'cancelled') continue;
      revenue += invoice.total_amount_before_tax || invoice.totalAmountBeforeTax || 0;

      const items = invoice.items || [];
      for (const item of items) {
        const qty = item.quantity || 0;
        // Prefer cost_price snapshotted at invoice time; fall back to current product
        // for rows created before the snapshot column was added (value will be 0).
        const snapshotCost = item.cost_price || item.costPrice || 0;
        const product = productMap.get(item.product_id || item.productId);
        const costPrice = snapshotCost || (product ? product.cost_price || product.costPrice || 0 : 0);
        cost += qty * costPrice;
      }
    }

    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 100) / 100,
    };
  }

  static calculateMonthlyTotals(invoices, yearMonth) {
    const filtered = invoices.filter(inv => {
      const date = inv.invoice_date || inv.invoiceDate || '';
      return date.startsWith(yearMonth) && inv.status !== 'cancelled';
    });

    const totals = filtered.reduce((acc, inv) => {
      acc.revenue += inv.total_amount_before_tax || inv.totalAmountBeforeTax || 0;
      acc.tax += inv.total_tax || inv.totalTax || 0;
      acc.total += inv.total_amount_after_tax || inv.totalAmountAfterTax || 0;
      acc.igst += inv.total_igst || inv.totalIGST || 0;
      acc.cgst += inv.total_cgst || inv.totalCGST || 0;
      acc.sgst += inv.total_sgst || inv.totalSGST || 0;
      acc.count += 1;
      return acc;
    }, { revenue: 0, tax: 0, total: 0, igst: 0, cgst: 0, sgst: 0, count: 0 });

    return {
      yearMonth,
      invoiceCount: totals.count,
      revenue: Math.round(totals.revenue * 100) / 100,
      tax: Math.round(totals.tax * 100) / 100,
      total: Math.round(totals.total * 100) / 100,
      igst: Math.round(totals.igst * 100) / 100,
      cgst: Math.round(totals.cgst * 100) / 100,
      sgst: Math.round(totals.sgst * 100) / 100,
    };
  }

  static calculateYearlyTotals(invoices, year) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const yearMonth = `${year}-${String(m).padStart(2, '0')}`;
      months.push(this.calculateMonthlyTotals(invoices, yearMonth));
    }

    const yearly = months.reduce((acc, m) => {
      acc.revenue += m.revenue;
      acc.tax += m.tax;
      acc.total += m.total;
      acc.igst += m.igst;
      acc.cgst += m.cgst;
      acc.sgst += m.sgst;
      acc.invoiceCount += m.invoiceCount;
      return acc;
    }, { revenue: 0, tax: 0, total: 0, igst: 0, cgst: 0, sgst: 0, invoiceCount: 0 });

    return { year, monthly: months, ...yearly };
  }

  static getFinancialYear(date, startMonth = 4) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    if (month >= startMonth) {
      return { start: year, end: year + 1, label: `FY ${year}-${year + 1}` };
    }
    return { start: year - 1, end: year, label: `FY ${year - 1}-${year}` };
  }

  static formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  static roundTo2(num) {
    return Math.round(num * 100) / 100;
  }
}

module.exports = Calculations;
