# VMDHub Database Schema

## Tables

### vendors
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | Unique |
| contact_person | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| address | TEXT | |
| gst_number | TEXT | Format: 22AAAAA0000A1Z5 |
| created_at | TIMESTAMP | Default current |
| updated_at | TIMESTAMP | Auto-updated via trigger |

### products
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT NOT NULL | |
| sku | TEXT NOT NULL | Unique |
| vendor_id | INTEGER | FK → vendors.id |
| category | TEXT | |
| cost_price | DECIMAL(10,2) | |
| selling_price | DECIMAL(10,2) | |
| gst_rate | DECIMAL(5,2) | Default 18 |
| quantity_in_stock | INTEGER | Default 0 |
| unit | TEXT | Default 'pcs' |
| notes | TEXT | |

### invoices
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| invoice_number | TEXT | Unique, format INV-XXXX |
| invoice_date | DATE | |
| invoice_type | TEXT | 'interstate' or 'intrastate' |
| customer_name | TEXT | |
| customer_email | TEXT | |
| customer_address | TEXT | |
| customer_gst | TEXT | |
| total_amount_before_tax | DECIMAL(12,2) | |
| total_igst | DECIMAL(10,2) | Interstate only |
| total_cgst | DECIMAL(10,2) | Intrastate only |
| total_sgst | DECIMAL(10,2) | Intrastate only |
| total_tax | DECIMAL(10,2) | |
| total_amount_after_tax | DECIMAL(12,2) | |
| status | TEXT | draft/sent/paid/cancelled |

### invoice_items
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| invoice_id | INTEGER | FK → invoices.id CASCADE |
| product_id | INTEGER | FK → products.id (nullable) |
| item_name | TEXT | |
| quantity | DECIMAL(10,2) | |
| unit_price | DECIMAL(10,2) | |
| amount | DECIMAL(12,2) | quantity × unit_price |
| gst_rate | DECIMAL(5,2) | |
| igst/cgst/sgst | DECIMAL(10,2) | Based on invoice type |
| total_with_tax | DECIMAL(12,2) | amount + tax |

### monthly_gst
| Column | Type | Notes |
|--------|------|-------|
| year_month | TEXT | Unique, format YYYY-MM |
| input_igst/cgst/sgst | DECIMAL(10,2) | Purchase GST |
| output_igst/cgst/sgst | DECIMAL(10,2) | Sales GST (from invoices) |

### settings
Company profile, GST number, financial year configuration.
