#!/usr/bin/env bash
set -euo pipefail

export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/copyalpha-npm-cache}"

echo "[release-check] Building package"
npm run build

echo "[release-check] Running tests"
npm test -- --runInBand

echo "[release-check] Verifying npm tarball contents"
npm run pack:check
