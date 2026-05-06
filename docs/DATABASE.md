# VMDHub Database Schema

## Tables

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | |
| email | TEXT | |
| phone | TEXT | |
| ship_to_address | TEXT | Delivery / shipping address |
| bill_to_address | TEXT | Invoice / billing address |
| gst_number | TEXT | Format: 22AAAAA0000A1Z5 |
| created_at | TIMESTAMP | Default current |
| updated_at | TIMESTAMP | Auto-updated |

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
| updated_at | TIMESTAMP | Auto-updated |

### products
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | |
| sku | TEXT NOT NULL | Unique |
| vendor_id | INTEGER | FK → vendors.id |
| category | TEXT | |
| cost_price | DECIMAL(10,2) | |
| selling_price | DECIMAL(10,2) | |
| hsn_code | TEXT | Default '', mandatory for GST |
| gst_rate | DECIMAL(5,2) | Default 18 |
| quantity_in_stock | INTEGER | Default 0 |
| unit | TEXT | Default 'pcs' |
| notes | TEXT | |
| created_at | TIMESTAMP | Default current |
| updated_at | TIMESTAMP | Auto-updated |

### invoices
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| invoice_number | TEXT | Unique, format INV-XXXX |
| invoice_date | TEXT | ISO date string YYYY-MM-DD |
| invoice_type | TEXT | 'interstate' or 'intrastate' |
| customer_name | TEXT | |
| customer_email | TEXT | |
| customer_address | TEXT | |
| customer_gst | TEXT | |
| total_amount_before_tax | DECIMAL(12,2) | Default 0 |
| total_igst | DECIMAL(10,2) | Default 0; interstate only |
| total_cgst | DECIMAL(10,2) | Default 0; intrastate only |
| total_sgst | DECIMAL(10,2) | Default 0; intrastate only |
| total_tax | DECIMAL(10,2) | Default 0 |
| total_amount_after_tax | DECIMAL(12,2) | Default 0 |
| status | TEXT | draft/sent/paid/cancelled; default 'draft' |
| notes | TEXT | |
| created_at | TIMESTAMP | Default current |
| updated_at | TIMESTAMP | Auto-updated |

### invoice_items
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| invoice_id | INTEGER | FK → invoices.id CASCADE DELETE |
| product_id | INTEGER | FK → products.id (nullable) |
| item_name | TEXT | |
| quantity | DECIMAL(10,2) | |
| unit_price | DECIMAL(10,2) | |
| cost_price | DECIMAL(10,2) | Snapshot of product cost at invoice time; used for historical P&L |
| amount | DECIMAL(12,2) | quantity × unit_price |
| gst_rate | DECIMAL(5,2) | Default 0 |
| hsn_code | TEXT | Snapshot of product HSN code at invoice time |
| igst | DECIMAL(10,2) | Default 0; interstate only |
| cgst | DECIMAL(10,2) | Default 0; intrastate only |
| sgst | DECIMAL(10,2) | Default 0; intrastate only |
| total_with_tax | DECIMAL(12,2) | amount + igst + cgst + sgst |
| created_at | TIMESTAMP | Default current |

### monthly_gst
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| year_month | TEXT | Unique, format YYYY-MM |
| input_igst | DECIMAL(10,2) | Purchase IGST; default 0 |
| input_cgst | DECIMAL(10,2) | Purchase CGST; default 0 |
| input_sgst | DECIMAL(10,2) | Purchase SGST; default 0 |
| input_notes | TEXT | Optional notes on purchase GST |
| output_igst | DECIMAL(10,2) | Sales IGST (from invoices); default 0 |
| output_cgst | DECIMAL(10,2) | Sales CGST (from invoices); default 0 |
| output_sgst | DECIMAL(10,2) | Sales SGST (from invoices); default 0 |
| created_at | TIMESTAMP | Default current |
| updated_at | TIMESTAMP | Auto-updated |

### settings
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment; single row expected |
| company_name | TEXT | |
| company_email | TEXT | |
| company_address | TEXT | |
| company_gst | TEXT | |
| company_phone | TEXT | |
| company_website | TEXT | |
| financial_year_start | INTEGER | Month number; default 4 (April) |
| currency | TEXT | Default 'INR' |
| created_at | TIMESTAMP | Default current |
| updated_at | TIMESTAMP | Auto-updated |

### backup_history
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| backup_date | TIMESTAMP | Default current |
| backup_filename | TEXT | |
| backup_size | INTEGER | Bytes |
| backup_location | TEXT | |
| backup_type | TEXT | |
