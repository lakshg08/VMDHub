class Exporters {
  static toJSON(data) {
    return JSON.stringify(
      { ...data, exportedAt: new Date().toISOString(), version: '1.0.0' },
      null,
      2
    );
  }

  static invoicesToCSV(invoices) {
    const headers = [
      'Invoice Number', 'Date', 'Type', 'Customer Name', 'Customer Email',
      'Customer GST', 'Amount Before Tax', 'IGST', 'CGST', 'SGST',
      'Total Tax', 'Total Amount', 'Status',
    ];

    const rows = invoices.map(inv => [
      inv.invoice_number || inv.invoiceNumber || '',
      inv.invoice_date || inv.invoiceDate || '',
      inv.invoice_type || inv.invoiceType || '',
      `"${(inv.customer_name || inv.customerName || '').replace(/"/g, '""')}"`,
      inv.customer_email || inv.customerEmail || '',
      inv.customer_gst || inv.customerGST || '',
      inv.total_amount_before_tax || inv.totalAmountBeforeTax || 0,
      inv.total_igst || inv.totalIGST || 0,
      inv.total_cgst || inv.totalCGST || 0,
      inv.total_sgst || inv.totalSGST || 0,
      inv.total_tax || inv.totalTax || 0,
      inv.total_amount_after_tax || inv.totalAmountAfterTax || 0,
      inv.status || '',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  static vendorsToCSV(vendors) {
    const headers = ['ID', 'Name', 'Contact Person', 'Email', 'Phone', 'Address', 'GST Number'];
    const rows = vendors.map(v => [
      v.id,
      `"${(v.name || '').replace(/"/g, '""')}"`,
      `"${(v.contact_person || v.contactPerson || '').replace(/"/g, '""')}"`,
      v.email || '',
      v.phone || '',
      `"${(v.address || '').replace(/"/g, '""')}"`,
      v.gst_number || v.gstNumber || '',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  static productsToCSV(products) {
    const headers = [
      'ID', 'Name', 'SKU', 'Vendor', 'Category', 'Cost Price',
      'Selling Price', 'GST Rate', 'Stock', 'Unit',
    ];
    const rows = products.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.sku || '',
      `"${(p.vendor_name || p.vendorName || '').replace(/"/g, '""')}"`,
      p.category || '',
      p.cost_price || p.costPrice || 0,
      p.selling_price || p.sellingPrice || 0,
      p.gst_rate || p.gstRate || 0,
      p.quantity_in_stock || p.quantityInStock || 0,
      p.unit || '',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  static plStatementToHTML(plData) {
    const { period, revenue, cost, profit, margin, monthly } = plData;
    const rows = (monthly || []).map(m => `
      <tr>
        <td>${m.yearMonth}</td>
        <td>${m.invoiceCount}</td>
        <td>₹${m.revenue.toFixed(2)}</td>
        <td>₹${(m.cost || 0).toFixed(2)}</td>
        <td>₹${(m.revenue - (m.cost || 0)).toFixed(2)}</td>
        <td>₹${m.tax.toFixed(2)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>P&L Statement - ${period}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #2c3e50; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f5f5f5; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .card { background: #f8f9fa; border-radius: 8px; padding: 15px; min-width: 150px; }
    .card h3 { margin: 0 0 5px 0; font-size: 14px; color: #666; }
    .card p { margin: 0; font-size: 22px; font-weight: bold; color: #2c3e50; }
  </style>
</head>
<body>
  <h1>Profit & Loss Statement</h1>
  <p>Period: ${period}</p>
  <div class="summary">
    <div class="card"><h3>Revenue</h3><p>₹${(revenue || 0).toFixed(2)}</p></div>
    <div class="card"><h3>Cost</h3><p>₹${(cost || 0).toFixed(2)}</p></div>
    <div class="card"><h3>Profit</h3><p>₹${(profit || 0).toFixed(2)}</p></div>
    <div class="card"><h3>Margin</h3><p>${(margin || 0).toFixed(1)}%</p></div>
  </div>
  <table>
    <thead>
      <tr><th>Month</th><th>Invoices</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Tax</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  }

  static gstReportToHTML(gstData) {
    const { period, months } = gstData;
    const rows = (months || []).map(m => `
      <tr>
        <td>${m.yearMonth}</td>
        <td>₹${(m.outputIGST || 0).toFixed(2)}</td>
        <td>₹${(m.outputCGST || 0).toFixed(2)}</td>
        <td>₹${(m.outputSGST || 0).toFixed(2)}</td>
        <td>₹${(m.inputIGST || 0).toFixed(2)}</td>
        <td>₹${(m.inputCGST || 0).toFixed(2)}</td>
        <td>₹${(m.inputSGST || 0).toFixed(2)}</td>
        <td>₹${(m.netPayable || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GST Report - ${period}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #27ae60; color: white; padding: 10px; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>GST Report - ${period}</h1>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Output IGST</th><th>Output CGST</th><th>Output SGST</th>
        <th>Input IGST</th><th>Input CGST</th><th>Input SGST</th>
        <th>Net Payable</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  }
}

module.exports = Exporters;
