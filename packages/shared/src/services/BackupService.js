const Exporters = require('../utils/exporters');
const Importers = require('../utils/importers');

class BackupService {
  constructor(db) {
    this.db = db;
  }

  exportAll() {
    const vendors = this.db.prepare('SELECT * FROM vendors').all();
    const products = this.db.prepare('SELECT * FROM products').all();
    const invoices = this.db.prepare('SELECT * FROM invoices').all();

    for (const inv of invoices) {
      inv.items = this.db.prepare(
        'SELECT * FROM invoice_items WHERE invoice_id = ?'
      ).all(inv.id);
    }

    const monthlyGST = this.db.prepare('SELECT * FROM monthly_gst').all();
    const settings = this.db.prepare('SELECT * FROM settings LIMIT 1').get();

    return Exporters.toJSON({ vendors, products, invoices, monthlyGST, settings });
  }

  importAll(jsonString, options = { clearExisting: false }) {
    const data = Importers.fromJSON(jsonString);
    const errors = Importers.validateBackup(data);
    if (errors.length > 0) throw new Error(`Invalid backup: ${errors.join(', ')}`);

    const importTransaction = this.db.transaction(() => {
      if (options.clearExisting) {
        this.db.exec('DELETE FROM invoice_items');
        this.db.exec('DELETE FROM invoices');
        this.db.exec('DELETE FROM products');
        this.db.exec('DELETE FROM vendors');
        this.db.exec('DELETE FROM monthly_gst');
      }

      const vendorIdMap = {};
      for (const v of data.vendors) {
        const existing = this.db.prepare('SELECT id FROM vendors WHERE name = ?').get(v.name);
        if (!existing) {
          const result = this.db.prepare(`
            INSERT INTO vendors (name, contact_person, email, phone, address, gst_number)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(v.name, v.contact_person || v.contactPerson, v.email, v.phone, v.address, v.gst_number || v.gstNumber);
          vendorIdMap[v.id] = result.lastInsertRowid;
        } else {
          vendorIdMap[v.id] = existing.id;
        }
      }

      const productIdMap = {};
      for (const p of data.products) {
        const existing = this.db.prepare('SELECT id FROM products WHERE sku = ?').get(p.sku);
        if (!existing) {
          const vendorId = vendorIdMap[p.vendor_id] || p.vendor_id;
          const result = this.db.prepare(`
            INSERT INTO products (name, sku, vendor_id, category, cost_price, selling_price,
            gst_rate, quantity_in_stock, unit, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(p.name, p.sku, vendorId, p.category, p.cost_price, p.selling_price,
            p.gst_rate, p.quantity_in_stock, p.unit, p.notes);
          productIdMap[p.id] = result.lastInsertRowid;
        } else {
          productIdMap[p.id] = existing.id;
        }
      }

      for (const inv of data.invoices) {
        const existing = this.db.prepare(
          'SELECT id FROM invoices WHERE invoice_number = ?'
        ).get(inv.invoice_number || inv.invoiceNumber);
        if (!existing) {
          const result = this.db.prepare(`
            INSERT INTO invoices (invoice_number, invoice_date, invoice_type, customer_name,
            customer_email, customer_address, customer_gst, total_amount_before_tax,
            total_igst, total_cgst, total_sgst, total_tax, total_amount_after_tax, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            inv.invoice_number || inv.invoiceNumber, inv.invoice_date || inv.invoiceDate,
            inv.invoice_type || inv.invoiceType, inv.customer_name || inv.customerName,
            inv.customer_email || inv.customerEmail, inv.customer_address || inv.customerAddress,
            inv.customer_gst || inv.customerGST, inv.total_amount_before_tax || inv.totalAmountBeforeTax || 0,
            inv.total_igst || inv.totalIGST || 0, inv.total_cgst || inv.totalCGST || 0,
            inv.total_sgst || inv.totalSGST || 0, inv.total_tax || inv.totalTax || 0,
            inv.total_amount_after_tax || inv.totalAmountAfterTax || 0,
            inv.status || 'draft', inv.notes
          );

          const invoiceId = result.lastInsertRowid;
          const items = inv.items || [];
          for (const item of items) {
            const productId = productIdMap[item.product_id] || item.product_id;
            this.db.prepare(`
              INSERT INTO invoice_items (invoice_id, product_id, item_name, quantity, unit_price,
              amount, gst_rate, igst, cgst, sgst, total_with_tax)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(invoiceId, productId, item.item_name || item.itemName, item.quantity,
              item.unit_price || item.unitPrice, item.amount, item.gst_rate || item.gstRate,
              item.igst, item.cgst, item.sgst, item.total_with_tax || item.totalWithTax);
          }
        }
      }

      this.db.prepare(`
        INSERT INTO backup_history (backup_filename, backup_type)
        VALUES (?, 'manual')
      `).run(`restore_${new Date().toISOString()}`);
    });

    importTransaction();
    return { success: true, message: 'Backup restored successfully' };
  }

  recordBackup(filename, size, location) {
    return this.db.prepare(`
      INSERT INTO backup_history (backup_filename, backup_size, backup_location, backup_type)
      VALUES (?, ?, ?, 'manual')
    `).run(filename, size, location);
  }

  getBackupHistory() {
    return this.db.prepare('SELECT * FROM backup_history ORDER BY backup_date DESC').all();
  }
}

module.exports = BackupService;
