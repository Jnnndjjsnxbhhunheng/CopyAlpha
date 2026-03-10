# CopyAlpha

> 把 Twitter / X 上的 KOL，沉淀成可复用、可全局安装的 Agent Skill

CopyAlpha 是一个 **KOL Skill 工厂**。
它会抓取指定 KOL 的历史推文，提炼交易风格、叙事判断、Token 观点和重复模式，然后生成新的 `kol-{username}` Skill，并把它安装到不同 agent 可读取的位置。

这不是跟单机器人，也不是一次性摘要工具。
它更像一个“专家知识压缩器”——把某个 KOL 过去公开表达过的交易思路，整理成一个可以长期复用的技能包。

## TL;DR

如果你是最终用户，主流程只有 3 步：

```bash
npx copyalpha@latest install-skill
```

重启你的 agent 工具，然后对它说：

```text
Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill.
```

填好 `.env` 里的 API Key 之后，CopyAlpha 会：

- 抓取这个 KOL 的历史推文
- 蒸馏出交易风格、叙事、Token 观点和模式
- 生成新的 `kol-inversebrah` Skill
- 自动安装到全局目录，供不同 agent 使用

---

## 用户全程使用流程

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

- 通用 portable bundle：`~/.agent-skills/copyalpha-kol-factory/`
- Codex / OpenAI 风格：`~/.codex/skills/copyalpha-kol-factory/`
- Claude Code：`~/.claude/agents/copyalpha-kol-factory.md`

### 2) 重启你的 agent 工具

安装完成后，重启你正在使用的 agent 工具，例如：

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
- `ANTHROPIC_API_KEY`

**可选**

- `NITTER_INSTANCES`
- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`
- `WALLET_ADDRESS`
- `LLM_MODEL`

### 5) 工厂 Skill 自动完成采集、蒸馏、安装

底层等价于执行：

```bash
npx copyalpha@latest init
npx copyalpha@latest forge materialize @inversebrah --install --targets bundle,codex,claude
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

默认会同时安装到 3 个目标：

| 目标 | 默认位置 | 用途 |
|---|---|---|
| 通用 bundle | `~/.agent-skills/kol-{username}/` | 作为跨 agent 的 portable skill bundle |
| Codex / OpenAI 风格 | `~/.codex/skills/kol-{username}/` | 给 Codex / OpenAI 风格环境直接读取 |
| Claude Code | `~/.claude/agents/kol-{username}.md` | 给 Claude Code 作为 subagent 使用 |

如果你只想安装到部分目标，也可以手动指定：

```bash
npx copyalpha@latest forge materialize @inversebrah --install --targets claude
npx copyalpha@latest forge materialize @inversebrah --install --targets bundle,codex
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
```

### 一键生成并安装新的 KOL Skill

```bash
copyalpha forge materialize @inversebrah --install
copyalpha forge materialize @DefiIgnas --count 800 --install
```

### 安装已经生成好的 KOL Skill

```bash
copyalpha forge install inversebrah
copyalpha forge install inversebrah --targets claude
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
| `ANTHROPIC_API_KEY` | 是 | Anthropic Claude API Key |
| `NITTER_INSTANCES` | 否 | Nitter 实例列表，作为降级抓取方案 |
| `OKX_API_KEY` | 否 | OKX OnchainOS API Key |
| `OKX_SECRET_KEY` | 否 | OKX Secret Key |
| `OKX_PASSPHRASE` | 否 | OKX Passphrase |
| `WALLET_ADDRESS` | 否 | 钱包地址 |
| `LLM_MODEL` | 否 | 默认 `claude-sonnet-4-20250514` |
| `HARVEST_INTERVAL_SECONDS` | 否 | 增量监控轮询间隔 |
| `HARVEST_HISTORY_DEPTH` | 否 | 默认历史抓取深度 |
| `HARVEST_MAX_CONCURRENT` | 否 | 最大并发抓取数 |

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
  ├── portable bundle
  ├── Codex / OpenAI skill
  └── Claude Code subagent
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
- 你希望同一个 KOL Skill 同时给 Claude Code、Codex、其他 agent 使用
- 你想做“多 KOL 共识分析”，而不是手工翻历史推文
- 你想把 KOL 的判断模式沉淀成结构化知识，而不是一次性总结

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
