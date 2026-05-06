const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vmdAPI', {
  // Vendors
  getVendors: () => ipcRenderer.invoke('vendors:getAll'),
  createVendor: (data) => ipcRenderer.invoke('vendors:create', data),
  updateVendor: (id, data) => ipcRenderer.invoke('vendors:update', id, data),
  deleteVendor: (id) => ipcRenderer.invoke('vendors:delete', id),

  // Products
  getProducts: (vendorId) => ipcRenderer.invoke('products:getAll', vendorId),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('products:update', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),

  // Invoices
  getInvoices: (filters) => ipcRenderer.invoke('invoices:getAll', filters),
  getInvoice: (id) => ipcRenderer.invoke('invoices:getById', id),
  createInvoice: (data) => ipcRenderer.invoke('invoices:create', data),
  updateInvoice: (id, data) => ipcRenderer.invoke('invoices:update', id, data),
  deleteInvoice: (id) => ipcRenderer.invoke('invoices:delete', id),
  getNextInvoiceNumber: () => ipcRenderer.invoke('invoices:nextNumber'),

  // GST
  getGSTData: (year) => ipcRenderer.invoke('gst:getAll', year),
  saveGSTData: (data) => ipcRenderer.invoke('gst:save', data),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (data) => ipcRenderer.invoke('settings:save', data),

  // Dashboard
  getDashboardSummary: () => ipcRenderer.invoke('dashboard:summary'),
  getMonthlyData: () => ipcRenderer.invoke('dashboard:monthly'),

  // P&L
  getPL: (year) => ipcRenderer.invoke('pl:get', year),

  // Backup
  exportBackup: () => ipcRenderer.invoke('backup:export'),
  importBackup: (filePath) => ipcRenderer.invoke('backup:import', filePath),

  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:save', options),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:open', options),
});
