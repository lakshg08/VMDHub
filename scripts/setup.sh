#!/bin/bash
set -e

echo "=== VMDHub Setup ==="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is required. Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "ERROR: Node.js 16+ required (found v$NODE_VERSION)"
  exit 1
fi

echo "Node.js $(node --version) ✓"

# Create data directory
mkdir -p data

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install package dependencies
echo "Installing package dependencies..."
for pkg in shared backend web desktop mobile; do
  if [ -d "packages/$pkg" ]; then
    echo "  Installing packages/$pkg..."
    (cd "packages/$pkg" && npm install --prefer-offline 2>/dev/null || npm install)
  fi
done

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start development:"
echo "  Backend:  cd packages/backend && npm run dev"
echo "  Web:      cd packages/web && npm start"
echo "  Desktop:  cd packages/desktop && npm run dev"
