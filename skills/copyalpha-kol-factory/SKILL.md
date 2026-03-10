---
name: copyalpha-kol-factory
description: Install and use CopyAlpha through npx to harvest tweets from a specific Twitter/X user, distill their trading views, and forge a brand new KOL Skill. Use when the user wants to turn @username into a reusable skill, refresh that skill from fresh tweets, and install the generated skill globally for OpenClaw, Codex, Claude Code, or other agents via a portable bundle.
---

# CopyAlpha KOL Factory

Use this skill when the user wants to:
- install a reusable KOL-harvesting skill for multiple agent runtimes
- harvest tweets from a specific Twitter/X account
- distill that account into a new skill under `generated-skills/kol-<username>`
- install the generated skill globally for OpenClaw, Codex, Claude Code, and a generic portable bundle

## Required inputs

- Twitter/X username
- `TWITTER_BEARER_TOKEN`
- 可用的 OpenClaw Gateway（或其他兼容 OpenAI Chat Completions 的 LLM 网关）

`NITTER_INSTANCES`、OpenClaw Gateway 凭据和 OKX 配置都按需提供。
在 OpenClaw-first 模式下，不要额外要求用户在 CopyAlpha 工作区里填写模型厂商 Key；这些应由 OpenClaw 自己管理。

## Workflow

1. Reuse an existing CopyAlpha workspace if one already exists.
2. Otherwise run `scripts/bootstrap_copyalpha.sh <workspace_dir>`.
3. Make sure `<workspace_dir>/.env` contains `TWITTER_BEARER_TOKEN` and, only when needed, OpenClaw gateway auth settings before harvesting.
4. Run `scripts/materialize_kol.sh <workspace_dir> @username [history_depth]`.
5. Report both the generated bundle in `generated-skills/kol-<username>/` and the global install paths.

## Bundled scripts

- `scripts/bootstrap_copyalpha.sh`: creates a CopyAlpha workspace through `npx copyalpha@latest init`, prepares `.env`, and creates the `generated-skills` directory.
- `scripts/materialize_kol.sh`: runs `npx copyalpha@latest forge materialize --install` so the generated skill is also installed globally. It defaults to `openclaw,codex,claude,bundle`.

## Global install targets

By default the generated KOL skill is installed to:
- `~/.openclaw/skills/kol-<username>/` for OpenClaw
- `~/.codex/skills/kol-<username>/` for Codex/OpenAI-style agents
- `~/.claude/agents/kol-<username>.md` for Claude Code
- `~/.agent-skills/kol-<username>/` as a portable bundle for other agents

## Behavior notes

- Prefer the existing workspace over creating a fresh one.
- `forge materialize` both tracks the account and scrapes tweets before forging the new skill.
- If the user names multiple KOLs, process them one by one.
- Set `COPYALPHA_NPX_SPEC` if you need to override the package source, for example to test a GitHub branch before npm publish.
- These scripts use network and package installation, so request approval when needed.
