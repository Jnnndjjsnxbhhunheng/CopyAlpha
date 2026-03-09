#!/bin/bash
set -e

echo "=== CopyAlpha Installer ==="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required. Install from https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "Error: Node.js >= 16 required (found: $(node -v))"
  exit 1
fi

echo "[1/3] Installing dependencies..."
npm install

echo "[2/3] Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example"
  echo "  Please edit .env with your API keys"
else
  echo "  .env already exists, skipping"
fi

echo "[3/3] Verifying build..."
npx tsc --noEmit

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. npx ts-node src/cli.ts harvest add @username"
echo "  3. npx ts-node src/cli.ts forge build username"
echo "  4. npx ts-node src/cli.ts consult analyze TOKEN"
