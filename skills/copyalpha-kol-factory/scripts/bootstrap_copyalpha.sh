#!/usr/bin/env bash
set -euo pipefail

workspace_dir="${1:-copyalpha-workspace}"
npx_spec="${COPYALPHA_NPX_SPEC:-copyalpha@latest}"

npx --yes "$npx_spec" init "$workspace_dir"

echo "Workspace ready at $workspace_dir"
echo "Fill $workspace_dir/.env before materializing a KOL."
