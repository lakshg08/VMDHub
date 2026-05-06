-- Initial migration: baseline schema from packages/shared/src/database/schema.sql
-- This migration is marked as already applied against the existing vmdhub.db.
-- Future schema changes will be added as new Prisma migrations.

CREATE TABLE IF NOT EXISTS "customers" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "gst_number" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_customers_gst" ON "customers"("gst_number");

CREATE TABLE IF NOT EXISTS "vendors" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "contact_person" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "gst_number" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "vendors_name_key" UNIQUE ("name")
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "vendor_id" INTEGER NOT NULL,
  "category" TEXT,
  "cost_price" REAL NOT NULL,
  "selling_price" REAL NOT NULL,
  "hsn_code" TEXT NOT NULL DEFAULT '',
  "gst_rate" REAL NOT NULL DEFAULT 18,
  "quantity_in_stock" INTEGER NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL DEFAULT 'pcs',
  "notes" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "products_sku_key" UNIQUE ("sku"),
  CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_products_vendor_id" ON "products"("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_products_sku" ON "products"("sku");

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "invoice_number" TEXT NOT NULL,
  "invoice_date" TEXT NOT NULL,
  "invoice_type" TEXT NOT NULL,
  "customer_name" TEXT NOT NULL,
  "customer_email" TEXT,
  "customer_address" TEXT,
  "customer_gst" TEXT,
  "total_amount_before_tax" REAL NOT NULL DEFAULT 0,
  "total_igst" REAL NOT NULL DEFAULT 0,
  "total_cgst" REAL NOT NULL DEFAULT 0,
  "total_sgst" REAL NOT NULL DEFAULT 0,
  "total_tax" REAL NOT NULL DEFAULT 0,
  "total_amount_after_tax" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "notes" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number")
);

CREATE INDEX IF NOT EXISTS "idx_invoices_date" ON "invoices"("invoice_date");
CREATE INDEX IF NOT EXISTS "idx_invoices_type" ON "invoices"("invoice_type");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices"("status");

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "invoice_id" INTEGER NOT NULL,
  "product_id" INTEGER,
  "item_name" TEXT NOT NULL,
  "quantity" REAL NOT NULL,
  "unit_price" REAL NOT NULL,
  "amount" REAL NOT NULL,
  "gst_rate" REAL NOT NULL DEFAULT 0,
  "igst" REAL NOT NULL DEFAULT 0,
  "cgst" REAL NOT NULL DEFAULT 0,
  "sgst" REAL NOT NULL DEFAULT 0,
  "total_with_tax" REAL NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "invoice_items"("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_invoice_items_product_id" ON "invoice_items"("product_id");

CREATE TABLE IF NOT EXISTS "monthly_gst" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "year_month" TEXT NOT NULL,
  "input_igst" REAL NOT NULL DEFAULT 0,
  "input_cgst" REAL NOT NULL DEFAULT 0,
  "input_sgst" REAL NOT NULL DEFAULT 0,
  "input_notes" TEXT,
  "output_igst" REAL NOT NULL DEFAULT 0,
  "output_cgst" REAL NOT NULL DEFAULT 0,
  "output_sgst" REAL NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  CONSTRAINT "monthly_gst_year_month_key" UNIQUE ("year_month")
);

CREATE TABLE IF NOT EXISTS "settings" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "company_name" TEXT,
  "company_email" TEXT,
  "company_address" TEXT,
  "company_gst" TEXT,
  "company_phone" TEXT,
  "company_website" TEXT,
  "financial_year_start" INTEGER NOT NULL DEFAULT 4,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "backup_history" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "backup_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "backup_filename" TEXT,
  "backup_size" INTEGER,
  "backup_location" TEXT,
  "backup_type" TEXT
);
