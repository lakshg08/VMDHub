class GSTService {
  static calculateGST(amount, gstRate, invoiceType) {
    const rate = parseFloat(gstRate) || 0;
    const amt = parseFloat(amount) || 0;

    if (invoiceType === 'interstate') {
      const igst = Math.round((amt * rate / 100) * 100) / 100;
      return { igst, cgst: 0, sgst: 0, totalTax: igst };
    }

    const halfRate = rate / 2;
    const cgst = Math.round((amt * halfRate / 100) * 100) / 100;
    const sgst = Math.round((amt * halfRate / 100) * 100) / 100;
    return { igst: 0, cgst, sgst, totalTax: cgst + sgst };
  }

  static calculateGSTPayable(monthlyData) {
    const {
      inputIGST = 0, inputCGST = 0, inputSGST = 0,
      outputIGST = 0, outputCGST = 0, outputSGST = 0,
    } = monthlyData;

    const payableIGST = Math.max(0, outputIGST - inputIGST);
    const payableCGST = Math.max(0, outputCGST - inputCGST);
    const payableSGST = Math.max(0, outputSGST - inputSGST);

    return {
      payableIGST,
      payableCGST,
      payableSGST,
      total: payableIGST + payableCGST + payableSGST,
      inputTotal: inputIGST + inputCGST + inputSGST,
      outputTotal: outputIGST + outputCGST + outputSGST,
    };
  }

  static generateGSTReport(invoices, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtered = invoices.filter(inv => {
      const d = new Date(inv.invoice_date || inv.invoiceDate);
      return d >= start && d <= end && inv.status !== 'cancelled';
    });

    const summary = filtered.reduce((acc, inv) => {
      acc.outputIGST += inv.total_igst || inv.totalIGST || 0;
      acc.outputCGST += inv.total_cgst || inv.totalCGST || 0;
      acc.outputSGST += inv.total_sgst || inv.totalSGST || 0;
      acc.totalTax += inv.total_tax || inv.totalTax || 0;
      acc.totalRevenue += inv.total_amount_after_tax || inv.totalAmountAfterTax || 0;
      acc.count += 1;
      return acc;
    }, {
      outputIGST: 0, outputCGST: 0, outputSGST: 0,
      totalTax: 0, totalRevenue: 0, count: 0,
    });

    // Group by month
    const byMonth = {};
    for (const inv of filtered) {
      const date = inv.invoice_date || inv.invoiceDate || '';
      const ym = date.substring(0, 7);
      if (!byMonth[ym]) {
        byMonth[ym] = { yearMonth: ym, outputIGST: 0, outputCGST: 0, outputSGST: 0, count: 0 };
      }
      byMonth[ym].outputIGST += inv.total_igst || inv.totalIGST || 0;
      byMonth[ym].outputCGST += inv.total_cgst || inv.totalCGST || 0;
      byMonth[ym].outputSGST += inv.total_sgst || inv.totalSGST || 0;
      byMonth[ym].count += 1;
    }

    return {
      period: `${startDate} to ${endDate}`,
      summary,
      monthly: Object.values(byMonth).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
      invoices: filtered,
    };
  }

  static getGSTRateLabel(rate) {
    const r = parseFloat(rate);
    if (r === 0) return 'Exempt (0%)';
    return `${r}%`;
  }
}

module.exports = GSTService;
