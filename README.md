# VMDHub — Vendor Management & Invoice Hub

A complete cross-platform system for managing vendors, products, invoices, GST tracking, and P&L reporting.

## Packages

| Package | Description | Tech Stack |
|---------|-------------|------------|
| `@vmd/shared` | Shared business logic | Node.js, SQLite (better-sqlite3) |
| `@vmd/web` | Browser web app | React, React Router, Recharts |
| `@vmd/desktop` | Desktop app | Electron, React |
| `@vmd/mobile` | Mobile app | React Native, SQLite |
| `@vmd/backend` | REST API server | Express, Node.js |

## Features

- **Vendor Management** — Add/edit/delete vendors with GST numbers
- **Product Catalog** — Products with cost/selling price, GST rates, stock tracking
- **Invoice Creation** — Interstate (IGST) and intrastate (CGST+SGST) invoicing
- **GST Tracker** — Monthly input/output GST management, net payable calculation
- **P&L Statement** — Monthly and yearly profit & loss with charts
- **Backup/Restore** — Full JSON export/import of all data
- **Dashboard** — At-a-glance stats, recent invoices, monthly charts

## Quick Start

```bash
# Install dependencies
npm install

# Start backend + web (two terminals)
cd packages/backend && npm run dev   # Terminal 1: API on :3001
cd packages/web && npm start         # Terminal 2: Web on :3000

# Or run desktop app
cd packages/desktop && npm run dev
```

## Project Structure

```
VMDHub/
├── packages/
│   ├── shared/      # Business logic, models, DB schema
│   ├── web/         # React web application
│   ├── desktop/     # Electron desktop application
│   ├── mobile/      # React Native mobile application
│   └── backend/     # Express REST API
├── docs/            # Architecture, API, setup docs
├── scripts/         # Build and setup scripts
└── README.md
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Setup Guide](docs/SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)

## Building

```bash
./scripts/build-web.sh             # Build web app
./scripts/build-desktop.sh         # Build desktop (current platform)
./scripts/build-desktop.sh win     # Windows .exe
./scripts/build-desktop.sh mac     # macOS .dmg
./scripts/build-mobile.sh android  # Android .apk
./scripts/build-mobile.sh ios      # iOS .ipa
```
