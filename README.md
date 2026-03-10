<div align="center">

# CopyAlpha

**Turn a Twitter/X KOL into an installable agent skill.**  
**把 Twitter / X 上的 KOL，沉淀成可复用、可全局安装的 Agent Skill。**

[![中文文档](https://img.shields.io/badge/Docs-%E4%B8%AD%E6%96%87-1677FF?style=for-the-badge&logo=bookstack&logoColor=white)](README.zh-CN.md)
[![English Docs](https://img.shields.io/badge/Docs-English-7C3AED?style=for-the-badge&logo=readme&logoColor=white)](README.en.md)
[![npx](https://img.shields.io/badge/npx-copyalpha@latest-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](package.json)
[![Python Planned](https://img.shields.io/badge/Python-Planned-3776AB?style=for-the-badge&logo=python&logoColor=white)](README.en.md)
[![OpenClaw First](https://img.shields.io/badge/OpenClaw-First-111827?style=for-the-badge&logo=rocket&logoColor=white)](README.zh-CN.md)
[![License](https://img.shields.io/badge/License-Apache_2.0-D97706?style=for-the-badge&logo=apache&logoColor=white)](LICENSE)

</div>

---

## Why CopyAlpha / 它解决什么问题？

CopyAlpha is a **KOL Skill Factory**. It harvests tweets from a specific Twitter/X user, distills that user's trading style, narratives, token opinions, and recurring patterns, then forges a brand new `kol-{username}` skill you can install into multiple agent runtimes.

CopyAlpha 是一个 **KOL Skill 工厂**。它会抓取指定 KOL 的历史推文，提炼交易风格、叙事判断、Token 观点和重复模式，然后生成新的 `kol-{username}` Skill，并安装到多个 agent 环境中。

It is **not** a copy-trading bot, and **not** just a one-off summary tool. It is a reusable knowledge packaging pipeline for agent-native workflows.

它**不是**跟单机器人，也**不是**一次性摘要工具；它更像一个面向 agent 的知识沉淀与安装流水线。

## Highlights / 核心亮点

- **OpenClaw-first**: routes LLM calls through the OpenClaw Gateway instead of requiring provider keys inside the CopyAlpha workspace.
- **Multi-agent install**: installs generated skills into `OpenClaw`, `Codex`, `Claude Code`, and a generic portable bundle.
- **From tweets to skills**: harvest → distill → forge → install.
- **Reusable output**: every KOL becomes a durable, versionable skill bundle.

- **OpenClaw 优先**：默认走 OpenClaw Gateway，不要求在 CopyAlpha 工作区里直配模型厂商 Key。
- **多 Agent 安装**：生成的 skill 可同时安装到 `OpenClaw`、`Codex`、`Claude Code` 和通用 bundle。
- **从推文到技能**：采集 → 蒸馏 → 锻造 → 安装。
- **可重复使用**：每个 KOL 最终都会沉淀成一个可复用、可迭代的 skill bundle。

## Quick Start / 快速开始

### 1) Install the factory skill / 安装工厂 Skill

```bash
npx copyalpha@latest install-skill
```

### 2) Restart your agent / 重启你的 agent 工具

Supported runtimes / 支持的运行时：

- `OpenClaw`
- `Claude Code`
- `Codex`
- other agents that can read local portable skill bundles
- 其他支持读取本地 skill / subagent 的 agent

### 3) Ask your agent to forge a KOL skill / 让 agent 生成新的 KOL Skill

```text
Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill.
```

或：

```text
用 copyalpha-kol-factory 抓取 @inversebrah 的推文，并生成一个新的 KOL Skill。
```

### 4) Fill the minimum config / 填最小配置

Required / 必填：

- `TWITTER_BEARER_TOKEN`

Usually optional in OpenClaw-first mode / OpenClaw-first 模式下一般按需填写：

- `OPENCLAW_GATEWAY_BASE_URL`
- `OPENCLAW_AGENT_ID`
- `OPENCLAW_GATEWAY_TOKEN`
- `OPENCLAW_GATEWAY_PASSWORD`

## Install Targets / 默认安装位置

| Target | Path | Purpose |
|---|---|---|
| OpenClaw | `~/.openclaw/skills/kol-{username}/` | Full skill bundle for OpenClaw |
| Codex | `~/.codex/skills/kol-{username}/` | Full skill bundle for Codex / OpenAI-style runtimes |
| Claude Code | `~/.claude/agents/kol-{username}.md` | Claude Code subagent adapter |
| Portable Bundle | `~/.agent-skills/kol-{username}/` | Generic agent-compatible skill bundle |

## End-to-End Flow / 全流程

```text
Twitter / X KOL tweets
        ↓
Harvest 采集
        ↓
Distill 蒸馏
        ↓
Forge 锻造
        ↓
Install 安装
        ├── OpenClaw
        ├── Codex
        ├── Claude Code
        └── Portable Bundle
```

## Documentation / 文档入口

- `README.zh-CN.md` — 完整中文版使用说明
- `README.en.md` — Full English documentation

## Name Collision Handling / 重名处理

- If a generated skill name is already taken, CopyAlpha automatically picks a suffix such as `kol-username-2`.
- If the existing bundle already belongs to the same KOL, CopyAlpha reuses and updates that bundle instead of creating duplicates.
- 如果生成出的 skill 名已被占用，CopyAlpha 会自动追加后缀，例如 `kol-username-2`。
- 如果已存在的 bundle 本来就是同一个 KOL，CopyAlpha 会直接复用并更新，而不是再生成一份重复技能。

## Maintainer Notes / 维护者说明

```bash
npm install
npm run build
npm test
NPM_CONFIG_CACHE=/tmp/copyalpha-npm-cache npm run pack:check
```

Then publish / 然后发布：

```bash
npm version patch
npm publish
```

## Roadmap / 路线图

- Better skill gallery previews / 更好的 skill 展示页
- Python SDK or Python wrapper / Python SDK 或 Python 包装层
- Hosted skill registry / 托管式 skill registry
- More KOL refresh automation / 更完整的 KOL 增量更新自动化
