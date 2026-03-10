# CopyAlpha

> 把 Twitter / X 上的 KOL，沉淀成可复用、可全局安装的 Agent Skill

CopyAlpha 是一个 **KOL Skill 工厂**。
它会抓取指定 KOL 的历史推文，提炼交易风格、叙事判断、Token 观点和重复模式，然后生成新的 `kol-{username}` Skill，并把它安装到不同 agent 可读取的位置。

这不是跟单机器人，也不是一次性摘要工具。
它更像一个“专家知识压缩器”——把某个 KOL 过去公开表达过的交易思路，整理成一个可以长期复用的技能包。

## TL;DR

支持的目标运行时：`OpenClaw`、`Claude Code`、`Codex`，以及其他可读取本地 portable bundle 的 agent。

如果你是最终用户，主流程可以压缩成下面这 3 步：

```bash
npx copyalpha@latest install-skill
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

---

## 安装方式

### 正式发布版（推荐）

```bash
npx copyalpha@latest install-skill
```

适合大多数最终用户：

- 直接从 npm 拉取已构建好的 CLI
- 不依赖本地仓库副本
- 安装后即可把工厂 Skill 写入 `OpenClaw` / `Codex` / `Claude Code` / 通用 bundle 目录

### GitHub 回退安装

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha install-skill
```

适合 npm 还没发布、或你想先试主分支版本时使用。

### 本地开发安装

```bash
npm install
npm run build
npm link
copyalpha install-skill
```

适合本地调试 CLI 和 Skill 模板。

## 安装与使用流程（最终用户）

### 1) 安装“工厂 Skill”

推荐流程是：先安装一个通用的工厂 Skill，后续都通过它来生产新的 KOL Skill。

**推荐：npm 发布后使用**

```bash
npx copyalpha@latest install-skill
```

**如果还没发布到 npm，可临时从 GitHub 直接运行**

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha install-skill
```

这个命令会把 `copyalpha-kol-factory` 安装到以下位置：

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

- `TWITTER_BEARER_TOKEN`

**OpenClaw-first 模式下，CopyAlpha 不需要直接配置模型厂商 API Key。**
CopyAlpha 会优先把 LLM 请求发到 OpenClaw Gateway 的 OpenAI-compatible 接口，由 OpenClaw 负责选择底层模型与密钥。
如果你的 OpenClaw Gateway 已经在本机可访问且未开启额外认证，CopyAlpha 侧通常只需要 `TWITTER_BEARER_TOKEN`。
如果 Gateway 开启认证，再补 `OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD` 即可。

**常用 OpenClaw LLM 配置**

- `LLM_PROVIDER=openclaw`
- `OPENCLAW_GATEWAY_BASE_URL=http://127.0.0.1:18789/v1`
- `OPENCLAW_AGENT_ID=main`
- `OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`（仅在网关开启认证时需要）

**可选**

- `NITTER_INSTANCES`
- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`
- `WALLET_ADDRESS`
- `LLM_MODEL`
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_TIMEOUT_MS`

### 5) 工厂 Skill 自动完成采集、蒸馏、安装

底层等价于执行：

```bash
npx copyalpha@latest init
npx copyalpha@latest forge materialize @inversebrah --install --targets openclaw,codex,claude,bundle
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

默认会同时安装到 4 个目标：

| 目标 | 默认位置 | 用途 |
|---|---|---|
| OpenClaw | `~/.openclaw/skills/kol-{username}/` | 给 OpenClaw 直接读取完整 Skill bundle |
| Codex / OpenAI 风格 | `~/.codex/skills/kol-{username}/` | 给 Codex / OpenAI 风格环境读取 |
| Claude Code | `~/.claude/agents/kol-{username}.md` | 给 Claude Code 作为 subagent 使用 |
| 通用 bundle | `~/.agent-skills/kol-{username}/` | 作为跨 agent 的 portable skill bundle |

如果你只想安装到部分目标，也可以手动指定：

```bash
npx copyalpha@latest forge materialize @inversebrah --install --targets openclaw
npx copyalpha@latest forge materialize @inversebrah --install --targets openclaw,claude
```

## 生成结果长什么样

每个 KOL 最终会产出一个独立技能包：

```text
generated-skills/kol-inversebrah/
├── SKILL.md              # 通用 Skill 入口 / portable bundle 说明
├── claude-agent.md       # Claude Code subagent 适配文件
├── agents/openai.yaml    # Codex / OpenAI 风格元数据
├── profile.json          # KOL 画像
├── knowledge.json        # Token 观点 / 宏观判断 / 叙事
├── signals-history.json  # 提取出的历史信号
└── style-guide.json      # 分析风格指南
```

这里面最重要的是：

- `SKILL.md`：通用 bundle 入口
- `claude-agent.md`：给 Claude Code 的适配层
- `agents/openai.yaml`：给 Codex / OpenAI 风格环境的元数据

## 命令行直接使用

如果你不想通过 agent 对话，也可以直接用 CLI。下面默认你已经能调用 `copyalpha`（例如通过 npm 发布包、`npm link` 或等价方式安装）。

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
| `TWITTER_BEARER_TOKEN` | 是 | Twitter API v2 Bearer Token |
| `LLM_PROVIDER` | 否 | 默认 `openclaw`，也可切到 `openai-compatible` |
| `LLM_MODEL` | 否 | 默认 `openclaw` |
| `OPENCLAW_GATEWAY_BASE_URL` | 否 | 默认 `http://127.0.0.1:18789/v1` |
| `OPENCLAW_AGENT_ID` | 否 | 默认 `main`，作为 OpenClaw 目标 agent ID |
| `OPENCLAW_GATEWAY_TOKEN` | 否 | OpenClaw Gateway 令牌认证 |
| `OPENCLAW_GATEWAY_PASSWORD` | 否 | OpenClaw Gateway 密码认证 |
| `LLM_BASE_URL` | 否 | 通用 OpenAI-compatible 接口地址覆盖项 |
| `LLM_API_KEY` | 否 | 通用 OpenAI-compatible 接口认证 |
| `LLM_TIMEOUT_MS` | 否 | LLM 请求超时，默认 `120000` |
| `NITTER_INSTANCES` | 否 | Nitter 实例列表，作为降级抓取方案 |
| `OKX_API_KEY` | 否 | OKX OnchainOS API Key |
| `OKX_SECRET_KEY` | 否 | OKX Secret Key |
| `OKX_PASSPHRASE` | 否 | OKX Passphrase |
| `WALLET_ADDRESS` | 否 | 钱包地址 |
| `HARVEST_INTERVAL_SECONDS` | 否 | 增量监控轮询间隔 |
| `HARVEST_HISTORY_DEPTH` | 否 | 默认历史抓取深度 |
| `HARVEST_MAX_CONCURRENT` | 否 | 最大并发抓取数 |

## LLM 调用模型

当前版本已经从“Anthropic SDK 直连”改成了 **OpenClaw-first 的 OpenAI-compatible 调用**：

- 默认向 OpenClaw Gateway 发起 `/v1/chat/completions` 请求
- 默认通过 `x-openclaw-agent-id` 指定 OpenClaw 里的 agent
- 如果你不走 OpenClaw，也可以把 `LLM_PROVIDER` 切成 `openai-compatible`，再提供自己的 `LLM_BASE_URL` 和 `LLM_API_KEY`

换句话说：

- **OpenClaw 模式**：CopyAlpha 只连接 OpenClaw Gateway，不直接持有模型厂商 Key
- **独立模式**：只需要一个兼容 OpenAI Chat Completions 的 LLM 网关即可

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
| `Harvest` | 抓取推文，支持 Twitter API / Nitter / 降级方案 |
| `Distill` | 用 LLM 提取交易信号、风格、叙事、模式 |
| `Forge` | 生成 KOL Skill 文件，并安装到不同 agent 目标 |
| `Consult` | 加载 KOL Skills，结合链上数据输出综合分析 |

## 适用场景

适合以下需求：

- 你想把某个 KOL 的历史观点整理成一个长期可复用的 agent skill
- 你希望同一个 KOL Skill 同时给 OpenClaw、Claude Code、Codex、其他 agent 使用
- 你想做“多 KOL 共识分析”，而不是手工翻历史推文
- 你想把 KOL 的判断模式沉淀成结构化知识，而不是一次性总结

## 发布检查（维护者）

正式发布到 npm 前，建议按这个顺序检查：

```bash
npm install
npm run build
npm test
npm run pack:check
```

然后再发布：

```bash
npm version patch
npm publish
```

如果你只是想先确认最终用户会拿到哪些文件，`npm run pack:check` 就够了。

## 本地开发

```bash
npm install
npm run build
npm test
```

常用命令：

```bash
npx jest tests/agent-skill-installer.test.ts --runInBand
npx tsc --noEmit
```

## 注意事项

- KOL 观点是历史归纳，不等于当前实时观点
- 生成出的 Skill 适合作为“专家参考”，不应替代实时市场与链上验证
- 当 KOL 观点与实时链上数据冲突时，应优先相信当前数据
- 这不是投资建议

## License

Apache-2.0
