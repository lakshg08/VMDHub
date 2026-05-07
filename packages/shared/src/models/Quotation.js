const GSTService = require('../services/GSTService');

class QuotationItem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.quotationId = data.quotation_id || data.quotationId || null;
    const rawProductId = data.product_id || data.productId;
    this.productId = rawProductId ? parseInt(rawProductId, 10) : null;
    this.itemName = data.item_name || data.itemName || '';
    this.hsnCode = data.hsn_code || data.hsnCode || '';
    this.quantity = parseFloat(data.quantity || 0);
    this.unitPrice = parseFloat(data.unit_price || data.unitPrice || 0);
    this.costPrice = parseFloat(data.cost_price || data.costPrice || 0);
    this.amount = parseFloat(data.amount || 0);
    this.gstRate = parseFloat(data.gst_rate || data.gstRate || 0);
    this.igst = parseFloat(data.igst || 0);
    this.cgst = parseFloat(data.cgst || 0);
    this.sgst = parseFloat(data.sgst || 0);
    this.totalWithTax = parseFloat(data.total_with_tax || data.totalWithTax || 0);
  }

  calculate(invoiceType) {
    this.amount = Math.round(this.quantity * this.unitPrice * 100) / 100;
    const gst = GSTService.calculateGST(this.amount, this.gstRate, invoiceType);
    this.igst = gst.igst;
    this.cgst = gst.cgst;
    this.sgst = gst.sgst;
    this.totalWithTax = Math.round((this.amount + gst.totalTax) * 100) / 100;
  }

  toDBObject(quotationId) {
    return {
      quotation_id: quotationId || this.quotationId,
      product_id: this.productId,
      item_name: this.itemName,
      hsn_code: this.hsnCode,
      quantity: this.quantity,
      unit_price: this.unitPrice,
      cost_price: this.costPrice,
      amount: this.amount,
      gst_rate: this.gstRate,
      igst: this.igst,
      cgst: this.cgst,
      sgst: this.sgst,
      total_with_tax: this.totalWithTax,
    };
  }

  toJSON() {
    return {
      id: this.id,
      quotationId: this.quotationId,
      productId: this.productId,
      itemName: this.itemName,
      hsnCode: this.hsnCode,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      costPrice: this.costPrice,
      amount: this.amount,
      gstRate: this.gstRate,
      igst: this.igst,
      cgst: this.cgst,
      sgst: this.sgst,
      totalWithTax: this.totalWithTax,
    };
  }
}

class Quotation {
  constructor(data = {}) {
    this.id = data.id || null;
    this.quotationNumber = data.quotation_number || data.quotationNumber || '';
    this.quotationDate = data.quotation_date || data.quotationDate || new Date().toISOString().split('T')[0];
    this.validUntil = data.valid_until || data.validUntil || '';
    this.invoiceType = data.invoice_type || data.invoiceType || 'intrastate';
    this.customerId = data.customer_id || data.customerId || null;
    this.customerName = data.customer_name || data.customerName || '';
    this.customerEmail = data.customer_email || data.customerEmail || '';
    this.customerPhone = data.customer_phone || data.customerPhone || '';
    this.customerGST = data.customer_gst || data.customerGST || '';
    this.customerAddress = data.customer_address || data.customerAddress || '';
    this.status = data.status || 'draft';
    this.notes = data.notes || '';
    this.items = (data.items || []).map(i => i instanceof QuotationItem ? i : new QuotationItem(i));
    this.totalAmountBeforeTax = parseFloat(data.total_amount_before_tax || data.totalAmountBeforeTax || 0);
    this.totalIGST = parseFloat(data.total_igst || data.totalIGST || 0);
    this.totalCGST = parseFloat(data.total_cgst || data.totalCGST || 0);
    this.totalSGST = parseFloat(data.total_sgst || data.totalSGST || 0);
    this.totalTax = parseFloat(data.total_tax || data.totalTax || 0);
    this.totalAmountAfterTax = parseFloat(data.total_amount_after_tax || data.totalAmountAfterTax || 0);
    this.convertedInvoiceId = data.converted_invoice_id || data.convertedInvoiceId || null;
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  calculateTotals() {
    this.totalAmountBeforeTax = 0;
    this.totalIGST = 0;
    this.totalCGST = 0;
    this.totalSGST = 0;
    this.totalTax = 0;
    this.totalAmountAfterTax = 0;

    for (const item of this.items) {
      item.calculate(this.invoiceType);
      this.totalAmountBeforeTax += item.amount;
      this.totalIGST += item.igst;
      this.totalCGST += item.cgst;
      this.totalSGST += item.sgst;
      this.totalTax += item.igst + item.cgst + item.sgst;
      this.totalAmountAfterTax += item.totalWithTax;
    }

    this.totalAmountBeforeTax = Math.round(this.totalAmountBeforeTax * 100) / 100;
    this.totalIGST = Math.round(this.totalIGST * 100) / 100;
    this.totalCGST = Math.round(this.totalCGST * 100) / 100;
    this.totalSGST = Math.round(this.totalSGST * 100) / 100;
    this.totalTax = Math.round(this.totalTax * 100) / 100;
    this.totalAmountAfterTax = Math.round(this.totalAmountAfterTax * 100) / 100;
  }

  toDBObject() {
    return {
      quotation_number: this.quotationNumber,
      quotation_date: this.quotationDate,
      valid_until: this.validUntil || null,
      invoice_type: this.invoiceType,
      customer_id: this.customerId,
      customer_name: this.customerName,
      customer_email: this.customerEmail || null,
      customer_phone: this.customerPhone || null,
      customer_gst: this.customerGST || null,
      customer_address: this.customerAddress || null,
      status: this.status,
      notes: this.notes || null,
      total_amount_before_tax: this.totalAmountBeforeTax,
      total_igst: this.totalIGST,
      total_cgst: this.totalCGST,
      total_sgst: this.totalSGST,
      total_tax: this.totalTax,
      total_amount_after_tax: this.totalAmountAfterTax,
      converted_invoice_id: this.convertedInvoiceId,
    };
  }

  toJSON() {
    return {
      id: this.id,
      quotationNumber: this.quotationNumber,
      quotationDate: this.quotationDate,
      validUntil: this.validUntil,
      invoiceType: this.invoiceType,
      customerId: this.customerId,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      customerGST: this.customerGST,
      customerAddress: this.customerAddress,
      status: this.status,
      notes: this.notes,
      items: this.items.map(i => i.toJSON()),
      totalAmountBeforeTax: this.totalAmountBeforeTax,
      totalIGST: this.totalIGST,
      totalCGST: this.totalCGST,
      totalSGST: this.totalSGST,
      totalTax: this.totalTax,
      totalAmountAfterTax: this.totalAmountAfterTax,
      convertedInvoiceId: this.convertedInvoiceId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = { Quotation, QuotationItem };
