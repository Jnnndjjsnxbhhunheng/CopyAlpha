#!/usr/bin/env bash
set -euo pipefail

workspace_dir="${1:-copyalpha-workspace}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$script_dir/run_copyalpha.sh" init "$workspace_dir"

echo "Workspace ready at $workspace_dir"
echo "Fill $workspace_dir/.env before materializing a KOL."
