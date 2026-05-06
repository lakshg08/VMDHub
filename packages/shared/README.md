# @vmd/shared

Shared business logic for all VMDHub platforms.

## Contents

- **Database** — SQLite schema, queries (better-sqlite3), migrations
- **Models** — Vendor, Product, Invoice, InvoiceItem, MonthlyGST
- **Services** — InvoiceService, GSTService, PLService, BackupService
- **Utils** — Calculations, Validators, Exporters (CSV/HTML), Importers
- **Constants** — GST rates, invoice types, currencies

## Usage

```js
const { getDatabase, InvoiceService, GSTService } = require('@vmd/shared');
const db = getDatabase('/path/to/vmdhub.db');
const invoiceService = new InvoiceService(db);
const invoices = invoiceService.getAll();
```
