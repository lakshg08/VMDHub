import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BORDER = [180, 180, 180];
const BLACK = [0, 0, 0];
const LIGHT_GREY = [245, 245, 245];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function toWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000);
    return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000);
  }

  const rounded = Math.round(amount);
  if (rounded === 0) return 'INR Zero Only';
  return 'INR ' + convert(rounded).trim() + ' Only';
}

function r(n) { return Math.round(n * 100) / 100; }

function fmt(n) {
  return r(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Draw the company + quotation meta header block. Returns the Y position after the block.
function drawHeader(doc, q, settings, pageW, margin, isPage2) {
  const title = isPage2 ? 'Quotation (Continued)' : 'Quotation';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, pageW / 2, margin + 6, { align: 'center' });

  const headerTop = margin + 12;
  const headerH = 52;
  const midX = pageW / 2;

  // outer border
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.rect(margin, headerTop, pageW - margin * 2, headerH);
  // vertical divider
  doc.line(midX, headerTop, midX, headerTop + headerH);

  // --- LEFT: company info ---
  let y = headerTop + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(settings.company_name || 'VASTUMANDALAA', margin + 3, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (settings.company_address) {
    const addrLines = doc.splitTextToSize(settings.company_address, midX - margin - 6);
    addrLines.forEach(line => { y += 4.5; doc.text(line, margin + 3, y); });
  }
  if (settings.company_gst) { y += 4.5; doc.text(`GSTIN/UIN: ${settings.company_gst}`, margin + 3, y); }
  if (settings.company_phone) { y += 4.5; doc.text(`Phone: ${settings.company_phone}`, margin + 3, y); }

  // --- RIGHT: quotation meta grid ---
  const col1 = midX + 3;
  const col2 = midX + (pageW / 2 - margin) / 2 + 3;
  const rightW = (pageW / 2 - margin) / 2 - 3;
  let ry = headerTop;
  const rows = [
    ['Quotation No.', 'Dated'],
    [q.quotationNumber, formatDate(q.quotationDate)],
    ['Valid Until', 'Status'],
    [q.validUntil ? formatDate(q.validUntil) : '—', (q.status || '').charAt(0).toUpperCase() + (q.status || '').slice(1)],
    ['Invoice Type', ''],
    [q.invoiceType === 'interstate' ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)', ''],
  ];
  const rowH = headerH / rows.length;

  rows.forEach((row, i) => {
    const isLabel = i % 2 === 0;
    ry = headerTop + i * rowH;
    doc.setDrawColor(...BORDER);
    doc.line(midX, ry + rowH, pageW - margin, ry + rowH);
    if (row[1] !== undefined) {
      doc.line(col2 - 3, ry, col2 - 3, ry + rowH);
    }
    doc.setFont('helvetica', isLabel ? 'normal' : 'bold');
    doc.setFontSize(isLabel ? 7 : 8.5);
    doc.setTextColor(isLabel ? 100 : 0, isLabel ? 100 : 0, isLabel ? 100 : 0);
    doc.text(row[0], col1, ry + rowH * 0.65);
    if (row[1]) doc.text(row[1], col2, ry + rowH * 0.65);
  });
  doc.setTextColor(0, 0, 0);

  return headerTop + headerH;
}

// Draw Ship to / Bill to block. Returns Y after block.
function drawAddressBlock(doc, q, pageW, margin, startY) {
  const blockH = 38;
  const midX = pageW / 2;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.rect(margin, startY, pageW - margin * 2, blockH);
  doc.line(midX, startY, midX, startY + blockH);

  function drawSide(labelText, name, address, gst, x, maxW) {
    let y = startY + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(labelText, x, y);
    y += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    const nameLines = doc.splitTextToSize(name || '', maxW - 6);
    nameLines.forEach(l => { doc.text(l, x, y); y += 4.5; });
    if (address) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const addrLines = doc.splitTextToSize(address, maxW - 6);
      addrLines.slice(0, 4).forEach(l => { doc.text(l, x, y); y += 4; });
    }
    if (gst) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`GSTIN/UIN : ${gst}`, x, y);
    }
  }

  const halfW = midX - margin;
  drawSide('Consignee (Ship to)', q.customerName, q.customerAddress, q.customerGST, margin + 3, halfW);
  drawSide('Buyer (Bill to)', q.customerName, q.customerAddress, q.customerGST, midX + 3, halfW);

  return startY + blockH;
}

export function generateQuotationPdf(quotation, settings = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;

  // ── Page 1 header ──
  let y = drawHeader(doc, quotation, settings, pageW, margin, false);
  y = drawAddressBlock(doc, quotation, pageW, margin, y);

  // ── Build items table rows ──
  const items = quotation.items || [];
  const tableRows = items.map((item, i) => [
    i + 1,
    item.itemName || item.item_name || '',
    item.hsnCode || item.hsn_code || '',
    `${item.quantity}`,
    fmt(item.unitPrice ?? item.unit_price ?? 0),
    '',           // "per" column — unit not stored on item currently
    `${item.gstRate ?? item.gst_rate ?? 0}%`,
    fmt(item.amount ?? 0),
  ]);

  // ── GST summary by rate ──
  const gstByRate = {};
  items.forEach(item => {
    const rate = item.gstRate ?? item.gst_rate ?? 0;
    if (!gstByRate[rate]) gstByRate[rate] = { igst: 0, cgst: 0, sgst: 0 };
    gstByRate[rate].igst += item.igst ?? 0;
    gstByRate[rate].cgst += item.cgst ?? 0;
    gstByRate[rate].sgst += item.sgst ?? 0;
  });

  const isInterstate = (quotation.invoiceType || quotation.invoice_type) === 'interstate';
  const subtotal = quotation.totalAmountBeforeTax ?? quotation.total_amount_before_tax ?? 0;
  const totalTax = quotation.totalTax ?? quotation.total_tax ?? 0;
  const grandTotal = quotation.totalAmountAfterTax ?? quotation.total_amount_after_tax ?? 0;
  const rounded = Math.round(grandTotal);
  const roundOff = r(rounded - grandTotal);

  // ── Build footer rows (subtotal + gst lines + round off + total) ──
  const footerRows = [];
  footerRows.push([
    { content: fmt(subtotal), colSpan: 8, styles: { halign: 'right', fontStyle: 'normal' } },
  ]);

  Object.entries(gstByRate).sort((a, b) => a[0] - b[0]).forEach(([rate, gst]) => {
    if (isInterstate) {
      if (gst.igst > 0) {
        footerRows.push([{
          content: `IGST @ ${rate}%`,
          colSpan: 6,
          styles: { halign: 'right', fontStyle: 'italic' },
        }, { content: `${rate}`, styles: { halign: 'right', fontStyle: 'italic' } },
          { content: fmt(gst.igst), styles: { halign: 'right' } }]);
      }
    } else {
      if (gst.cgst > 0) {
        footerRows.push([{
          content: `CGST @ ${rate / 2}%`,
          colSpan: 6,
          styles: { halign: 'right', fontStyle: 'italic' },
        }, { content: `${rate / 2}`, styles: { halign: 'right', fontStyle: 'italic' } },
          { content: fmt(gst.cgst), styles: { halign: 'right' } }]);
        footerRows.push([{
          content: `SGST @ ${rate / 2}%`,
          colSpan: 6,
          styles: { halign: 'right', fontStyle: 'italic' },
        }, { content: `${rate / 2}`, styles: { halign: 'right', fontStyle: 'italic' } },
          { content: fmt(gst.sgst), styles: { halign: 'right' } }]);
      }
    }
  });

  if (Math.abs(roundOff) > 0.001) {
    footerRows.push([{
      content: 'Round Off',
      colSpan: 7,
      styles: { halign: 'right', fontStyle: 'italic' },
    }, { content: fmt(roundOff), styles: { halign: 'right' } }]);
  }

  footerRows.push([{
    content: 'Total',
    colSpan: 7,
    styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 },
  }, {
    content: `₹ ${fmt(rounded)}`,
    styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 },
  }]);

  // ── Draw table ──
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'Sl\nNo.', styles: { halign: 'center' } },
      { content: 'Description of Goods', styles: { halign: 'left' } },
      { content: 'HSN/SAC', styles: { halign: 'center' } },
      { content: 'Quantity', styles: { halign: 'center' } },
      { content: 'Rate', styles: { halign: 'right' } },
      { content: 'per', styles: { halign: 'center' } },
      { content: 'GST %', styles: { halign: 'center' } },
      { content: 'Amount', styles: { halign: 'right' } },
    ]],
    body: tableRows,
    foot: footerRows,
    columns: [
      { dataKey: 'sl', width: 8 },
      { dataKey: 'desc' },
      { dataKey: 'hsn', width: 20 },
      { dataKey: 'qty', width: 20 },
      { dataKey: 'rate', width: 22 },
      { dataKey: 'per', width: 10 },
      { dataKey: 'gst', width: 14 },
      { dataKey: 'amt', width: 24 },
    ],
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 10 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'right', cellWidth: 24 },
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: BLACK,
      lineColor: BORDER,
      lineWidth: 0.3,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      lineColor: BORDER,
      lineWidth: 0.3,
      textColor: BLACK,
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: BLACK,
      lineColor: BORDER,
      lineWidth: 0.3,
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    tableLineColor: BORDER,
    tableLineWidth: 0.4,
    showFoot: 'lastPage',
    didDrawPage: (data) => {
      // Re-draw header on continuation pages
      if (data.pageNumber > 1) {
        drawHeader(doc, quotation, settings, pageW, margin, true);
        drawAddressBlock(doc, quotation, pageW, margin, margin + 12 + 52);
      }
    },
  });

  // ── Bottom section (amount in words + bank + declaration) ──
  const finalY = doc.lastAutoTable.finalY + 2;
  const tableRight = pageW - margin;
  const tableLeft = margin;
  const fullW = tableRight - tableLeft;

  // Amount in words row
  const wordsBoxH = 12;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.rect(tableLeft, finalY, fullW, wordsBoxH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Amount Chargeable (in words)', tableLeft + 2, finalY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(toWords(rounded), tableLeft + 2, finalY + 9);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('E. & O.E', tableRight - 2, finalY + 9, { align: 'right' });

  // Bottom two-column block
  const bottomY = finalY + wordsBoxH;
  const bottomH = 40;
  const midX = pageW / 2;
  doc.setFont('helvetica', 'normal');
  doc.rect(tableLeft, bottomY, fullW, bottomH);
  doc.line(midX, bottomY, midX, bottomY + bottomH);

  // Left: Declaration
  let ly = bottomY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Declaration', tableLeft + 2, ly);
  ly += 4.5;
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  const declaration = 'We declare that this quotation shows the actual price of\nthe goods described and that all particulars are true and correct.';
  doc.text(declaration, tableLeft + 2, ly);

  // Bank details (if present)
  if (settings.bank_name || settings.bank_account || settings.bank_ifsc) {
    ly += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text("Company's Bank Details", tableLeft + 2, ly);
    ly += 4;
    doc.setTextColor(0, 0, 0);
    if (settings.bank_name) { doc.text(`Bank Name : ${settings.bank_name}`, tableLeft + 2, ly); ly += 4; }
    if (settings.bank_account) { doc.text(`A/c No.  : ${settings.bank_account}`, tableLeft + 2, ly); ly += 4; }
    if (settings.bank_ifsc) { doc.text(`Branch & IFS Code: ${settings.bank_ifsc}`, tableLeft + 2, ly); }
  }

  // Right: for COMPANYNAME + Authorised Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`for ${settings.company_name || 'VASTUMANDALAA'}`, tableRight - 2, bottomY + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Authorised Signatory', tableRight - 2, bottomY + bottomH - 4, { align: 'right' });

  // Page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 5, { align: 'center' });
  }

  doc.save(`${quotation.quotationNumber || 'quotation'}.pdf`);
}
