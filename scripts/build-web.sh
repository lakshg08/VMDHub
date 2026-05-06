#!/bin/bash
set -e
echo "Building VMDHub Web..."
cd packages/web && npm run build
echo "Web build complete → packages/web/build/"
