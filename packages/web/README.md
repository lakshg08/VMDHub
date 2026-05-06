# @vmd/web — VMDHub Web Application

React browser app. Connects to `@vmd/backend` via HTTP.

## Development

```bash
# Start backend first
cd ../backend && npm run dev

# Then start web
npm start    # http://localhost:3000
```

## Build

```bash
npm run build   # Output: build/
```

## Features

- Dashboard with charts
- Vendor CRUD
- Product CRUD with margin calculations
- Invoice creation (interstate/intrastate GST)
- P&L statement with charts
- GST tracker
- Settings and backup/restore
