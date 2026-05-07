const GSTService = require('../services/GSTService');

class InvoiceItem {
  constructor(data = {}) {
    this.id = data.id || null;
    this.invoiceId = data.invoice_id || data.invoiceId || null;
    this.productId = data.product_id || data.productId || null;
    this.itemName = data.item_name || data.itemName || '';
    this.quantity = parseFloat(data.quantity || 0);
    this.unitPrice = parseFloat(data.unit_price || data.unitPrice || 0);
    this.costPrice = parseFloat(data.cost_price || data.costPrice || 0);
    this.amount = parseFloat(data.amount || 0);
    this.gstRate = parseFloat(data.gst_rate || data.gstRate || 0);
    this.hsnCode = data.hsn_code || data.hsnCode || '';
    this.unit = data.unit || 'PCS';
    this.igst = parseFloat(data.igst || 0);
    this.cgst = parseFloat(data.cgst || 0);
    this.sgst = parseFloat(data.sgst || 0);
    this.totalWithTax = parseFloat(data.total_with_tax || data.totalWithTax || 0);
  }

  calculate(invoiceType) {
    this.amount = this.quantity * this.unitPrice;
    const gst = GSTService.calculateGST(this.amount, this.gstRate, invoiceType);
    this.igst = gst.igst;
    this.cgst = gst.cgst;
    this.sgst = gst.sgst;
    this.totalWithTax = this.amount + gst.totalTax;
  }

  toDBObject(invoiceId) {
    return {
      invoice_id: invoiceId || this.invoiceId,
      product_id: this.productId,
      item_name: this.itemName,
      quantity: this.quantity,
      unit_price: this.unitPrice,
      cost_price: this.costPrice,
      amount: this.amount,
      gst_rate: this.gstRate,
      hsn_code: this.hsnCode,
      unit: this.unit,
      igst: this.igst,
      cgst: this.cgst,
      sgst: this.sgst,
      total_with_tax: this.totalWithTax,
    };
  }

  toJSON() {
    return {
      id: this.id,
      invoiceId: this.invoiceId,
      productId: this.productId,
      itemName: this.itemName,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      costPrice: this.costPrice,
      amount: this.amount,
      gstRate: this.gstRate,
      hsnCode: this.hsnCode,
      unit: this.unit,
      igst: this.igst,
      cgst: this.cgst,
      sgst: this.sgst,
      totalWithTax: this.totalWithTax,
    };
  }
}

class Invoice {
  constructor(data = {}) {
    this.id = data.id || null;
    this.invoiceNumber = data.invoice_number || data.invoiceNumber || '';
    this.invoiceDate = data.invoice_date || data.invoiceDate || new Date().toISOString().split('T')[0];
    this.invoiceType = data.invoice_type || data.invoiceType || 'intrastate';
    this.customerName = data.customer_name || data.customerName || '';
    this.customerEmail = data.customer_email || data.customerEmail || '';
    this.customerAddress = data.customer_address || data.customerAddress || '';
    this.customerGST = data.customer_gst || data.customerGST || '';
    this.status = data.status || 'draft';
    this.notes = data.notes || '';
    this.bankUpiId = data.bank_upi_id || data.bankUpiId || '';
    this.bankName = data.bank_name || data.bankName || '';
    this.bankAccountNumber = data.bank_account_number || data.bankAccountNumber || '';
    this.bankAccountType = data.bank_account_type || data.bankAccountType || '';
    this.bankIfsc = data.bank_ifsc || data.bankIfsc || '';
    this.items = (data.items || []).map(i => i instanceof InvoiceItem ? i : new InvoiceItem(i));
    this.totalAmountBeforeTax = parseFloat(data.total_amount_before_tax || data.totalAmountBeforeTax || 0);
    this.totalIGST = parseFloat(data.total_igst || data.totalIGST || 0);
    this.totalCGST = parseFloat(data.total_cgst || data.totalCGST || 0);
    this.totalSGST = parseFloat(data.total_sgst || data.totalSGST || 0);
    this.totalTax = parseFloat(data.total_tax || data.totalTax || 0);
    this.totalAmountAfterTax = parseFloat(data.total_amount_after_tax || data.totalAmountAfterTax || 0);
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
      this.totalTax += (item.igst + item.cgst + item.sgst);
      this.totalAmountAfterTax += item.totalWithTax;
    }

    // Round to 2 decimal places
    this.totalAmountBeforeTax = Math.round(this.totalAmountBeforeTax * 100) / 100;
    this.totalIGST = Math.round(this.totalIGST * 100) / 100;
    this.totalCGST = Math.round(this.totalCGST * 100) / 100;
    this.totalSGST = Math.round(this.totalSGST * 100) / 100;
    this.totalTax = Math.round(this.totalTax * 100) / 100;
    this.totalAmountAfterTax = Math.round(this.totalAmountAfterTax * 100) / 100;
  }

  toDBObject() {
    return {
      invoice_number: this.invoiceNumber,
      invoice_date: this.invoiceDate,
      invoice_type: this.invoiceType,
      customer_name: this.customerName,
      customer_email: this.customerEmail,
      customer_address: this.customerAddress,
      customer_gst: this.customerGST,
      total_amount_before_tax: this.totalAmountBeforeTax,
      total_igst: this.totalIGST,
      total_cgst: this.totalCGST,
      total_sgst: this.totalSGST,
      total_tax: this.totalTax,
      total_amount_after_tax: this.totalAmountAfterTax,
      status: this.status,
      notes: this.notes,
      bank_upi_id: this.bankUpiId,
      bank_name: this.bankName,
      bank_account_number: this.bankAccountNumber,
      bank_account_type: this.bankAccountType,
      bank_ifsc: this.bankIfsc,
    };
  }

  toJSON() {
    return {
      id: this.id,
      invoiceNumber: this.invoiceNumber,
      invoiceDate: this.invoiceDate,
      invoiceType: this.invoiceType,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerAddress: this.customerAddress,
      customerGST: this.customerGST,
      status: this.status,
      notes: this.notes,
      bankUpiId: this.bankUpiId,
      bankName: this.bankName,
      bankAccountNumber: this.bankAccountNumber,
      bankAccountType: this.bankAccountType,
      bankIfsc: this.bankIfsc,
      items: this.items.map(i => i.toJSON()),
      totalAmountBeforeTax: this.totalAmountBeforeTax,
      totalIGST: this.totalIGST,
      totalCGST: this.totalCGST,
      totalSGST: this.totalSGST,
      totalTax: this.totalTax,
      totalAmountAfterTax: this.totalAmountAfterTax,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(json) {
    return new Invoice(json);
  }

  validate() {
    const errors = [];
    if (!this.invoiceNumber) errors.push('Invoice number is required');
    if (!this.invoiceDate) errors.push('Invoice date is required');
    if (!['interstate', 'intrastate'].includes(this.invoiceType)) {
      errors.push('Invoice type must be interstate or intrastate');
    }
    if (!this.customerName) errors.push('Customer name is required');
    if (!this.items || this.items.length === 0) errors.push('Invoice must have at least one item');
    return errors;
  }
}

module.exports = { Invoice, InvoiceItem };
