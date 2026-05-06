# @vmd/backend — VMDHub API Server

Express REST API serving the web application.

## Development

```bash
npm run dev   # Starts on http://localhost:3001
```

## Endpoints

See [API docs](../../docs/API.md) for full reference.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | API server port |
| DB_PATH | `../../data/vmdhub.db` | SQLite database path |
| CORS_ORIGIN | `*` | Allowed CORS origin |
