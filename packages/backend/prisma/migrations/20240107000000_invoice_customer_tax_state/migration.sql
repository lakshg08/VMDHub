-- Add customer tax state fields to invoices
ALTER TABLE "invoices" ADD COLUMN "customer_tax_state" TEXT;
ALTER TABLE "invoices" ADD COLUMN "customer_tax_state_code" TEXT;
