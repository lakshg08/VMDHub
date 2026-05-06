-- VMDHub Database Schema

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_gst ON customers(gst_number);

CREATE TRIGGER IF NOT EXISTS customers_updated_at AFTER UPDATE ON customers
BEGIN
  UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  vendor_id INTEGER NOT NULL,
  category TEXT,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  hsn_code TEXT NOT NULL DEFAULT '',
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18,
  quantity_in_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  invoice_type TEXT NOT NULL CHECK(invoice_type IN ('interstate', 'intrastate')),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  customer_gst TEXT,
  total_amount_before_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_igst DECIMAL(10,2) DEFAULT 0,
  total_cgst DECIMAL(10,2) DEFAULT 0,
  total_sgst DECIMAL(10,2) DEFAULT 0,
  total_tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount_after_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  igst DECIMAL(10,2) DEFAULT 0,
  cgst DECIMAL(10,2) DEFAULT 0,
  sgst DECIMAL(10,2) DEFAULT 0,
  total_with_tax DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Monthly GST Tracking Table
CREATE TABLE IF NOT EXISTS monthly_gst (
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
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  company_email TEXT,
  company_address TEXT,
  company_gst TEXT,
  company_phone TEXT,
  company_website TEXT,
  financial_year_start INTEGER DEFAULT 4,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup History Table
CREATE TABLE IF NOT EXISTS backup_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  backup_filename TEXT,
  backup_size INTEGER,
  backup_location TEXT,
  backup_type TEXT CHECK(backup_type IN ('manual', 'automatic'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS vendors_updated_at AFTER UPDATE ON vendors
BEGIN
  UPDATE vendors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS products_updated_at AFTER UPDATE ON products
BEGIN
  UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS invoices_updated_at AFTER UPDATE ON invoices
BEGIN
  UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
