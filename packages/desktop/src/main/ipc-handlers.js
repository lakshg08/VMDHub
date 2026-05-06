const path = require('path');
const fs = require('fs');
const {
  vendorQueries, productQueries, invoiceQueries, invoiceItemQueries,
  gstQueries, settingsQueries,
} = require('@vmd/shared');
const InvoiceService = require('@vmd/shared/src/services/InvoiceService');
const PLService = require('@vmd/shared/src/services/PLService');
const BackupService = require('@vmd/shared/src/services/BackupService');
const Vendor = require('@vmd/shared/src/models/Vendor');
const Product = require('@vmd/shared/src/models/Product');

module.exports = function registerHandlers(ipcMain, db, app, dialog) {
  // Vendors
  ipcMain.handle('vendors:getAll', () => vendorQueries.getAll(db));
  ipcMain.handle('vendors:create', (_, data) => {
    const v = new Vendor(data);
    const errors = v.validate();
    if (errors.length) throw new Error(errors.join('; '));
    const result = vendorQueries.create(db, v.toDBObject());
    return vendorQueries.getById(db, result.lastInsertRowid);
  });
  ipcMain.handle('vendors:update', (_, id, data) => {
    vendorQueries.update(db, id, new Vendor(data).toDBObject());
    return vendorQueries.getById(db, id);
  });
  ipcMain.handle('vendors:delete', (_, id) => {
    vendorQueries.delete(db, id);
    return true;
  });

  // Products
  ipcMain.handle('products:getAll', (_, vendorId) =>
    vendorId ? productQueries.getByVendor(db, vendorId) : productQueries.getAll(db)
  );
  ipcMain.handle('products:create', (_, data) => {
    const p = new Product(data);
    const errors = p.validate();
    if (errors.length) throw new Error(errors.join('; '));
    const result = productQueries.create(db, p.toDBObject());
    return productQueries.getById(db, result.lastInsertRowid);
  });
  ipcMain.handle('products:update', (_, id, data) => {
    productQueries.update(db, id, new Product(data).toDBObject());
    return productQueries.getById(db, id);
  });
  ipcMain.handle('products:delete', (_, id) => {
    productQueries.delete(db, id);
    return true;
  });

  // Invoices
  const invSvc = new InvoiceService(db);
  ipcMain.handle('invoices:getAll', (_, filters = {}) => {
    if (filters.start_date && filters.end_date) {
      return invSvc.getByDateRange(filters.start_date, filters.end_date).map(i => i.toJSON());
    }
    if (filters.month) return invSvc.getByMonth(filters.month).map(i => i.toJSON());
    return invSvc.getAll().map(i => i.toJSON());
  });
  ipcMain.handle('invoices:getById', (_, id) => {
    const inv = invSvc.getById(id);
    return inv ? inv.toJSON() : null;
  });
  ipcMain.handle('invoices:create', (_, data) => invSvc.create(data).toJSON());
  ipcMain.handle('invoices:update', (_, id, data) => invSvc.update(id, data).toJSON());
  ipcMain.handle('invoices:delete', (_, id) => invSvc.delete(id));
  ipcMain.handle('invoices:nextNumber', () => invSvc.getNextInvoiceNumber());

  // GST
  ipcMain.handle('gst:getAll', (_, year) => {
    if (year) {
      return db.prepare("SELECT * FROM monthly_gst WHERE year_month LIKE ? ORDER BY year_month").all(`${year}-%`);
    }
    return gstQueries.getAll(db);
  });
  ipcMain.handle('gst:save', (_, data) => {
    gstQueries.upsert(db, data);
    return gstQueries.getByMonth(db, data.year_month);
  });

  // Settings
  ipcMain.handle('settings:get', () => settingsQueries.get(db) || {});
  ipcMain.handle('settings:save', (_, data) => {
    settingsQueries.upsert(db, data);
    return settingsQueries.get(db);
  });

  // Dashboard
  const plSvc = new PLService(db);
  ipcMain.handle('dashboard:summary', () => plSvc.getDashboardSummary());
  ipcMain.handle('dashboard:monthly', () => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount_after_tax), 0) as revenue
        FROM invoices WHERE strftime('%Y-%m', invoice_date) = ? AND status != 'cancelled'
      `).get(ym) || { count: 0, revenue: 0 };
      months.push({ month: ym.slice(5), yearMonth: ym, count: row.count, revenue: row.revenue });
    }
    return months;
  });

  // P&L
  ipcMain.handle('pl:get', (_, year) => {
    const products = productQueries.getAll(db);
    return plSvc.getMonthlyPL(year || new Date().getFullYear(), products);
  });

  // Backup
  const backupSvc = new BackupService(db);
  ipcMain.handle('backup:export', async () => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Backup',
      defaultPath: `vmdhub-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!filePath) return { success: false };
    const json = backupSvc.exportAll();
    fs.writeFileSync(filePath, json);
    backupSvc.recordBackup(path.basename(filePath), Buffer.byteLength(json), filePath);
    return { success: true, filePath };
  });
  ipcMain.handle('backup:import', async (_, filePath) => {
    let fp = filePath;
    if (!fp) {
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Import Backup',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
      });
      if (!filePaths || !filePaths[0]) return { success: false };
      fp = filePaths[0];
    }
    const json = fs.readFileSync(fp, 'utf8');
    return backupSvc.importAll(json);
  });

  // Dialogs
  ipcMain.handle('dialog:save', (_, options) => dialog.showSaveDialog(options));
  ipcMain.handle('dialog:open', (_, options) => dialog.showOpenDialog(options));
};
