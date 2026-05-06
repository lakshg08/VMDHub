-- Add cost_price and hsn_code to invoice_items for historical accuracy.
-- Existing rows get 0 / '' as defaults; P&L falls back to current product cost for those rows.
ALTER TABLE "invoice_items" ADD COLUMN "cost_price" REAL NOT NULL DEFAULT 0;
ALTER TABLE "invoice_items" ADD COLUMN "hsn_code" TEXT NOT NULL DEFAULT '';
