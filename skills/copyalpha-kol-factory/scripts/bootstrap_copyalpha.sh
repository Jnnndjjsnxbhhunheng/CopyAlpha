#!/usr/bin/env bash
set -euo pipefail

workspace_dir="${1:-copyalpha-workspace}"
repo_url="${COPYALPHA_REPO_URL:-https://github.com/Jnnndjjsnxbhhunheng/CopyAlpha.git}"

if [ ! -d "$workspace_dir" ]; then
  git clone "$repo_url" "$workspace_dir"
fi

cd "$workspace_dir"

if [ ! -f package.json ]; then
  echo "Not a CopyAlpha workspace: $workspace_dir" >&2
  exit 1
fi

npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created $workspace_dir/.env from template"
fi

mkdir -p generated-skills

echo "Workspace ready at $workspace_dir"
