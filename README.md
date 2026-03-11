<div align="center">

# CopyAlpha

**把 Twitter / X 上的 KOL，沉淀成可复用、可全局安装的 Agent Skill**

[![中文文档](https://img.shields.io/badge/Docs-%E4%B8%AD%E6%96%87-1677FF?style=for-the-badge&logo=bookstack&logoColor=white)](README.zh-CN.md)
[![English Docs](https://img.shields.io/badge/Docs-English-7C3AED?style=for-the-badge&logo=readme&logoColor=white)](README.en.md)
[![Run from GitHub](https://img.shields.io/badge/Run-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Jnnndjjsnxbhhunheng/CopyAlpha)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](package.json)
[![Python Planned](https://img.shields.io/badge/Python-Planned-3776AB?style=for-the-badge&logo=python&logoColor=white)](README.md)
[![OpenClaw First](https://img.shields.io/badge/OpenClaw-First-111827?style=for-the-badge&logo=rocket&logoColor=white)](README.zh-CN.md)
[![License](https://img.shields.io/badge/License-Apache_2.0-D97706?style=for-the-badge&logo=apache&logoColor=white)](LICENSE)

</div>

---

## 什么是 CopyAlpha

CopyAlpha 是一个 **KOL Skill 工厂**。
它会抓取指定 KOL 的历史推文，提炼交易风格、叙事判断、Token 观点和重复模式，然后生成新的 `kol-{username}` Skill，并安装到不同 agent 可读取的位置。

这不是跟单机器人，也不是一次性摘要工具。
它更像一个"专家知识压缩器"——把某个 KOL 过去公开表达过的交易思路，整理成一个可以长期复用的技能包。

## TL;DR

如果你是最终用户，最短流程只有 3 步：

```bash
npx skills add Jnnndjjsnxbhhunheng/CopyAlpha
```

重启你的 agent 工具，然后对它说：

```text
Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill.
```

填好 `.env` 里的最少配置之后，CopyAlpha 会：

- 抓取这个 KOL 的历史推文
- 蒸馏出交易风格、叙事、Token 观点和模式
- 生成新的 `kol-inversebrah` Skill
- 自动安装到 OpenClaw、Claude Code、Codex 和通用 bundle 目录

## 安装方式

### 推荐：像 OKX 一样通过 `skills add` 安装

```bash
npx skills add Jnnndjjsnxbhhunheng/CopyAlpha
```

适合大多数最终用户：

- 直接把仓库中的 `skills/` 作为技能源安装
- 安装体验与 `npx skills add okx/onchainos-skills` 一致
- `skills` CLI 已可识别本仓库中的 `copyalpha-kol-factory`

### CLI 方式（适合脚本化或不使用 `skills add` 时）

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha install-skill
```

适合直接运行 CLI 安装器，或你想手动把工厂 Skill 写入多个 agent 目录时使用。

### npm CLI（发布后可用）

```bash
npx copyalpha@latest install-skill
```

适合 npm 包已经同步可见后使用。

### 本地开发安装

```bash
npm install
npm run build
npm link
copyalpha install-skill
```

适合本地调试 CLI 和 Skill 模板。

## 用户全程使用流程

### 1) 安装工厂 Skill

```bash
npx skills add Jnnndjjsnxbhhunheng/CopyAlpha
```

这个命令会把仓库里的 `copyalpha-kol-factory` 安装进你的本地 skill 系统。

如果你希望手动用 CLI 直接写入多个 agent 目录，也可以执行：

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha install-skill
```

CLI 方式会把 `copyalpha-kol-factory` 安装到以下位置：

- OpenClaw：`~/.openclaw/skills/copyalpha-kol-factory/`
- Codex / OpenAI 风格：`~/.codex/skills/copyalpha-kol-factory/`
- Claude Code：`~/.claude/agents/copyalpha-kol-factory.md`
- 通用 portable bundle：`~/.agent-skills/copyalpha-kol-factory/`

### 2) 重启你的 agent 工具

安装完成后，重启你正在使用的 agent 工具，例如：

- OpenClaw
- Claude Code
- Codex
- 其他支持读取本地 skill / subagent 的 agent

### 3) 在 agent 中调用工厂 Skill

直接对 agent 说：

```text
Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill.
```

也可以用中文表达，例如：

```text
用 copyalpha-kol-factory 抓取 @inversebrah 的推文，并生成一个新的 KOL Skill。
```

### 4) 填写工作区配置

工厂 Skill 会先初始化一个本地工作区，然后要求你填写 `.env`。

**必填**

- `SOCIALDATA_API_KEY` — 从 [socialdata.tools](https://socialdata.tools) 获取

**常用 OpenClaw 配置**

- `LLM_PROVIDER=openclaw`
- `OPENCLAW_GATEWAY_BASE_URL=http://127.0.0.1:18789/v1`
- `OPENCLAW_AGENT_ID=main`
- `OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`（仅在网关开启认证时需要）
- 确认 OpenClaw Gateway 已启用 `chatCompletions` 端点：`gateway.http.endpoints.chatCompletions.enabled = true`

**OpenAI-compatible 模式（可选）**

- `LLM_PROVIDER=openai-compatible`
- `LLM_BASE_URL=https://your-llm-gateway/v1`
- `LLM_API_KEY=your-api-key`

### 5) 工厂 Skill 自动完成采集、蒸馏、安装

底层等价于执行：

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha init
npx github:Jnnndjjsnxbhhunheng/CopyAlpha forge materialize @inversebrah --install --targets openclaw,codex,claude,bundle
```

这一步会自动完成：

- 追踪该 KOL
- 抓取历史推文
- 提取交易信号
- 蒸馏交易风格 / 宏观看法 / Token 观点 / 重复模式
- 生成新的 `kol-{username}` Skill
- 把这个新 Skill 安装到全局 agent 目录

### 6) 之后直接使用新生成的 KOL Skill

生成并安装完成后，你就可以在 agent 里继续用这个新 Skill：

```text
Use $kol-inversebrah to analyze SOL.
```

或者：

```text
参考 @inversebrah 的历史交易风格，帮我看一下 PEPE。
```

## 新 Skill 会安装到哪里

| 目标 | 默认位置 | 用途 |
|---|---|---|
| OpenClaw | `~/.openclaw/skills/kol-{username}/` | 给 OpenClaw 直接读取完整 Skill bundle |
| Codex / OpenAI 风格 | `~/.codex/skills/kol-{username}/` | 给 Codex / OpenAI 风格环境读取 |
| Claude Code | `~/.claude/agents/kol-{username}.md` | 给 Claude Code 作为 subagent 使用 |
| 通用 bundle | `~/.agent-skills/kol-{username}/` | 作为跨 agent 的 portable skill bundle |

## 命令行直接使用

### 初始化工作区

```bash
copyalpha init
```

### 安装工厂 Skill

```bash
copyalpha install-skill
copyalpha install-skill --targets openclaw,claude
```

### 一键生成并安装新的 KOL Skill

```bash
copyalpha forge materialize @inversebrah --install
copyalpha forge materialize @DefiIgnas --count 800 --install
```

### 安装已经生成好的 KOL Skill

```bash
copyalpha forge install inversebrah
copyalpha forge install inversebrah --targets openclaw,claude
```

### 只生成、不安装

```bash
copyalpha forge build inversebrah
```

### 采集命令

```bash
copyalpha harvest add @inversebrah
copyalpha harvest status
copyalpha harvest monitor
```

### 咨询命令

```bash
copyalpha consult analyze PEPE
copyalpha consult ask inversebrah "怎么看 SOL 生态？"
copyalpha consult consensus SOL
copyalpha consult critique "用 5% 仓位做多 ARB"
copyalpha consult recommend
copyalpha consult leaderboard
```

## 环境变量

编辑工作区中的 `.env`：

| 变量 | 必需 | 说明 |
|---|---|---|
| `SOCIALDATA_API_KEY` | 是 | SocialData API Key（从 [socialdata.tools](https://socialdata.tools) 获取） |
| `LLM_PROVIDER` | 否 | 默认 `openclaw`，也可切到 `openai-compatible` |
| `LLM_MODEL` | 否 | 默认 `openclaw` |
| `OPENCLAW_GATEWAY_BASE_URL` | 否 | OpenClaw 模式的网关地址，默认 `http://127.0.0.1:18789/v1` |
| `OPENCLAW_AGENT_ID` | 否 | 默认 `main`，作为 OpenClaw 目标 agent ID |
| `OPENCLAW_GATEWAY_TOKEN` | 否 | OpenClaw Gateway 令牌认证 |
| `OPENCLAW_GATEWAY_PASSWORD` | 否 | OpenClaw Gateway 密码认证 |
| `LLM_BASE_URL` | 否 | OpenAI-compatible 模式的接口地址；也可覆盖默认 OpenClaw 地址 |
| `LLM_API_KEY` | 否 | OpenAI-compatible 模式的接口认证；也可作为网关 Bearer Token 覆盖项 |
| `LLM_TIMEOUT_MS` | 否 | LLM 请求超时，默认 `120000` |
| `LLM_MAX_RETRIES` | 否 | 可恢复 LLM 错误的最大重试次数，默认 `4` |
| `LLM_RETRY_BASE_DELAY_MS` | 否 | 首次重试等待时间，默认 `1500` |
| `LLM_RETRY_MAX_DELAY_MS` | 否 | 重试退避最大等待时间，默认 `15000` |
| `OKX_API_KEY` | 否 | OKX OnchainOS API Key（链上查询用） |
| `OKX_SECRET_KEY` | 否 | OKX Secret Key |
| `OKX_PASSPHRASE` | 否 | OKX Passphrase |
| `HARVEST_INTERVAL_SECONDS` | 否 | 增量监控轮询间隔 |
| `HARVEST_HISTORY_DEPTH` | 否 | 默认历史抓取深度 |
| `HARVEST_MAX_CONCURRENT` | 否 | 最大并发抓取数 |

## OpenClaw-first LLM 模式

当前版本已经从“模型 SDK 直连”改成了 **OpenClaw-first 的 OpenAI-compatible 调用**：

- 默认向 OpenClaw Gateway 发起 `/v1/chat/completions` 请求
- 如果配置了认证，会自动携带 `Authorization: Bearer ...`
- 默认通过 `x-openclaw-agent-id` 指定 OpenClaw 里的 agent
- 如果你不走 OpenClaw，也可以把 `LLM_PROVIDER` 切成 `openai-compatible`，再提供自己的 `LLM_BASE_URL` 和 `LLM_API_KEY`
- 对 `concurrency limit exceeded`、`rate limit`、`timeout`、`socket hang up`、HTTP `429/5xx` 等可恢复错误会自动 retry + backoff

## OpenClaw 排障

- `404 Not Found`：通常是 OpenClaw Gateway 没开 chat completions 端点；启用 `gateway.http.endpoints.chatCompletions.enabled = true` 后重启 gateway
- `401 Unauthorized`：通常是网关认证没配好；检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`

## OKX OnchainOS Skills（可选）

Consult 模块在做链上验证时会调用 [OKX OnchainOS Skills](https://github.com/okx/onchainos-skills)（价格、持仓、Smart Money、Token 分析等）。
OnchainOS Skills 提供 5 个核心能力：

| Skill | 用途 |
|---|---|
| `okx-wallet-portfolio` | 钱包余额、Token 持仓、组合估值 |
| `okx-dex-market` | 实时价格、K 线、成交记录、Meme 扫描 |
| `okx-dex-token` | Token 搜索、元数据、市值排名、持仓者分析 |
| `okx-dex-swap` | DEX 聚合交易，接入 500+ 流动性源 |
| `okx-onchain-gateway` | Gas 估算、交易模拟、广播、订单追踪 |

### 1) 安装 OnchainOS Skills

**通用方式（推荐，自动检测环境）：**

```bash
npx skills add okx/onchainos-skills
```

**Claude Code：**

```
/plugin marketplace add okx/onchainos-skills
/plugin install onchainos-skills
```

**Codex CLI：**

告诉 Codex："Fetch and follow instructions from https://raw.githubusercontent.com/okx/onchainos-skills/refs/heads/main/.codex/INSTALL.md"

**macOS / Linux CLI：**

```bash
curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/main/install.sh | sh
```

### 2) 获取 API Key

1. 前往 [OKX 开发者后台](https://web3.okx.com/onchain-os/dev-portal)
2. 点击 **Connect Wallet** 登录（推荐 OKX Wallet）
3. 在 **Settings** 绑定邮箱 / 手机号完成验证
4. 选择项目 → **API keys** → **Create API key**，填入名称和 Passphrase
5. 系统生成 **API Key** + **Secret Key**，连同你设的 **Passphrase** 一起保存

写入 `.env`：

```bash
OKX_API_KEY=your-api-key
OKX_SECRET_KEY=your-secret-key
OKX_PASSPHRASE=your-passphrase
```

> 仓库自带沙箱测试 Key，可用于本地验证，但有频率限制。生产环境务必用自己的 Key。

## 项目工作流

```text
Twitter / X KOL 推文
  ↓
Harvest 采集
  ↓
Distill 蒸馏
  ↓
Forge 锻造
  ↓
KOL Skill Bundle
  ├── OpenClaw skill
  ├── Codex / OpenAI skill
  ├── Claude Code subagent
  └── Portable bundle
```

## 各模块职责

| 模块 | 职责 |
|---|---|
| `Harvest` | 通过 SocialData API 抓取推文（tweets + highlights） |
| `Distill` | 用 LLM 提取交易信号、风格、叙事、模式 |
| `Forge` | 生成 KOL Skill 文件，并安装到不同 agent 目标 |
| `Consult` | 加载 KOL Skills，结合链上数据输出综合分析 |

## 适用场景

适合以下需求：

- 你想把某个 KOL 的历史观点整理成一个长期可复用的 agent skill
- 你希望同一个 KOL Skill 同时给 OpenClaw、Claude Code、Codex、其他 agent 使用
- 你想做"多 KOL 共识分析"，而不是手工翻历史推文
- 你想把 KOL 的判断模式沉淀成结构化知识，而不是一次性总结

## 重名处理

- 如果生成出的 skill 名已被占用，CopyAlpha 会自动追加后缀，例如 `kol-username-2`。
- 如果已存在的 bundle 本来就是同一个 KOL，CopyAlpha 会直接复用并更新，而不是再生成一份重复技能。

## 发布检查（维护者）

注意区分两层：

- `copyalpha`：这是要发布到 npm 的 CLI 包。
- `kol-*`：这是运行时生成并安装到本地 skill 系统里的技能目录，**不需要单独发布**。

```bash
npm install
npm run release:check
```

本地发布：

```bash
npm version patch
npm run release:publish
```

GitHub Actions 发布：

- 在仓库里配置 `NPM_TOKEN`
- 推送版本标签，例如 `v2.0.1`
- 工作流会执行 `.github/workflows/publish-npm.yml`

当 `copyalpha` 首次成功发布到 npm 后，终端用户就可以重新使用：

```bash
npx copyalpha@latest install-skill
```

## 路线图

- 更好的 skill 展示页
- Python SDK / Python 包装层
- 托管式 skill registry
- 更完整的 KOL 增量更新自动化

## License

Apache-2.0
