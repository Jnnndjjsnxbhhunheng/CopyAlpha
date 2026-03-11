---
name: copyalpha-kol-factory
description: Use when the user wants to turn a Twitter/X KOL into a reusable local skill. Harvest tweets, distill trading views, forge a new `kol-<username>` skill, refresh it from new tweets, and install it into Codex, Claude Code, OpenClaw, or a portable bundle.
---

# CopyAlpha KOL Factory

Use this skill when the user wants to:
- install a reusable KOL-harvesting skill for multiple agent runtimes
- harvest tweets from a specific Twitter/X account
- distill that account into a new skill under `generated-skills/kol-<username>`
- install the generated skill directly into local skill systems for OpenClaw, Codex, Claude Code, and a generic portable bundle

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
5. Report both the generated bundle in `generated-skills/kol-<username>/` and the local skill-system install paths.

## Bundled scripts

- `scripts/run_copyalpha.sh`: resolves the CopyAlpha CLI by preferring a local `copyalpha` binary, then falling back to `npx github:Jnnndjjsnxbhhunheng/CopyAlpha`.
- `scripts/bootstrap_copyalpha.sh`: creates a CopyAlpha workspace through the resolved CLI, prepares `.env`, and creates the `generated-skills` directory.
- `scripts/materialize_kol.sh`: runs `forge materialize` so the generated skill is installed into local skill systems by default. It defaults to `openclaw,codex,claude,bundle`.

## Global install targets

By default the generated KOL skill is installed directly to:
- `~/.openclaw/skills/kol-<username>/` for OpenClaw
- `~/.codex/skills/kol-<username>/` for Codex/OpenAI-style agents
- `~/.claude/agents/kol-<username>.md` for Claude Code
- `~/.agent-skills/kol-<username>/` as a portable bundle for other agents

## Behavior notes

- Prefer the existing workspace over creating a fresh one.
- `forge materialize` both tracks the account and scrapes tweets before forging the new skill.
- The generated KOL skill does not need a publish step; once installed into the target skill directories it is ready to use.
- If the user names multiple KOLs, process them one by one.
- Set `COPYALPHA_BIN` to force a specific local CLI path, or `COPYALPHA_NPX_SPEC` to test a different GitHub repo/ref.
- These scripts use network and package installation, so request approval when needed.
