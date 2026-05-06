const { getDatabase, customerQueries, vendorQueries, productQueries, invoiceQueries, invoiceItemQueries, gstQueries, settingsQueries } = require('./database/queries');
const Customer = require('./models/Customer');
const Vendor = require('./models/Vendor');
const Product = require('./models/Product');
const { Invoice, InvoiceItem } = require('./models/Invoice');
const MonthlyGST = require('./models/GST');
const GSTService = require('./services/GSTService');
const InvoiceService = require('./services/InvoiceService');
const PLService = require('./services/PLService');
const BackupService = require('./services/BackupService');
const Calculations = require('./utils/calculations');
const Validators = require('./utils/validators');
const Exporters = require('./utils/exporters');
const Importers = require('./utils/importers');
const constants = require('./constants');

module.exports = {
  // Database
  getDatabase,
  customerQueries,
  vendorQueries,
  productQueries,
  invoiceQueries,
  invoiceItemQueries,
  gstQueries,
  settingsQueries,
  // Models
  Customer,
  Vendor,
  Product,
  Invoice,
  InvoiceItem,
  MonthlyGST,
  // Services
  GSTService,
  InvoiceService,
  PLService,
  BackupService,
  // Utils
  Calculations,
  Validators,
  Exporters,
  Importers,
  // Constants
  ...constants,
};
