<div align="center">

# CopyAlpha

**Turn a Twitter/X KOL into an installable, reusable agent skill**

[![中文文档](https://img.shields.io/badge/Docs-%E4%B8%AD%E6%96%87-1677FF?style=for-the-badge&logo=bookstack&logoColor=white)](README.zh-CN.md)
[![English Docs](https://img.shields.io/badge/Docs-English-7C3AED?style=for-the-badge&logo=readme&logoColor=white)](README.en.md)
[![npx](https://img.shields.io/badge/npx-copyalpha@latest-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](package.json)
[![Python Planned](https://img.shields.io/badge/Python-Planned-3776AB?style=for-the-badge&logo=python&logoColor=white)](README.en.md)
[![OpenClaw First](https://img.shields.io/badge/OpenClaw-First-111827?style=for-the-badge&logo=rocket&logoColor=white)](README.en.md)
[![License](https://img.shields.io/badge/License-Apache_2.0-D97706?style=for-the-badge&logo=apache&logoColor=white)](LICENSE)

</div>

---

## What is CopyAlpha?

CopyAlpha is a **KOL Skill Factory**.
It harvests tweets from a specific Twitter/X user, distills that user's trading style, narratives, token opinions, and recurring patterns, then forges a brand new `kol-{username}` skill and installs it into multiple agent runtimes.

It is **not** a copy-trading bot and **not** just a one-off summarizer.
It is a reusable knowledge-packaging pipeline for agent-native workflows.

## TL;DR

If you are an end user, the shortest path is:

```bash
npx copyalpha@latest install-skill
```

Restart your agent runtime, then say:

```text
Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill.
```

After filling the minimum `.env` config, CopyAlpha will:

- harvest the KOL's historical tweets
- distill trading style, narratives, token opinions, and patterns
- generate a new `kol-inversebrah` skill
- install it into OpenClaw, Claude Code, Codex, and a portable bundle directory

## Installation Options

### Recommended: published npm package

```bash
npx copyalpha@latest install-skill
```

Best for most users because it:

- pulls a prebuilt CLI from npm
- does not require a local repo checkout
- installs the factory skill directly into `OpenClaw`, `Codex`, `Claude Code`, and portable bundle locations

### GitHub fallback

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha install-skill
```

Use this when npm is not published yet or when you want to test the main branch directly.

### Local development install

```bash
npm install
npm run build
npm link
copyalpha install-skill
```

## End-to-End User Flow

### 1) Install the factory skill

```bash
npx copyalpha@latest install-skill
```

This installs `copyalpha-kol-factory` into:

- `~/.openclaw/skills/copyalpha-kol-factory/`
- `~/.codex/skills/copyalpha-kol-factory/`
- `~/.claude/agents/copyalpha-kol-factory.md`
- `~/.agent-skills/copyalpha-kol-factory/`

### 2) Restart your agent runtime

Supported runtimes include:

- OpenClaw
- Claude Code
- Codex
- other agents that can read local skill bundles

### 3) Ask the agent to generate a new KOL skill

```text
Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill.
```

### 4) Fill the workspace config

Required:

- `TWITTER_BEARER_TOKEN`

Common OpenClaw settings:

- `LLM_PROVIDER=openclaw`
- `OPENCLAW_GATEWAY_BASE_URL=http://127.0.0.1:18789/v1`
- `OPENCLAW_AGENT_ID=main`
- `OPENCLAW_GATEWAY_TOKEN` or `OPENCLAW_GATEWAY_PASSWORD` (only if your gateway requires auth)

### 5) Let the factory skill harvest, distill, forge, and install

Under the hood, this is equivalent to:

```bash
npx copyalpha@latest init
npx copyalpha@latest forge materialize @inversebrah --install --targets openclaw,codex,claude,bundle
```

### 6) Use the generated KOL skill

```text
Use $kol-inversebrah to analyze SOL.
```

## Default Install Targets

| Target | Path | Purpose |
|---|---|---|
| OpenClaw | `~/.openclaw/skills/kol-{username}/` | Full skill bundle for OpenClaw |
| Codex | `~/.codex/skills/kol-{username}/` | Full skill bundle for Codex / OpenAI-style runtimes |
| Claude Code | `~/.claude/agents/kol-{username}.md` | Claude Code adapter |
| Portable Bundle | `~/.agent-skills/kol-{username}/` | Generic portable bundle for other agents |

## CLI Commands

```bash
copyalpha init
copyalpha install-skill
copyalpha forge materialize @inversebrah --install
copyalpha forge install inversebrah
copyalpha harvest add @inversebrah
copyalpha consult analyze PEPE
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TWITTER_BEARER_TOKEN` | Yes | Twitter API v2 bearer token |
| `LLM_PROVIDER` | No | Defaults to `openclaw`; can be `openai-compatible` |
| `LLM_MODEL` | No | Defaults to `openclaw` |
| `OPENCLAW_GATEWAY_BASE_URL` | No | Defaults to `http://127.0.0.1:18789/v1` |
| `OPENCLAW_AGENT_ID` | No | Defaults to `main` |
| `OPENCLAW_GATEWAY_TOKEN` | No | OpenClaw gateway token auth |
| `OPENCLAW_GATEWAY_PASSWORD` | No | OpenClaw gateway password auth |
| `LLM_BASE_URL` | No | Override for generic OpenAI-compatible backends |
| `LLM_API_KEY` | No | API key for generic OpenAI-compatible backends |
| `LLM_TIMEOUT_MS` | No | LLM timeout, default `120000` |

## OpenClaw-first LLM Flow

The current version no longer depends on a provider-specific SDK in the CopyAlpha workspace.
Instead, it uses an **OpenClaw-first OpenAI-compatible flow**:

- sends requests to OpenClaw Gateway `/v1/chat/completions`
- uses `x-openclaw-agent-id` to target the OpenClaw agent
- can fall back to any generic OpenAI-compatible backend if you explicitly configure one

In practice this means:

- **OpenClaw mode**: CopyAlpha talks to OpenClaw Gateway and does not need to hold provider keys directly
- **Standalone mode**: any OpenAI-compatible LLM gateway is enough

## Name Collision Handling

- If a generated skill name is already taken, CopyAlpha automatically appends a numeric suffix such as `kol-username-2`.
- If the existing bundle already belongs to the same KOL, CopyAlpha reuses and updates that bundle instead of creating duplicates.

## Maintainer Release Check

```bash
npm install
npm run build
npm test
NPM_CONFIG_CACHE=/tmp/copyalpha-npm-cache npm run pack:check
```

Then publish:

```bash
npm version patch
npm publish
```

## Roadmap

- Better skill gallery previews
- Python SDK or wrapper
- Hosted skill registry
- More automated KOL refresh workflows

## License

Apache-2.0
