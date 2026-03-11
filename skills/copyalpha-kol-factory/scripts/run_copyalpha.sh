#!/usr/bin/env bash
set -euo pipefail

run_cli() {
  local bin="$1"
  shift

  if [[ "$bin" == *.js ]]; then
    exec node "$bin" "$@"
  fi

  exec "$bin" "$@"
}

resolve_local_copyalpha_bin() {
  local script_dir repo_root
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  repo_root="$(cd "$script_dir/../../.." && pwd)"

  local candidates=()

  if [ "${COPYALPHA_LOCAL_WORKSPACE:-}" != "" ]; then
    candidates+=("${COPYALPHA_LOCAL_WORKSPACE}/dist/cli.js")
  fi

  if [ "${COPYALPHA_LOCAL_DIR:-}" != "" ]; then
    candidates+=("${COPYALPHA_LOCAL_DIR}/dist/cli.js")
  fi

  candidates+=(
    "$repo_root/dist/cli.js"
    "$PWD/dist/cli.js"
    "$PWD/copyalpha-local/dist/cli.js"
    "${OPENCLAW_HOME:-$HOME/.openclaw}/workspace/copyalpha-local/dist/cli.js"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [ -n "$candidate" ] && [ -f "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

if [ "${COPYALPHA_BIN:-}" != "" ]; then
  run_cli "${COPYALPHA_BIN}" "$@"
fi

if local_bin="$(resolve_local_copyalpha_bin 2>/dev/null)"; then
  run_cli "$local_bin" "$@"
fi

if command -v copyalpha >/dev/null 2>&1; then
  exec copyalpha "$@"
fi

npx_spec="${COPYALPHA_NPX_SPEC:-github:Jnnndjjsnxbhhunheng/CopyAlpha}"
exec npx --yes "$npx_spec" "$@"
