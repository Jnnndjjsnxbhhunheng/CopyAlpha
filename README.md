# CopyAlpha

> **把 KOL 变成你的私人 Skill，让 AI 替你抄最聪明的作业**

CopyAlpha 是一个 AI 原生的 KOL 知识提炼系统。它从推特 KOL 的历史推文中提取结构化交易知识，打包为可复用的 **KOL Skill**，让 AI Agent 在做交易分析时像"请教专家"一样调用这些 Skill，并结合 OKX OnchainOS 链上数据输出综合决策。

**这不是跟单机器人** — 这是一个 Skill 工厂。KOL Skill 是持久化、可迭代的知识资产，不是一次性信号。

## 架构

```
推特 KOL 推文 → [Harvest 采集] → [Distill 蒸馏] → [Forge 锻造] → KOL Skill
                                                                    │
                    AI Agent: "分析 $PEPE"                           │
                        │                                           │
                        ├── [Consult] 加载 KOL Skills ◀─────────────┘
                        ├── [Consult] 调用 OnchainOS (行情/持仓/链上数据)
                        └── 综合输出: 买/卖/观望 + 理由 + KOL 共识
```

| 层 | 职责 | 调用频率 |
|---|------|---------|
| **Harvest** | 抓取推文 (Twitter API / Nitter 降级) | 定时轮询 |
| **Distill** | LLM 提炼信号、画像、模式、回测 | 每批新推文 |
| **Forge** | 打包为 KOL Skill (SKILL.md + JSON) | 每日/每周 |
| **Consult** | 加载 Skill + OnchainOS → 综合分析 | 按需实时 |

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装

```bash
git clone https://github.com/Jnnndjjsnxbhhunheng/CopyAlpha.git
cd CopyAlpha
bash install.sh
```

或手动安装：

```bash
npm install
cp .env.example .env
# 编辑 .env 填入 API Keys
```

### 配置

编辑 `.env` 文件，填入必要的 API 密钥：

| 变量 | 必需 | 说明 |
|------|------|------|
| `TWITTER_BEARER_TOKEN` | 是 | Twitter API v2 Bearer Token |
| `ANTHROPIC_API_KEY` | 是 | Anthropic Claude API Key |
| `NITTER_INSTANCES` | 否 | Nitter 实例列表 (Twitter API 降级方案) |
| `OKX_API_KEY` | 否 | OKX OnchainOS API Key (链上数据验证) |
| `OKX_SECRET_KEY` | 否 | OKX Secret Key |
| `OKX_PASSPHRASE` | 否 | OKX Passphrase |
| `WALLET_ADDRESS` | 否 | 钱包地址 (持仓查询) |
| `LLM_MODEL` | 否 | LLM 模型 (默认 claude-sonnet-4-20250514) |

## 使用方式

所有命令通过 `npx ts-node src/cli.ts` 运行：

### 采集 KOL 推文

```bash
# 添加 KOL 并抓取历史推文
npx ts-node src/cli.ts harvest add @inversebrah
npx ts-node src/cli.ts harvest add @DefiIgnas

# 查看采集状态
npx ts-node src/cli.ts harvest status

# 启动增量监控
npx ts-node src/cli.ts harvest monitor
```

### 生成 KOL Skill

```bash
# 为单个 KOL 生成 Skill
npx ts-node src/cli.ts forge build inversebrah

# 一键采集 + 蒸馏 + 锻造成新 Skill
npx ts-node src/cli.ts forge materialize @inversebrah
npx ts-node src/cli.ts forge materialize @DefiIgnas --count 800

# 重建所有 KOL Skill
npx ts-node src/cli.ts forge all
```

如果你把本项目作为 npm CLI 发布或本地 `npm link`，同样的命令也可以写成：

```bash
copyalpha init
copyalpha forge materialize @inversebrah
```

生成的 Skill 存放在 `generated-skills/kol-{username}/` 目录：

```
generated-skills/kol-inversebrah/
├── SKILL.md              # AI Agent 读取的入口文档
├── profile.json          # KOL 画像 (风格/胜率/可信度)
├── knowledge.json        # 知识图谱 (Token 观点/宏观判断)
├── signals-history.json  # 历史信号 + 回测结果
└── style-guide.json      # 分析风格指南
```

### 作为 Codex Skill 安装

仓库内新增了可安装的 Codex Skill：`skills/copyalpha-kol-factory/`。

这个 Skill 的作用是：

- 自动准备 CopyAlpha 工作区
- 对指定 Twitter/X 用户抓取历史推文
- 运行 `forge materialize`，直接生成新的 `generated-skills/kol-{username}/`

安装后，用户就可以让 Codex 使用这个 Skill 来“把某个 KOL 沉淀成新 Skill”。

### 交易分析

```bash
# 综合分析 (KOL 观点 + 链上数据)
npx ts-node src/cli.ts consult analyze PEPE
npx ts-node src/cli.ts consult analyze ETH "现在适合加仓吗？"

# 向特定 KOL 提问
npx ts-node src/cli.ts consult ask inversebrah "怎么看 SOL 生态？"

# 多 KOL 共识
npx ts-node src/cli.ts consult consensus SOL

# 评价交易想法
npx ts-node src/cli.ts consult critique "用 5% 仓位做多 ARB"

# 机会推荐
npx ts-node src/cli.ts consult recommend

# KOL 龙虎榜
npx ts-node src/cli.ts consult leaderboard
```

## 开发

```bash
# 构建
npm run build

# 测试
npm test

# 单个测试
npx jest tests/parser.test.ts

# 类型检查
npx tsc --noEmit

# 也可以用 Makefile
make test
make build
make lint
```

## 项目结构

```
src/
├── harvest/          # 采集层: Twitter 抓取 + 增量监控
├── distill/          # 蒸馏层: LLM 信号提取/画像/模式/回测
├── forge/            # 锻造层: KOL Skill 生成 + 质量检查
├── consult/          # 咨询层: 综合分析 + OnchainOS 桥接
├── storage/          # 存储层: SQLite
├── shared/           # 共享: 配置 + LLM 客户端
├── types.ts          # 全局类型定义
├── cli.ts            # CLI 入口
└── index.ts          # 编程式 API 入口
tests/                # 测试
generated-skills/     # 生成的 KOL Skills
```

## 技术栈

| 组件 | 选型 |
|------|------|
| 运行时 | Node.js + TypeScript (strict) |
| LLM | Anthropic Claude Sonnet |
| 存储 | SQLite (better-sqlite3) |
| 推特抓取 | twitter-api-v2 + cheerio |
| 链上数据 | OKX OnchainOS Skills |
| 模板引擎 | Handlebars |
| 定时任务 | node-cron |
| CLI | Commander.js |

## 与 OnchainOS 的关系

CopyAlpha 不替代 OnchainOS，而是作为其上游消费者：

- `okx-wallet-portfolio` — 查询用户持仓
- `okx-dex-market` — 实时行情、K线、Smart Money 流向
- `okx-dex-token` — Token 元数据、持仓分布
- `okx-dex-swap` — 交易执行 (后续阶段)

当 OnchainOS 不可用时，CopyAlpha 降级为纯 KOL 观点分析，并在报告中标注缺少链上验证。

## 免责声明

- KOL 观点仅供参考，最终决策以链上数据为准
- 所有交易操作需要用户确认
- 这不是投资建议

## License

[Apache-2.0](LICENSE)
