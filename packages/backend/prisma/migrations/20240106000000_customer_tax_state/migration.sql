-- Add tax state fields to customers
ALTER TABLE "customers" ADD COLUMN "tax_state" TEXT;
ALTER TABLE "customers" ADD COLUMN "tax_state_code" TEXT;
