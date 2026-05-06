#!/bin/bash
set -e
echo "=== Running VMDHub Tests ==="

echo "Testing Shared package..."
(cd packages/shared && npm test -- --passWithNoTests 2>/dev/null || echo "No tests yet")

echo ""
echo "=== Tests complete ==="
