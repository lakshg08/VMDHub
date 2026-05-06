#!/bin/bash
set -e
echo "Building VMDHub Desktop..."

TARGET=${1:-""}

cd packages/desktop
npm run build:react

if [ "$TARGET" == "win" ]; then
  electron-builder -w
elif [ "$TARGET" == "mac" ]; then
  electron-builder -m
else
  npm run build
fi

echo "Desktop build complete → packages/desktop/dist/"
