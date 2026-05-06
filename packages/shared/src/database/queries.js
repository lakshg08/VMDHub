const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function getDatabase(dbPath) {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  database.exec(schema);
}

// Vendor queries
const vendorQueries = {
  getAll: (db) => db.prepare('SELECT * FROM vendors ORDER BY name').all(),
  getById: (db, id) => db.prepare('SELECT * FROM vendors WHERE id = ?').get(id),
  create: (db, data) => {
    const stmt = db.prepare(`
      INSERT INTO vendors (name, contact_person, email, phone, address, gst_number)
      VALUES (@name, @contact_person, @email, @phone, @address, @gst_number)
    `);
    return stmt.run(data);
  },
  update: (db, id, data) => {
    const stmt = db.prepare(`
      UPDATE vendors SET name=@name, contact_person=@contact_person,
      email=@email, phone=@phone, address=@address, gst_number=@gst_number
      WHERE id=@id
    `);
    return stmt.run({ ...data, id });
  },
  delete: (db, id) => db.prepare('DELETE FROM vendors WHERE id = ?').run(id),
  search: (db, query) => db.prepare(
    "SELECT * FROM vendors WHERE name LIKE ? OR contact_person LIKE ? OR email LIKE ?"
  ).all(`%${query}%`, `%${query}%`, `%${query}%`),
};

// Product queries
const productQueries = {
  getAll: (db) => db.prepare(`
    SELECT p.*, v.name as vendor_name FROM products p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    ORDER BY p.name
  `).all(),
  getById: (db, id) => db.prepare(`
    SELECT p.*, v.name as vendor_name FROM products p
    LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = ?
  `).get(id),
  getByVendor: (db, vendorId) => db.prepare(
    'SELECT * FROM products WHERE vendor_id = ? ORDER BY name'
  ).all(vendorId),
  create: (db, data) => {
    const stmt = db.prepare(`
      INSERT INTO products (name, sku, vendor_id, category, cost_price, selling_price,
      gst_rate, quantity_in_stock, unit, notes)
      VALUES (@name, @sku, @vendor_id, @category, @cost_price, @selling_price,
      @gst_rate, @quantity_in_stock, @unit, @notes)
    `);
    return stmt.run(data);
  },
  update: (db, id, data) => {
    const stmt = db.prepare(`
      UPDATE products SET name=@name, sku=@sku, vendor_id=@vendor_id, category=@category,
      cost_price=@cost_price, selling_price=@selling_price, gst_rate=@gst_rate,
      quantity_in_stock=@quantity_in_stock, unit=@unit, notes=@notes WHERE id=@id
    `);
    return stmt.run({ ...data, id });
  },
  delete: (db, id) => db.prepare('DELETE FROM products WHERE id = ?').run(id),
  updateStock: (db, id, quantity) => db.prepare(
    'UPDATE products SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?'
  ).run(quantity, id),
};

// Invoice queries
const invoiceQueries = {
  getAll: (db) => db.prepare('SELECT * FROM invoices ORDER BY invoice_date DESC').all(),
  getById: (db, id) => db.prepare('SELECT * FROM invoices WHERE id = ?').get(id),
  getByNumber: (db, number) => db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').get(number),
  getWithItems: (db, id) => {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (invoice) {
      invoice.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
    }
    return invoice;
  },
  getByDateRange: (db, startDate, endDate) => db.prepare(
    'SELECT * FROM invoices WHERE invoice_date BETWEEN ? AND ? ORDER BY invoice_date DESC'
  ).all(startDate, endDate),
  getByMonth: (db, yearMonth) => db.prepare(
    "SELECT * FROM invoices WHERE strftime('%Y-%m', invoice_date) = ? ORDER BY invoice_date DESC"
  ).all(yearMonth),
  create: (db, data) => {
    const stmt = db.prepare(`
      INSERT INTO invoices (invoice_number, invoice_date, invoice_type, customer_name,
      customer_email, customer_address, customer_gst, total_amount_before_tax, total_igst,
      total_cgst, total_sgst, total_tax, total_amount_after_tax, status, notes)
      VALUES (@invoice_number, @invoice_date, @invoice_type, @customer_name,
      @customer_email, @customer_address, @customer_gst, @total_amount_before_tax,
      @total_igst, @total_cgst, @total_sgst, @total_tax, @total_amount_after_tax, @status, @notes)
    `);
    return stmt.run(data);
  },
  update: (db, id, data) => {
    const stmt = db.prepare(`
      UPDATE invoices SET invoice_number=@invoice_number, invoice_date=@invoice_date,
      invoice_type=@invoice_type, customer_name=@customer_name, customer_email=@customer_email,
      customer_address=@customer_address, customer_gst=@customer_gst,
      total_amount_before_tax=@total_amount_before_tax, total_igst=@total_igst,
      total_cgst=@total_cgst, total_sgst=@total_sgst, total_tax=@total_tax,
      total_amount_after_tax=@total_amount_after_tax, status=@status, notes=@notes
      WHERE id=@id
    `);
    return stmt.run({ ...data, id });
  },
  delete: (db, id) => db.prepare('DELETE FROM invoices WHERE id = ?').run(id),
  getNextNumber: (db) => {
    const last = db.prepare(
      "SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1"
    ).get();
    if (!last) return 'INV-0001';
    const num = parseInt(last.invoice_number.replace('INV-', ''), 10) + 1;
    return `INV-${String(num).padStart(4, '0')}`;
  },
};

// Invoice items queries
const invoiceItemQueries = {
  getByInvoice: (db, invoiceId) => db.prepare(
    'SELECT * FROM invoice_items WHERE invoice_id = ?'
  ).all(invoiceId),
  create: (db, data) => {
    const stmt = db.prepare(`
      INSERT INTO invoice_items (invoice_id, product_id, item_name, quantity, unit_price,
      amount, gst_rate, igst, cgst, sgst, total_with_tax)
      VALUES (@invoice_id, @product_id, @item_name, @quantity, @unit_price,
      @amount, @gst_rate, @igst, @cgst, @sgst, @total_with_tax)
    `);
    return stmt.run(data);
  },
  deleteByInvoice: (db, invoiceId) => db.prepare(
    'DELETE FROM invoice_items WHERE invoice_id = ?'
  ).run(invoiceId),
};

// GST queries
const gstQueries = {
  getAll: (db) => db.prepare('SELECT * FROM monthly_gst ORDER BY year_month DESC').all(),
  getByMonth: (db, yearMonth) => db.prepare(
    'SELECT * FROM monthly_gst WHERE year_month = ?'
  ).get(yearMonth),
  upsert: (db, data) => {
    const stmt = db.prepare(`
      INSERT INTO monthly_gst (year_month, input_igst, input_cgst, input_sgst,
      input_notes, output_igst, output_cgst, output_sgst)
      VALUES (@year_month, @input_igst, @input_cgst, @input_sgst, @input_notes,
      @output_igst, @output_cgst, @output_sgst)
      ON CONFLICT(year_month) DO UPDATE SET
      input_igst=excluded.input_igst, input_cgst=excluded.input_cgst,
      input_sgst=excluded.input_sgst, input_notes=excluded.input_notes,
      output_igst=excluded.output_igst, output_cgst=excluded.output_cgst,
      output_sgst=excluded.output_sgst, updated_at=CURRENT_TIMESTAMP
    `);
    return stmt.run(data);
  },
};

// Settings queries
const settingsQueries = {
  get: (db) => db.prepare('SELECT * FROM settings LIMIT 1').get(),
  upsert: (db, data) => {
    const existing = db.prepare('SELECT id FROM settings LIMIT 1').get();
    if (existing) {
      const stmt = db.prepare(`
        UPDATE settings SET company_name=@company_name, company_email=@company_email,
        company_address=@company_address, company_gst=@company_gst,
        company_phone=@company_phone, company_website=@company_website,
        financial_year_start=@financial_year_start, currency=@currency
        WHERE id=@id
      `);
      return stmt.run({ ...data, id: existing.id });
    }
    const stmt = db.prepare(`
      INSERT INTO settings (company_name, company_email, company_address, company_gst,
      company_phone, company_website, financial_year_start, currency)
      VALUES (@company_name, @company_email, @company_address, @company_gst,
      @company_phone, @company_website, @financial_year_start, @currency)
    `);
    return stmt.run(data);
  },
};

module.exports = {
  getDatabase,
  vendorQueries,
  productQueries,
  invoiceQueries,
  invoiceItemQueries,
  gstQueries,
  settingsQueries,
};
