const { invoiceQueries, invoiceItemQueries } = require('../database/queries');
const { Invoice, InvoiceItem } = require('../models/Invoice');
const Validators = require('../utils/validators');

class InvoiceService {
  constructor(db) {
    this.db = db;
  }

  getAll() {
    const rows = invoiceQueries.getAll(this.db);
    return rows.map(r => new Invoice(r));
  }

  getById(id) {
    const row = invoiceQueries.getWithItems(this.db, id);
    if (!row) return null;
    return new Invoice(row);
  }

  getByDateRange(startDate, endDate) {
    const rows = invoiceQueries.getByDateRange(this.db, startDate, endDate);
    return rows.map(r => new Invoice(r));
  }

  getByMonth(yearMonth) {
    const rows = invoiceQueries.getByMonth(this.db, yearMonth);
    return rows.map(r => new Invoice(r));
  }

  create(data) {
    const invoice = new Invoice(data);
    invoice.calculateTotals();

    const errors = Validators.validateInvoice({ ...invoice.toDBObject(), items: invoice.items });
    if (errors.length > 0) throw new Error(errors.join('; '));

    if (!invoice.invoiceNumber) {
      invoice.invoiceNumber = invoiceQueries.getNextNumber(this.db);
    }

    const createWithItems = this.db.transaction(() => {
      const result = invoiceQueries.create(this.db, invoice.toDBObject());
      const invoiceId = result.lastInsertRowid;

      for (const item of invoice.items) {
        invoiceItemQueries.create(this.db, item.toDBObject(invoiceId));
      }

      return invoiceId;
    });

    const invoiceId = createWithItems();
    return this.getById(invoiceId);
  }

  update(id, data) {
    const existing = this.getById(id);
    if (!existing) throw new Error('Invoice not found');

    const invoice = new Invoice({ ...existing.toJSON(), ...data });
    invoice.calculateTotals();

    const updateWithItems = this.db.transaction(() => {
      invoiceQueries.update(this.db, id, invoice.toDBObject());
      invoiceItemQueries.deleteByInvoice(this.db, id);
      for (const item of invoice.items) {
        invoiceItemQueries.create(this.db, item.toDBObject(id));
      }
    });

    updateWithItems();
    return this.getById(id);
  }

  delete(id) {
    const existing = this.getById(id);
    if (!existing) throw new Error('Invoice not found');
    invoiceQueries.delete(this.db, id);
    return true;
  }

  getNextInvoiceNumber() {
    return invoiceQueries.getNextNumber(this.db);
  }
}

module.exports = InvoiceService;
