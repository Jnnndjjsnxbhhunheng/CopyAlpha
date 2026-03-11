#!/usr/bin/env bash
set -euo pipefail

export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/copyalpha-npm-cache}"

echo "[release-publish] Running release checks"
npm run release:check

echo "[release-publish] Publishing $(node -p "require('./package.json').name + '@' + require('./package.json').version") to npm"
npm publish "$@"
