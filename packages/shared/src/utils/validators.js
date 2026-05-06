const { GST_RATES } = require('../constants');

class Validators {
  static isValidEmail(email) {
    if (!email) return true; // optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidPhone(phone) {
    if (!phone) return true;
    return /^[\d\s\-\+\(\)]{7,15}$/.test(phone);
  }

  static isValidGSTNumber(gst) {
    if (!gst) return true;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
  }

  static isValidGSTRate(rate) {
    return GST_RATES.includes(parseFloat(rate));
  }

  static isPositiveNumber(value) {
    return typeof value === 'number' && value >= 0 && isFinite(value);
  }

  static isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  static isValidDate(dateStr) {
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d);
  }

  static validateVendor(data) {
    const errors = [];
    if (!this.isNonEmptyString(data.name)) errors.push('Vendor name is required');
    if (!this.isValidEmail(data.email)) errors.push('Invalid email format');
    if (!this.isValidPhone(data.phone)) errors.push('Invalid phone number');
    if (!this.isValidGSTNumber(data.gst_number || data.gstNumber)) {
      errors.push('Invalid GST number format (e.g., 22AAAAA0000A1Z5)');
    }
    return errors;
  }

  static validateProduct(data) {
    const errors = [];
    if (!this.isNonEmptyString(data.name)) errors.push('Product name is required');
    if (!this.isNonEmptyString(data.sku)) errors.push('SKU is required');
    if (!data.vendor_id && !data.vendorId) errors.push('Vendor is required');
    const costPrice = parseFloat(data.cost_price || data.costPrice);
    const sellingPrice = parseFloat(data.selling_price || data.sellingPrice);
    if (!this.isPositiveNumber(costPrice)) errors.push('Cost price must be a non-negative number');
    if (!this.isPositiveNumber(sellingPrice)) errors.push('Selling price must be a non-negative number');
    const gstRate = parseFloat(data.gst_rate || data.gstRate);
    if (!this.isValidGSTRate(gstRate)) {
      errors.push(`GST rate must be one of: ${GST_RATES.join(', ')}`);
    }
    return errors;
  }

  static validateInvoice(data) {
    const errors = [];
    if (!this.isNonEmptyString(data.invoice_number || data.invoiceNumber)) {
      errors.push('Invoice number is required');
    }
    if (!this.isValidDate(data.invoice_date || data.invoiceDate)) {
      errors.push('Valid invoice date is required');
    }
    const invoiceType = data.invoice_type || data.invoiceType;
    if (!['interstate', 'intrastate'].includes(invoiceType)) {
      errors.push('Invoice type must be interstate or intrastate');
    }
    if (!this.isNonEmptyString(data.customer_name || data.customerName)) {
      errors.push('Customer name is required');
    }
    const items = data.items || [];
    if (items.length === 0) errors.push('Invoice must have at least one item');
    return errors;
  }
}

module.exports = Validators;
