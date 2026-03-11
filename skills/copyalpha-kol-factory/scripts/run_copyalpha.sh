#!/usr/bin/env bash
set -euo pipefail

if [ "${COPYALPHA_BIN:-}" != "" ]; then
  if [ -f "${COPYALPHA_BIN}" ]; then
    exec node "${COPYALPHA_BIN}" "$@"
  fi
  exec "${COPYALPHA_BIN}" "$@"
fi

if command -v copyalpha >/dev/null 2>&1; then
  exec copyalpha "$@"
fi

npx_spec="${COPYALPHA_NPX_SPEC:-github:Jnnndjjsnxbhhunheng/CopyAlpha}"
exec npx --yes "$npx_spec" "$@"
