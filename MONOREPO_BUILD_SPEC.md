# VMDHub - Complete Build Specification

## Project Overview

Build a complete cross-platform vendor and invoice management system in the VMDHub monorepo:
- Browser web app (packages/web)
- Desktop app (packages/desktop) - Windows/Mac with Electron
- Mobile app (packages/mobile) - iOS/Android with React Native
- Shared backend & database (packages/shared)
- Comprehensive financial tracking and GST management

All platforms share same business logic and data using monorepo structure.

---

## Monorepo Structure (Inside VMDHub Repository)

```
VMDHub/
├── packages/
│   ├── shared/                  (Shared code for all platforms)
│   │   ├── src/
│   │   │   ├── database/        (SQLite schema & queries)
│   │   │   │   ├── schema.sql
│   │   │   │   ├── queries.js
│   │   │   │   └── migrations/
│   │   │   ├── models/          (Data models)
│   │   │   │   ├── Vendor.js
│   │   │   │   ├── Product.js
│   │   │   │   ├── Invoice.js
│   │   │   │   └── GST.js
│   │   │   ├── utils/           (Shared utilities)
│   │   │   │   ├── calculations.js    (Profit, margins, GST)
│   │   │   │   ├── validators.js
│   │   │   │   ├── exporters.js       (CSV, JSON, PDF)
│   │   │   │   └── importers.js       (Backup restore)
│   │   │   ├── services/        (Business logic)
│   │   │   │   ├── InvoiceService.js
│   │   │   │   ├── GSTService.js
│   │   │   │   ├── PLService.js       (P&L calculations)
│   │   │   │   └── BackupService.js
│   │   │   └── constants/
│   │   │       └── index.js     (GST rates, etc)
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── web/                     (VMDHub Web - Browser web app)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── InvoiceForm.js
│   │   │   │   ├── VendorList.js
│   │   │   │   ├── ProductList.js
│   │   │   │   ├── PLStatement.js
│   │   │   │   ├── GSTTracker.js
│   │   │   │   └── Settings.js
│   │   │   ├── pages/
│   │   │   ├── App.js
│   │   │   ├── index.js
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── desktop/                 (VMDHub Desktop - Electron desktop app)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── main.js      (Electron entry point)
│   │   │   │   ├── preload.js   (IPC bridge)
│   │   │   │   └── background.js
│   │   │   ├── renderer/        (React UI)
│   │   │   │   ├── components/  (Same as web)
│   │   │   │   ├── pages/
│   │   │   │   ├── App.js
│   │   │   │   └── index.js
│   │   │   ├── backend/         (Node.js API)
│   │   │   │   ├── api/
│   │   │   │   │   ├── vendors.js
│   │   │   │   │   ├── products.js
│   │   │   │   │   ├── invoices.js
│   │   │   │   │   └── gst.js
│   │   │   │   ├── database.js
│   │   │   │   └── ipc-handlers.js
│   │   │   └── assets/
│   │   ├── package.json
│   │   ├── electron-builder.yml
│   │   └── README.md
│   │
│   ├── mobile/                  (VMDHub Mobile - React Native mobile app)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── HomeScreen.js
│   │   │   │   ├── InvoiceScreen.js
│   │   │   │   ├── VendorScreen.js
│   │   │   │   ├── ReportScreen.js
│   │   │   │   └── SettingsScreen.js
│   │   │   ├── components/      (Reuse from shared)
│   │   │   ├── navigation/
│   │   │   ├── database/        (SQLite for React Native)
│   │   │   ├── App.js
│   │   │   └── index.js
│   │   ├── android/             (Android native code)
│   │   ├── ios/                 (iOS native code)
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── backend/                 (Optional: Cloud sync API)
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── middleware/
│       │   └── server.js
│       ├── package.json
│       └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── scripts/
│   ├── setup.sh                 (Setup monorepo)
│   ├── build-all.sh             (Build all packages)
│   ├── build-web.sh
│   ├── build-desktop.sh
│   ├── build-mobile.sh
│   └── test.sh
│
├── .gitignore
├── package.json                 (Root package.json - lerna/yarn workspaces)
├── lerna.json                   (Lerna configuration)
└── README.md                    (Main project README)
```
├── packages/
│   ├── shared/                  (Shared code for all platforms)
│   │   ├── src/
│   │   │   ├── database/        (SQLite schema & queries)
│   │   │   │   ├── schema.sql
│   │   │   │   ├── queries.js
│   │   │   │   └── migrations/
│   │   │   ├── models/          (Data models)
│   │   │   │   ├── Vendor.js
│   │   │   │   ├── Product.js
│   │   │   │   ├── Invoice.js
│   │   │   │   └── GST.js
│   │   │   ├── utils/           (Shared utilities)
│   │   │   │   ├── calculations.js    (Profit, margins, GST)
│   │   │   │   ├── validators.js
│   │   │   │   ├── exporters.js       (CSV, JSON, PDF)
│   │   │   │   └── importers.js       (Backup restore)
│   │   │   ├── services/        (Business logic)
│   │   │   │   ├── InvoiceService.js
│   │   │   │   ├── GSTService.js
│   │   │   │   ├── PLService.js       (P&L calculations)
│   │   │   │   └── BackupService.js
│   │   │   └── constants/
│   │   │       └── index.js     (GST rates, etc)
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── web/                     (VMDHub Web - Browser web app)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── InvoiceForm.js
│   │   │   │   ├── VendorList.js
│   │   │   │   ├── ProductList.js
│   │   │   │   ├── PLStatement.js
│   │   │   │   ├── GSTTracker.js
│   │   │   │   └── Settings.js
│   │   │   ├── pages/
│   │   │   ├── App.js
│   │   │   ├── index.js
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── desktop/                 (VMDHub Desktop - Electron desktop app)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── main.js      (Electron entry point)
│   │   │   │   ├── preload.js   (IPC bridge)
│   │   │   │   └── background.js
│   │   │   ├── renderer/        (React UI)
│   │   │   │   ├── components/  (Same as web)
│   │   │   │   ├── pages/
│   │   │   │   ├── App.js
│   │   │   │   └── index.js
│   │   │   ├── backend/         (Node.js API)
│   │   │   │   ├── api/
│   │   │   │   │   ├── vendors.js
│   │   │   │   │   ├── products.js
│   │   │   │   │   ├── invoices.js
│   │   │   │   │   └── gst.js
│   │   │   │   ├── database.js
│   │   │   │   └── ipc-handlers.js
│   │   │   └── assets/
│   │   ├── package.json
│   │   ├── electron-builder.yml
│   │   └── README.md
│   │
│   ├── mobile/                  (VMDHub Mobile - React Native mobile app)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── HomeScreen.js
│   │   │   │   ├── InvoiceScreen.js
│   │   │   │   ├── VendorScreen.js
│   │   │   │   ├── ReportScreen.js
│   │   │   │   └── SettingsScreen.js
│   │   │   ├── components/      (Reuse from shared)
│   │   │   ├── navigation/
│   │   │   ├── database/        (SQLite for React Native)
│   │   │   ├── App.js
│   │   │   └── index.js
│   │   ├── android/             (Android native code)
│   │   ├── ios/                 (iOS native code)
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── backend/                 (Optional: Cloud sync API)
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── middleware/
│       │   └── server.js
│       ├── package.json
│       └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── scripts/
│   ├── setup.sh                 (Setup monorepo)
│   ├── build-all.sh             (Build all packages)
│   ├── build-web.sh
│   ├── build-desktop.sh
│   ├── build-mobile.sh
│   └── test.sh
│
├── .gitignore
├── package.json                 (Root package.json - lerna/yarn workspaces)
├── lerna.json                   (or yarn workspaces)
└── README.md
```

---

## Database Schema

### SQLite Schema (shared/src/database/schema.sql)

```sql
-- Vendors Table
CREATE TABLE vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  vendor_id INTEGER NOT NULL,
  category TEXT,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Invoices Table
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  invoice_type TEXT NOT NULL CHECK(invoice_type IN ('interstate', 'intrastate')),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  customer_gst TEXT,
  total_amount_before_tax DECIMAL(12,2) NOT NULL,
  total_igst DECIMAL(10,2) DEFAULT 0,
  total_cgst DECIMAL(10,2) DEFAULT 0,
  total_sgst DECIMAL(10,2) DEFAULT 0,
  total_tax DECIMAL(10,2) NOT NULL,
  total_amount_after_tax DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  igst DECIMAL(10,2) DEFAULT 0,
  cgst DECIMAL(10,2) DEFAULT 0,
  sgst DECIMAL(10,2) DEFAULT 0,
  total_with_tax DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Monthly GST Tracking Table
CREATE TABLE monthly_gst (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_month TEXT UNIQUE NOT NULL,
  input_igst DECIMAL(10,2) DEFAULT 0,
  input_cgst DECIMAL(10,2) DEFAULT 0,
  input_sgst DECIMAL(10,2) DEFAULT 0,
  input_notes TEXT,
  output_igst DECIMAL(10,2) DEFAULT 0,
  output_cgst DECIMAL(10,2) DEFAULT 0,
  output_sgst DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  company_email TEXT,
  company_address TEXT,
  company_gst TEXT,
  company_phone TEXT,
  company_website TEXT,
  financial_year_start INTEGER DEFAULT 4,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup History Table (optional)
CREATE TABLE backup_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  backup_filename TEXT,
  backup_size INTEGER,
  backup_location TEXT,
  backup_type TEXT CHECK(backup_type IN ('manual', 'automatic'))
);

-- Create Indexes
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
```

---

## Shared Code Specifications

### shared/src/models/Invoice.js

```javascript
class Invoice {
  constructor(data) {
    this.id = data.id;
    this.invoiceNumber = data.invoiceNumber;
    this.invoiceDate = data.invoiceDate;
    this.invoiceType = data.invoiceType; // 'interstate' or 'intrastate'
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail;
    this.customerAddress = data.customerAddress;
    this.customerGST = data.customerGST;
    this.items = data.items; // Array of invoice items
    this.totalAmountBeforeTax = 0;
    this.totalIGST = 0;
    this.totalCGST = 0;
    this.totalSGST = 0;
    this.totalTax = 0;
    this.totalAmountAfterTax = 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  calculateTotals() {
    // Calculate all GST based on invoice type
    // If interstate: use IGST only
    // If intrastate: split CGST and SGST 50-50
  }

  toJSON() {
    // Export format for backup
  }

  static fromJSON(json) {
    // Import from backup
  }
}

module.exports = Invoice;
```

### shared/src/services/GSTService.js

```javascript
class GSTService {
  /**
   * Calculate GST for invoice
   * @param {number} amount - Amount before tax
   * @param {number} gstRate - GST rate (e.g., 18)
   * @param {string} invoiceType - 'interstate' or 'intrastate'
   * @returns {object} - {igst, cgst, sgst, totalTax}
   */
  static calculateGST(amount, gstRate, invoiceType) {
    if (invoiceType === 'interstate') {
      const igst = (amount * gstRate) / 100;
      return { igst, cgst: 0, sgst: 0, totalTax: igst };
    } else {
      const halfRate = gstRate / 2;
      const cgst = (amount * halfRate) / 100;
      const sgst = (amount * halfRate) / 100;
      return { igst: 0, cgst, sgst, totalTax: cgst + sgst };
    }
  }

  /**
   * Calculate monthly GST payable
   * @param {object} monthlyData - {input, output}
   * @returns {object} - {payableIGST, payableCGST, payableSGST, total}
   */
  static calculateGSTPayable(monthlyData) {
    // Output - Input for each component
  }

  /**
   * Generate GST report for period
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {object} - GST report data
   */
  static generateGSTReport(startDate, endDate) {
    // Aggregate GST data
  }
}

module.exports = GSTService;
```

### shared/src/utils/calculations.js

```javascript
class Calculations {
  /**
   * Calculate profit margin
   * @param {number} costPrice
   * @param {number} sellingPrice
   * @returns {number} - Profit margin percentage
   */
  static calculateMargin(costPrice, sellingPrice) {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  }

  /**
   * Calculate P&L for period
   * @param {Array} invoices - Invoices for period
   * @param {Array} products - All products
   * @returns {object} - {revenue, cost, profit, margin}
   */
  static calculatePL(invoices, products) {
    // Sum revenue from invoices
    // Sum cost from products in invoices
    // Calculate profit and margin
  }

  /**
   * Calculate monthly totals
   * @param {Array} invoices
   * @param {Date} month
   * @returns {object} - Monthly totals
   */
  static calculateMonthlyTotals(invoices, month) {
    // Filter invoices by month
    // Sum revenue, cost, profit
  }
}

module.exports = Calculations;
```

### shared/src/utils/exporters.js

```javascript
class Exporters {
  /**
   * Export to JSON (backup)
   * @param {object} data - All app data
   * @returns {string} - JSON string
   */
  static toJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to CSV
   * @param {Array} invoices
   * @returns {string} - CSV content
   */
  static invoicesToCSV(invoices) {
    // Format invoices as CSV
  }

  /**
   * Export to PDF
   * @param {object} report - Report data
   * @returns {Buffer} - PDF buffer
   */
  static reportToPDF(report) {
    // Generate PDF
  }

  /**
   * Export P&L statement
   * @param {object} plData
   * @returns {string} - HTML or PDF
   */
  static plStatementToPDF(plData) {
    // Format P&L as PDF
  }
}

module.exports = Exporters;
```

---

## Package.json Specifications

### Root package.json

```json
{
  "name": "vmdhub-monorepo",
  "version": "1.0.0",
  "description": "VMDHub - Cross-platform vendor management and invoice system",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "setup": "npm install && npm run bootstrap",
    "bootstrap": "lerna bootstrap",
    "build:all": "lerna run build",
    "build:web": "lerna run build --scope=@vmd/web",
    "build:desktop": "lerna run build --scope=@vmd/desktop",
    "build:mobile": "lerna run build --scope=@vmd/mobile",
    "dev:web": "lerna run dev --scope=@vmd/web",
    "dev:desktop": "lerna run dev --scope=@vmd/desktop",
    "dev:mobile": "lerna run dev --scope=@vmd/mobile",
    "test": "lerna run test",
    "lint": "lerna run lint",
    "clean": "lerna clean --yes && rm -rf node_modules"
  },
  "devDependencies": {
    "lerna": "^7.0.0"
  }
}
```

### shared/package.json

```json
{
  "name": "@vmd/shared",
  "version": "1.0.0",
  "description": "VMDHub Shared - Shared code for all platforms",
  "main": "src/index.js",
  "scripts": {
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "better-sqlite3": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}
```

### web/package.json

```json
{
  "name": "@vmd/web",
  "version": "1.0.0",
  "description": "VMDHub Web - Browser application",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "dev": "react-scripts start"
  },
  "dependencies": {
    "@vmd/shared": "*",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0"
  },
  "devDependencies": {
    "react-scripts": "5.0.0"
  }
}
```

### desktop/package.json

```json
{
  "name": "@vmd/desktop",
  "version": "1.0.0",
  "description": "VMDHub Desktop - Electron application",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron-dev .",
    "build": "electron-builder",
    "build:win": "electron-builder -w",
    "build:mac": "electron-builder -m"
  },
  "dependencies": {
    "@vmd/shared": "*",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "electron": "^latest"
  },
  "devDependencies": {
    "electron-builder": "^24.0.0",
    "electron-dev": "^0.0.0"
  }
}
```

### mobile/package.json

```json
{
  "name": "@vmd/mobile",
  "version": "1.0.0",
  "description": "VMDHub Mobile - React Native application",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "cd ios && xcodebuild -scheme VMDHub -configuration Release"
  },
  "dependencies": {
    "@vmd/shared": "*",
    "react": "^18.0.0",
    "react-native": "^0.72.0",
    "react-native-sqlite": "^2.0.0"
  }
}
```

---

## Build Instructions for Claude Code

### Prerequisites
- Node.js 16+
- Git
- For Desktop: Electron, electron-builder
- For Mobile: Android Studio, Xcode (Mac only)

### Full Build Process

```bash
# 1. Setup monorepo
npm run setup

# 2. Build shared code
npm run build --workspace=@financial-app/shared

# 3. Build all packages
npm run build:all

# 4. Or build individual packages
npm run build:web
npm run build:desktop
npm run build:mobile
```

### Output Artifacts

```
dist/
├── web/
│   └── build/               (Static website)
├── desktop/
│   ├── Financial-App-1.0.0.exe      (Windows)
│   ├── Financial-App-1.0.0.dmg      (Mac)
│   └── Financial-App-1.0.0.zip      (Linux)
└── mobile/
    ├── app-release.apk     (Android)
    └── Financial-App.ipa   (iOS)
```

---

## Code Generation Requirements

### For Each Package

1. **Create folder structure** - Use exact paths
2. **Generate package.json** - Use provided specs
3. **Generate source files** - Complete, working code
4. **Generate configuration** - electron-builder.yml, tsconfig.json, etc.
5. **Generate documentation** - README.md for each package
6. **No placeholders** - All code must be complete and functional

### Code Quality

- All code must work without errors
- All imports/exports must be correct
- All database queries must be valid
- All calculations must be accurate
- All exports/imports must function
- Proper error handling throughout
- Comments for complex logic

---

## Dangerous Mode Instructions

These specifications are designed for Claude Code to run in **dangerously skip permission mode**:

1. **Skip all permission prompts** - Create all files automatically
2. **No confirmation dialogs** - Just build
3. **Overwrite existing files** - If directory exists, overwrite
4. **Run scripts automatically** - Don't wait for user input
5. **Install all dependencies** - npm install without asking
6. **Build all artifacts** - Create .exe, .apk, .ipa automatically
7. **No pauses** - Run continuously overnight

### Dangerous Mode Flags for Claude Code

```bash
claude-code --dangerous --skip-permissions \
  --project financial-app-monorepo \
  --spec MONOREPO_SPEC.md \
  --build-all \
  --overnight
```

---

## Deliverables

After Claude Code runs overnight, you should have:

```
✅ VMDHub Shared Code Library
   ├─ Database schema & migrations
   ├─ Data models
   ├─ Business logic services
   ├─ Utility functions
   └─ All tested & working

✅ VMDHub Web Application
   ├─ React components
   ├─ All features (invoicing, GST, P&L)
   ├─ Responsive design
   └─ Production build ready

✅ VMDHub Desktop Application
   ├─ Electron wrapper
   ├─ SQLite database
   ├─ Node.js backend
   ├─ Windows .exe
   └─ Mac .app

✅ VMDHub Mobile Application
   ├─ React Native screens
   ├─ SQLite for React Native
   ├─ Android .apk
   ├─ iOS .ipa
   └─ Cloud sync ready

✅ Documentation
   ├─ Architecture guide
   ├─ Database schema
   ├─ API documentation
   ├─ Setup instructions
   └─ Deployment guide

✅ Scripts
   ├─ Build all
   ├─ Build individual
   ├─ Test suite
   └─ Deploy scripts
```

---

## Notes for Claude Code

1. **This is a complete specification** - Don't ask for clarification
2. **Build everything** - Web, Desktop, Mobile, Shared
3. **Use exact folder structure** - As specified above
4. **Complete working code** - Not templates or placeholders
5. **All dependencies** - Include in package.json
6. **All configurations** - electron-builder, webpack, etc.
7. **All utilities** - Exporters, importers, calculations
8. **All tests** - Unit tests for critical functions
9. **All documentation** - README, comments, guides
10. **Run overnight** - Don't stop until complete

---

**This specification is complete and self-contained. Claude Code can build the entire system from this specification alone.**

