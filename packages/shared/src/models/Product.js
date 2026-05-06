class Product {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.sku = data.sku || '';
    this.vendorId = data.vendor_id || data.vendorId || null;
    this.vendorName = data.vendor_name || data.vendorName || '';
    this.category = data.category || '';
    this.costPrice = parseFloat(data.cost_price || data.costPrice || 0);
    this.sellingPrice = parseFloat(data.selling_price || data.sellingPrice || 0);
    this.gstRate = parseFloat(data.gst_rate || data.gstRate || 18);
    this.quantityInStock = parseInt(data.quantity_in_stock || data.quantityInStock || 0, 10);
    this.unit = data.unit || 'pcs';
    this.notes = data.notes || '';
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  get profitMargin() {
    if (this.costPrice === 0) return 0;
    return ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
  }

  get profitAmount() {
    return this.sellingPrice - this.costPrice;
  }

  get sellingPriceWithGST() {
    return this.sellingPrice * (1 + this.gstRate / 100);
  }

  toDBObject() {
    return {
      name: this.name,
      sku: this.sku,
      vendor_id: this.vendorId,
      category: this.category,
      cost_price: this.costPrice,
      selling_price: this.sellingPrice,
      gst_rate: this.gstRate,
      quantity_in_stock: this.quantityInStock,
      unit: this.unit,
      notes: this.notes,
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      category: this.category,
      costPrice: this.costPrice,
      sellingPrice: this.sellingPrice,
      gstRate: this.gstRate,
      quantityInStock: this.quantityInStock,
      unit: this.unit,
      notes: this.notes,
      profitMargin: this.profitMargin,
      profitAmount: this.profitAmount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(json) {
    return new Product(json);
  }

  validate() {
    const errors = [];
    if (!this.name || this.name.trim() === '') errors.push('Product name is required');
    if (!this.sku || this.sku.trim() === '') errors.push('SKU is required');
    if (!this.vendorId) errors.push('Vendor is required');
    if (this.costPrice < 0) errors.push('Cost price cannot be negative');
    if (this.sellingPrice < 0) errors.push('Selling price cannot be negative');
    if (this.gstRate < 0 || this.gstRate > 100) errors.push('GST rate must be between 0 and 100');
    return errors;
  }
}

module.exports = Product;
