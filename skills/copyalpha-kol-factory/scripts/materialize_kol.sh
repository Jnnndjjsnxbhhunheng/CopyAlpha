#!/usr/bin/env bash
set -euo pipefail

workspace_dir="${1:?workspace_dir is required}"
username="${2:?username is required}"
history_depth="${3:-}"

cd "$workspace_dir"

if [ ! -f package.json ]; then
  echo "Not a CopyAlpha workspace: $workspace_dir" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Missing .env in $workspace_dir. Run bootstrap first and fill the required API keys." >&2
  exit 1
fi

if [ -f dist/cli.js ]; then
  cmd=(node dist/cli.js forge materialize "$username")
else
  cmd=(npx ts-node src/cli.ts forge materialize "$username")
fi

if [ -n "$history_depth" ]; then
  cmd+=(--count "$history_depth")
fi

"${cmd[@]}"
