class Customer {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.address = data.address || '';
    this.gstNumber = data.gst_number || data.gstNumber || '';
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  // Corporate if they have a GST number, individual otherwise
  get customerType() {
    return this.gstNumber && this.gstNumber.trim() !== '' ? 'corporate' : 'individual';
  }

  toDBObject() {
    return {
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      gst_number: this.gstNumber || null,
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      gstNumber: this.gstNumber,
      customerType: this.customerType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(json) {
    return new Customer(json);
  }

  validate() {
    const errors = [];
    if (!this.name || this.name.trim() === '') errors.push('Customer name is required');
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }
    if (this.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(this.gstNumber)) {
      errors.push('Invalid GST number format (e.g., 22AAAAA0000A1Z5)');
    }
    return errors;
  }
}

module.exports = Customer;
