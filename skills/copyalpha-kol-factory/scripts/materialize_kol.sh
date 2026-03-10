#!/usr/bin/env bash
set -euo pipefail

workspace_dir="${1:?workspace_dir is required}"
username="${2:?username is required}"
history_depth="${3:-}"
npx_spec="${COPYALPHA_NPX_SPEC:-copyalpha@latest}"
install_targets="${COPYALPHA_INSTALL_TARGETS:-openclaw,codex,claude,bundle}"

cd "$workspace_dir"

if [ ! -f .env ]; then
  echo "Missing .env in $workspace_dir. Run bootstrap first and fill the required API keys." >&2
  exit 1
fi

cmd=(npx --yes "$npx_spec" forge materialize "$username" --install --targets "$install_targets" --force-install)

if [ -n "$history_depth" ]; then
  cmd+=(--count "$history_depth")
fi

"${cmd[@]}"
