class Vendor {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.contactPerson = data.contact_person || data.contactPerson || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.address = data.address || '';
    this.gstNumber = data.gst_number || data.gstNumber || '';
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  toDBObject() {
    return {
      name: this.name,
      contact_person: this.contactPerson,
      email: this.email,
      phone: this.phone,
      address: this.address,
      gst_number: this.gstNumber,
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      contactPerson: this.contactPerson,
      email: this.email,
      phone: this.phone,
      address: this.address,
      gstNumber: this.gstNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(json) {
    return new Vendor(json);
  }

  validate() {
    const errors = [];
    if (!this.name || this.name.trim() === '') errors.push('Vendor name is required');
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }
    return errors;
  }
}

module.exports = Vendor;
