-- Migration 002: Add HSN code to products
ALTER TABLE products ADD COLUMN hsn_code TEXT NOT NULL DEFAULT '';
