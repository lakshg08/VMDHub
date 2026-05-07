function parseNullableFloat(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

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
    this.hsnCode = data.hsn_code || data.hsnCode || '';
    this.gstRate = parseFloat(data.gst_rate || data.gstRate || 18);
    this.quantityInStock = parseInt(data.quantity_in_stock || data.quantityInStock || 0, 10);
    this.unit = data.unit || 'pcs';
    this.notes = data.notes || '';
    this.description = data.description || '';
    this.length = parseNullableFloat(data.length);
    this.lengthUnit = data.length_unit || data.lengthUnit || 'mm';
    this.width = parseNullableFloat(data.width);
    this.widthUnit = data.width_unit || data.widthUnit || 'mm';
    this.height = parseNullableFloat(data.height);
    this.heightUnit = data.height_unit || data.heightUnit || 'mm';
    this.gauge = parseNullableFloat(data.gauge);
    this.gaugeUnit = data.gauge_unit || data.gaugeUnit || 'SWG';
    this.weight = parseNullableFloat(data.weight);
    this.weightUnit = data.weight_unit || data.weightUnit || 'kg';
    this.dimension = data.dimension || '';
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
      hsn_code: this.hsnCode,
      cost_price: this.costPrice,
      selling_price: this.sellingPrice,
      gst_rate: this.gstRate,
      quantity_in_stock: this.quantityInStock,
      unit: this.unit,
      notes: this.notes || null,
      description: this.description || null,
      length: this.length,
      length_unit: this.lengthUnit,
      width: this.width,
      width_unit: this.widthUnit,
      height: this.height,
      height_unit: this.heightUnit,
      gauge: this.gauge,
      gauge_unit: this.gaugeUnit,
      weight: this.weight,
      weight_unit: this.weightUnit,
      dimension: this.dimension || null,
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
      hsnCode: this.hsnCode,
      costPrice: this.costPrice,
      sellingPrice: this.sellingPrice,
      gstRate: this.gstRate,
      quantityInStock: this.quantityInStock,
      unit: this.unit,
      notes: this.notes,
      description: this.description,
      length: this.length,
      lengthUnit: this.lengthUnit,
      width: this.width,
      widthUnit: this.widthUnit,
      height: this.height,
      heightUnit: this.heightUnit,
      gauge: this.gauge,
      gaugeUnit: this.gaugeUnit,
      weight: this.weight,
      weightUnit: this.weightUnit,
      dimension: this.dimension,
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
    if (!this.hsnCode || this.hsnCode.trim() === '') errors.push('HSN code is required');
    if (!/^\d{4,8}$/.test(this.hsnCode.trim())) errors.push('HSN code must be 4–8 digits');
    if (!this.vendorId) errors.push('Vendor is required');
    if (this.costPrice < 0) errors.push('Cost price cannot be negative');
    if (this.sellingPrice < 0) errors.push('Selling price cannot be negative');
    if (this.gstRate < 0 || this.gstRate > 100) errors.push('GST rate must be between 0 and 100');
    return errors;
  }
}

module.exports = Product;
