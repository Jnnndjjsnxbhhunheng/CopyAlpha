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

## 💡 什么是 CopyAlpha？不仅仅是总结，更是"数字分身"

CopyAlpha 是一个创新的 **KOL Agent Skill 锻造工厂**。它不是传统的跟单机器人或简单的新闻摘要工具，而是一个高保真的"专家知识压缩器"。它通过深度抓取目标 KOL 的历史推文，利用 LLM 进行防幻觉的交叉比对，提炼出该 KOL 的交易风格、叙事判断、Token 偏好和胜率模式，最终生成一个独立的 `kol-{username}` Skill 插件。

**最核心的创新在于：** 当 CopyAlpha 提炼的"KOL 大脑"与 OKX OnchainOS Skills 结合时，你的 Agent 将瞬间获得"知行合一"的能力——既能像顶级交易员一样思考，又能直接调动链上流动性进行验证和交易。

## 🌟 核心杀手锏：CopyAlpha × OKX OnchainOS 的化学反应

在传统的 Agent 生态中，信息获取与交易执行往往是割裂的。CopyAlpha 通过模块化设计，完美兼容并赋能 OKX OnchainOS Skills：

- **认知层 (CopyAlpha)**： 解析 KOL 逻辑（例如："@inversebrah 认为 SOL 生态的 Meme 存在局部低估"）。
- **验证层 (OKX Dex Market / Token)**： Agent 自动调用 OKX Skill 查询链上真实价格、持仓分布和 Smart Money 动向，交叉验证 KOL 的观点。
- **执行层 (OKX Dex Swap / Gateway)**： 达成共识后，Agent 可直接通过 OKX OnchainOS 模拟交易、估算 Gas 并完成 DEX 聚合路由。

> "CopyAlpha 负责提纯交易智慧，OKX OnchainOS 负责将其转化为链上资产。"

## 🚀 TL;DR：极致的开箱即用与可复制性

CopyAlpha 追求极致的开发者/用户体验。只需 3 步，即可在你的本地 Agent 环境中部署顶级交易员的认知模型：

```bash
# 1. 像安装 OKX 官方技能一样，全局安装 CopyAlpha 工厂
npx skills add Jnnndjjsnxbhhunheng/CopyAlpha

# 2. 重启你的 Agent（支持 OpenClaw, Claude Code, Codex 等）
# 3. 发送自然语言指令，触发全自动构建流水线：
"Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill."
```

填写 `.env` 中的基础 API Key 后，系统将全自动完成：**追踪抓取 ➔ 数据蒸馏 ➔ 技能生成 ➔ 全局挂载**。

## ⚙️ 灵活的安装机制

CopyAlpha 提供了多种安装方式以适配不同的生产与测试环境：

### 推荐：标准化 skills add 接入（对齐行业标准）

```bash
npx skills add Jnnndjjsnxbhhunheng/CopyAlpha
```

**优势**：无缝集成，与 `npx skills add okx/onchainos-skills` 享有完全一致的丝滑体验。

### CLI 方式（适合 CI/CD 脚本化部署）

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha install-skill
```

### 本地二次开发

```bash
npm install && npm run build && npm link
copyalpha install-skill
```

## 🗺️ 标准化用户工作流

CopyAlpha 将复杂的 AI 提纯过程封装为了极简的交互：

### 1) 启动与配置

安装工厂 Skill 后，CopyAlpha 会在本地初始化工作区，你需要配置必要的鉴权信息。

**核心配置 (.env)**：

- `SOCIALDATA_API_KEY`: 社交数据源（从 [socialdata.tools](https://socialdata.tools) 获取）。

**OpenClaw 环境（默认且推荐）**：

```bash
LLM_PROVIDER=openclaw
OPENCLAW_GATEWAY_BASE_URL=http://127.0.0.1:18789/v1
```

**网关容错**：内置针对 Timeout, Rate Limit, 429 状态码的 Retry+Backoff 自愈机制，确保高并发抓取时的稳定性。

**OKX OnchainOS 赋能配置（深度整合必备）**：

- `OKX_API_KEY` / `OKX_SECRET_KEY` / `OKX_PASSPHRASE`: 激活链上数据验证与交易执行能力。

### 2) 一键锻造 (Forge) KOL Skill

对你的 Agent 输入指令，或通过底层 CLI 直接执行：

```bash
copyalpha forge materialize @DefiIgnas --count 800 --install --targets openclaw,codex,claude,bundle
```

此命令将处理该 KOL 最近的 800 条高质量推文，提取高频叙事，打包为 `kol-DefiIgnas` 技能，并跨平台分发至所有主流 Agent 目录。

### 3) 跨端调用与智能共识 (Consult)

技能生成后，你的 Agent 即可直接调用。配合 OKX OnchainOS，你可以发起复杂的组合提问：

- **单点分析**： "Use $kol-inversebrah to analyze SOL."
- **策略对齐**： "参考 @DefiIgnas 的宏观框架，结合 OKX Wallet Portfolio，评估我当前的持仓风险。"
- **多源共识**： `copyalpha consult consensus SOL` （让多个已安装的 KOL 模型对同一标的进行辩论与打分）。

## 🌐 跨生态分发：Skill 会安装到哪里？

CopyAlpha 采用了**"一次生成，多端运行"**的 Portable 架构：

| 目标框架 | 默认挂载路径 | 运行时角色 |
|---|---|---|
| OpenClaw | `~/.openclaw/skills/kol-{username}/` | 原生 Skill Bundle，享用完整上下文 |
| Claude Code | `~/.claude/agents/kol-{username}.md` | 作为独立 Subagent 被主控调度 |
| Codex / OpenAI | `~/.codex/skills/kol-{username}/` | 兼容 OpenAI 工具调用格式 |
| 通用 Bundle | `~/.agent-skills/kol-{username}/` | 供第三方 Agent 引擎热加载的跨平台包 |

## 🛠️ CLI 核心命令集 (面向极客)

除了在 Agent 中通过自然语言调度，你也可以通过 CLI 精准控制数据管线：

**数据采集 (Harvest)**：
- `copyalpha harvest add @inversebrah`
- `copyalpha harvest monitor`

**技能编译 (Forge)**：
- `copyalpha forge build inversebrah` (仅编译不安装)
- `copyalpha forge install inversebrah`

**终端咨询 (Consult)**：
- `copyalpha consult ask inversebrah "怎么看目前的以太坊 L2 竞争？"`

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

## 🔗 必须开启的"超能力"：接入 OKX OnchainOS Skills

为了让 CopyAlpha 提取的"观点"拥有验证事实的基准，我们强烈建议搭配部署 OKX OnchainOS Skills。

### 1. 极速安装 OnchainOS：

```bash
npx skills add okx/onchainos-skills
```

(支持 Claude Code 的 `/plugin marketplace` 和 Codex 自动化拉取)

### 2. 核心联动场景：

一旦同时挂载了 `kol-{name}` 和 `okx-*` 技能，你的 Agent 将解锁以下能力流：

- **发现 ➔ 查验**： 用 CopyAlpha 发现 KOL 提及的早期 Alpha Token ➔ 用 `okx-dex-token` 查看链上真实的聪明钱持仓和池子深度。
- **判断 ➔ 执行**： 让 CopyAlpha 模仿 KOL 的仓位管理策略 ➔ 通过 `okx-dex-swap` 寻找全网最优流动性并模拟下单。
- **跟踪 ➔ 结算**： 持续利用 `okx-wallet-portfolio` 追踪该策略的胜率与组合估值变化。

## 🏗️ 底层架构设计 (Workflow)

本项目采用了严谨的流水线设计，确保数据的低噪与高保真：

```
[ 社交数据源 ] Twitter / X 推文 (含 Highlights)
      ↓
[ 采集引擎 ] Harvest Module (并发控制、增量更新机制)
      ↓
[ 大脑核心 ] Distill Module (LLM 风格映射、叙事提取、去重防幻觉)
      ↓
[ 技能工厂 ] Forge Module (AST 构建、Prompt 模板实例化、Bundle 打包)
      ↓
[ 执行生态 ] Agent Skills (跨端分发) 🔄 协同互调 🔄 OKX OnchainOS (链上交互)
```

## 📅 路线图 (Roadmap)

我们致力于将 CopyAlpha 打造为 Web3 Agent 生态的基础设施：

- [ ] **KOL 增量流式更新**： 支持监听特定大 V，实现 Skill 的热更新。
- [ ] **防幻觉审计升级**： 引入更严格的多阶段审计流水线，过滤 KOL 情绪化发言，只保留有效交易逻辑。
- [ ] **Python SDK**： 提供对流行 Python Agent 框架（如 LangChain, AutoGen）的原生支持。
- [ ] **托管式 Registry**： 建立优质 KOL 技能的去中心化共享市场。

## 环境变量参考

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

## License

Apache-2.0
