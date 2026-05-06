#!/bin/bash
set -e
echo "=== Building All VMDHub Packages ==="
echo ""

echo "1/4 Building Shared..."
(cd packages/shared && npm run build)

echo "2/4 Building Backend..."
(cd packages/backend && npm run build)

echo "3/4 Building Web..."
(cd packages/web && npm run build)

echo "4/4 Building Desktop..."
(cd packages/desktop && npm run build)

echo ""
echo "=== All builds complete ==="
echo "Web build:     packages/web/build/"
echo "Desktop build: packages/desktop/dist/"
