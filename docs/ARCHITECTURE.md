# VMDHub Architecture

## Overview

VMDHub is a monorepo containing four packages sharing a single business logic layer.

```
vmdhub-monorepo/
├── packages/shared    → Business logic, models, DB schema, utilities
├── packages/web       → React browser app (connects to backend via HTTP)
├── packages/desktop   → Electron app (uses SQLite directly via IPC)
├── packages/mobile    → React Native app (uses SQLite directly)
└── packages/backend   → Express API server (serves web app)
```

## Data Flow

### Web App
```
Browser → React UI → HTTP → Express API → SQLite (via @vmd/shared)
```

### Desktop App
```
Electron Renderer → IPC → Electron Main → SQLite (via @vmd/shared)
```

### Mobile App
```
React Native → react-native-sqlite-storage → SQLite (device local)
```

## Shared Package

All business logic lives in `@vmd/shared`:
- **Models**: Vendor, Product, Invoice, InvoiceItem, MonthlyGST
- **Services**: InvoiceService, GSTService, PLService, BackupService
- **Utils**: Calculations, Validators, Exporters, Importers
- **Database**: SQLite schema, queries via better-sqlite3
- **Constants**: GST rates, invoice types, currencies

## GST Calculation Logic

- **Interstate**: IGST only (full GST rate on amount)
- **Intrastate**: CGST + SGST split equally (half rate each)

## Database Location

- **Desktop**: `{userData}/vmdhub.db` (OS-specific app data folder)
- **Backend**: `{project}/data/vmdhub.db` (configurable via DB_PATH env)
- **Mobile**: Device SQLite storage via react-native-sqlite-storage
