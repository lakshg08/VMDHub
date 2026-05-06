# VMDHub API Documentation

Base URL: `http://localhost:3001/api`

## Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /vendors | List all vendors |
| GET | /vendors/:id | Get vendor by ID |
| POST | /vendors | Create vendor |
| PUT | /vendors/:id | Update vendor |
| DELETE | /vendors/:id | Delete vendor |

### Vendor Object
```json
{
  "name": "ABC Suppliers",
  "contact_person": "Raj Kumar",
  "email": "raj@abc.com",
  "phone": "+91 98765 43210",
  "address": "123 Main St, Mumbai",
  "gst_number": "27AAAAA0000A1Z5"
}
```

## Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List all products |
| GET | /products?vendor_id=1 | List by vendor |
| GET | /products/:id | Get product |
| POST | /products | Create product |
| PUT | /products/:id | Update product |
| DELETE | /products/:id | Delete product |

## Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /invoices | List all invoices |
| GET | /invoices?month=2024-01 | Filter by month |
| GET | /invoices?start_date=2024-01-01&end_date=2024-03-31 | Date range |
| GET | /invoices/next-number | Get next invoice number |
| GET | /invoices/export/csv | Export as CSV |
| GET | /invoices/:id | Get invoice with items |
| POST | /invoices | Create invoice |
| PUT | /invoices/:id | Update invoice |
| DELETE | /invoices/:id | Delete invoice |

### Invoice Object
```json
{
  "invoice_number": "INV-0001",
  "invoice_date": "2024-01-15",
  "invoice_type": "intrastate",
  "customer_name": "Customer Ltd",
  "customer_gst": "27BBBBB0000B1Z5",
  "status": "draft",
  "items": [
    {
      "item_name": "Product A",
      "product_id": 1,
      "quantity": 2,
      "unit_price": 1000,
      "gst_rate": 18
    }
  ]
}
```

## GST

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /gst?year=2024 | Get GST data for year |
| GET | /gst/invoice-summary?year=2024 | Invoice GST by month |
| POST | /gst | Save monthly GST entry |

## P&L

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /pl?year=2024 | Get P&L for year |
| GET | /pl/export?year=2024 | Export P&L as HTML |

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /dashboard/summary | Current month summary |
| GET | /dashboard/monthly | Last 12 months data |

## Backup

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /backup/export | Download JSON backup |
| POST | /backup/import | Restore from backup |
| GET | /backup/history | Backup history |
