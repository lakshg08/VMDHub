-- Rename address -> ship_to_address and add bill_to_address on customers.
ALTER TABLE "customers" RENAME COLUMN "address" TO "ship_to_address";
ALTER TABLE "customers" ADD COLUMN "bill_to_address" TEXT;
