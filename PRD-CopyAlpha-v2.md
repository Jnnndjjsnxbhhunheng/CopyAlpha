# PRD: CopyAlpha（抄作业大师）

> **项目代号**: CopyAlpha / 抄作业大师  
> **Slogan**: *"把 KOL 变成你的私人 Skill，让 AI 替你抄最聪明的作业"*  
> **版本**: v2.0  
> **日期**: 2026-03-09  
> **作者**: Snopp  
> **目标用户**: Claude Code / Cursor / OpenClaw 等 AI Coding Agent  
> **参考架构**: OKX OnchainOS Skills（okx/onchainos-skills）  
> **开源协议**: Apache-2.0

---

## 1. 到底在做什么

### 1.1 一句话

**CopyAlpha 把推特 KOL 的历史推文提炼成一个个可调用的 AI Skill，当 AI Agent 需要做买卖分析时，像"请教专家"一样调用这些 KOL Skill，再结合 OnchainOS 的链上数据，输出交易决策。**

### 1.2 关键区分：我们不是交易机器人

| 维度 | 普通跟单工具 | CopyAlpha |
|------|-------------|-----------|
| 产出物 | 交易信号/买卖指令 | **KOL Skill**（可复用的知识资产） |
| KOL 数据 | 只看最新一条推文 | 提炼历史全量推文为结构化知识 |
| AI 怎么用 | 信号触发 → 执行 | Agent 分析时"请教" KOL Skill → 综合判断 |
| 与链上数据 | 独立运行 | **调用 OnchainOS Skills** 获取 Portfolio + 市场数据 |
| 知识沉淀 | 用完即弃 | 每个 KOL Skill 持续迭代、跨会话复用 |

### 1.3 核心流程

```
                    ┌─────────────────────────────────┐
                    │        CopyAlpha（Skill 工厂）     │
                    │                                   │
  推特 KOL 推文 ──→ │  抓取 → 提炼 → 生成 KOL Skill     │
                    │                                   │
                    └────────────┬────────────────────┘
                                 │
                    生成的 KOL Skills（知识资产）
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
  ┌───────▼───────┐   ┌─────────▼────────┐   ┌────────▼────────┐
  │ @CryptoKOL    │   │ @DefiResearcher  │   │ @MemeWhale      │
  │ Skill         │   │ Skill            │   │ Skill           │
  │               │   │                  │   │                 │
  │ • 交易风格     │   │ • 研究方法论      │   │ • Meme 嗅觉     │
  │ • 偏好赛道     │   │ • 看好的叙事      │   │ • 入场时机模式   │
  │ • 历史胜率     │   │ • 风险偏好        │   │ • 出货信号      │
  │ • 典型判断模式  │   │ • 链上分析角度    │   │ • 社区情绪判断   │
  └───────┬───────┘   └─────────┬────────┘   └────────┬────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    AI Agent 做交易分析时
                                 │
                    ┌────────────▼────────────────┐
                    │     Agent 综合决策引擎        │
                    │                              │
                    │  输入:                        │
                    │  ├── KOL Skills（专家观点）    │
                    │  ├── OnchainOS（链上真相）     │
                    │  │   ├── okx-wallet-portfolio │
                    │  │   ├── okx-dex-market       │
                    │  │   ├── okx-dex-token        │
                    │  │   └── okx-dex-swap         │
                    │  └── 用户的风险偏好            │
                    │                              │
                    │  输出:                        │
                    │  └── 买/卖/观望 + 理由         │
                    └──────────────────────────────┘
```

---

## 2. 核心概念：KOL Skill

### 2.1 什么是 KOL Skill

一个 KOL Skill 不是一堆原始推文的 dump，而是从该 KOL 的历史推文中**提炼出的结构化专家知识**，以标准 Skill 格式封装，可以被任何 AI Agent 调用。

就好比：原始推文是一个交易员的朋友圈，KOL Skill 是你花了 3 个月总结出来的"这个人到底怎么做交易的"笔记。

### 2.2 KOL Skill 的结构

每个生成的 KOL Skill 是一个独立的目录，遵循 onchainos-skills 的标准格式：

```
generated-skills/
└── kol-{username}/
    ├── SKILL.md                # Skill 描述文件（AI Agent 读这个）
    ├── profile.json            # KOL 画像（结构化元数据）
    ├── knowledge.json          # 提炼后的知识图谱
    ├── signals-history.json    # 历史信号记录 + 回测结果
    └── style-guide.json        # 该 KOL 的分析风格描述
```

### 2.3 SKILL.md 示例（自动生成）

下面是 CopyAlpha 为 `@CryptoTraderX` 自动生成的 SKILL.md：

```markdown
---
name: kol-CryptoTraderX
description: >
  @CryptoTraderX 的交易智慧 Skill。该 KOL 擅长 DeFi 赛道的中期波段交易，
  偏好在协议 TVL 出现异动时入场，历史推文胜率 67%，平均持仓周期 5-12 天。
  AI Agent 可调用此 Skill 获取该 KOL 的观点、风格和历史判断模式，
  用于辅助交易决策。
source: CopyAlpha v2.0
updated_at: 2026-03-09T08:30:00Z
tweet_count: 1,247
signal_count: 89
win_rate: 0.67
---

# @CryptoTraderX 交易智慧 Skill

## 何时调用此 Skill

- 当你需要分析 DeFi 类 token 是否值得买入时
- 当你看到某个协议的 TVL 发生大幅变化时
- 当你需要评估一个中期（1-2 周）的交易机会时
- 当你需要参考一个胜率 67% 的交易者的判断逻辑时

## KOL 画像

- **擅长赛道**: DeFi (Lending, DEX, Yield), L2
- **交易风格**: 中期波段，偏左侧交易
- **入场信号**: TVL 异动、大户地址变动、治理提案通过
- **出场信号**: 连续 3 天缩量上涨、团队抛售、叙事更替
- **风险偏好**: 中等，单笔不超过总仓位 8%
- **最佳表现期**: 市场震荡期（非单边牛/熊）
- **弱点**: 对 Meme 币判断较差，容易过早止盈

## 历史判断模式

### 高置信度模式（历史胜率 > 80%）
1. "协议 TVL 3 天内增长 >30% + 核心开发者活跃" → 看多
2. "Top10 持仓地址集体减持 + Funding Rate 极端正" → 看空
3. "治理提案涉及代币经济学重大变更 + 社区分裂" → 观望

### 中置信度模式（历史胜率 50-80%）
1. "KOL 圈集体喊单某 token" → 反向指标，谨慎
2. "新链 TGE 前 48h" → 短期看多但需快进快出

## 典型观点样本

> 以下为该 KOL 观点的提炼总结（非原文引用），用于 AI 理解其分析框架：

- 看 DeFi 项目首先看协议真实收入，不看 TVL 虚高
- 认为 L2 赛道目前过度拥挤，偏好押注基础设施层
- 对"叙事驱动"的项目持怀疑态度，更看重链上数据验证
- 多次强调"别人恐惧我贪婪"但实际执行中并不激进

## 如何结合此 Skill 做决策

当 AI Agent 分析某个 token 时：
1. 查询此 Skill 中该 KOL 是否提及过该 token 或同赛道 token
2. 匹配当前情况是否符合该 KOL 的高置信度模式
3. 结合 OnchainOS 的实时链上数据交叉验证
4. 如果 KOL 观点与链上数据一致 → 信号增强
5. 如果 KOL 观点与链上数据矛盾 → 以链上数据为准，标注分歧
```

### 2.4 profile.json 结构

```typescript
interface KOLProfile {
  // 基础信息
  username: string;
  display_name: string;
  bio: string;
  followers_count: number;
  following_count: number;
  account_created: string;

  // CopyAlpha 提炼的画像
  trading_style: {
    approach: "technical" | "fundamental" | "onchain" | "sentiment" | "mixed";
    timeframe: "scalp" | "swing" | "position" | "mixed";
    risk_appetite: "conservative" | "moderate" | "aggressive";
    preferred_sectors: string[];      // ["defi", "l2", "meme", "ai", ...]
    preferred_chains: string[];       // ["ethereum", "solana", "base", ...]
    avg_holding_period_days: number;
    max_position_size_pct: number;
  };

  // 历史表现（回测得出）
  performance: {
    total_signals: number;
    evaluated_signals: number;
    win_rate: number;
    avg_return_pct: number;
    best_call: { token: string; return_pct: number; date: string };
    worst_call: { token: string; return_pct: number; date: string };
    sharpe_ratio: number;
    max_drawdown_pct: number;
    active_since: string;           // 最早有交易信号的日期
    peak_performance_market: "bull" | "bear" | "sideways";
  };

  // 可信度评估
  credibility: {
    score: number;                  // 0-100
    transparency: number;           // 是否公开持仓/交易记录
    skin_in_game: number;           // 是否自己真金白银在交易
    shill_risk: number;             // 被项目方付费喊单的风险
    echo_chamber: number;           // 与其他 KOL 观点同质化程度
    contrarian_value: number;       // 逆向观点的价值
  };

  // 元数据
  last_scraped: string;
  tweet_count_scraped: number;
  skill_version: string;
  generated_by: "copyalpha@v2.0";
}
```

### 2.5 knowledge.json 结构

```typescript
interface KOLKnowledge {
  // 核心交易逻辑（从推文中提炼）
  trading_thesis: {
    current_narratives: {
      narrative: string;
      stance: "bullish" | "bearish" | "neutral";
      confidence: number;
      first_mentioned: string;
      mention_count: number;
      sample_reasoning: string;     // KOL 原始逻辑的提炼总结
    }[];

    recurring_patterns: {
      pattern_name: string;
      description: string;
      historical_accuracy: number;
      trigger_conditions: string[];
      typical_action: string;
      example_tweets: string[];     // tweet_id 引用
    }[];
  };

  // Token 级别的知识
  token_opinions: {
    [symbol: string]: {
      overall_stance: "bullish" | "bearish" | "neutral";
      conviction_level: number;     // 0-1
      price_targets: { price: number; date: string; hit: boolean }[];
      key_arguments: string[];      // 提炼后的核心论点
      last_mentioned: string;
      mention_frequency: "frequent" | "occasional" | "rare";
      consistency: number;          // 观点前后一致性
    };
  };

  // 宏观判断
  macro_views: {
    market_cycle_view: string;      // 对当前周期的判断
    btc_outlook: string;
    eth_outlook: string;
    sector_rankings: { sector: string; rank: number; reasoning: string }[];
    risk_factors: string[];
    last_updated: string;
  };

  // 该 KOL 与其他 KOL 的关系
  kol_network: {
    frequently_agrees_with: string[];
    frequently_disagrees_with: string[];
    often_quotes: string[];
    influence_score: number;        // 被其他 KOL 引用的频率
  };
}
```

---

## 3. CopyAlpha 自身的 Skill 架构

CopyAlpha 本身作为一个 Skill，负责**生产和管理 KOL Skills**，并在 AI Agent 分析时**编排调用**。

### 3.1 整体结构

```
copyalpha/
├── skills/
│   └── copyalpha/               # CopyAlpha 主 Skill
│       ├── SKILL.md             # Skill 描述（AI Agent 入口）
│       ├── index.ts             # 主入口
│       │
│       ├── harvest/             # 📡 采集层：抓取 KOL 推文
│       │   ├── scraper.ts       # 推特抓取（API / Nitter / Browser）
│       │   ├── parser.ts        # 推文结构化解析
│       │   ├── monitor.ts       # 增量监控 & 轮询
│       │   └── sources.ts       # 数据源管理 & 降级
│       │
│       ├── distill/             # 🧪 蒸馏层：推文 → 知识提炼
│       │   ├── signal-extractor.ts   # 交易信号提取（LLM）
│       │   ├── profile-builder.ts    # KOL 画像构建
│       │   ├── knowledge-builder.ts  # 知识图谱构建
│       │   ├── pattern-miner.ts      # 交易模式挖掘
│       │   └── backtester.ts         # 历史信号回测
│       │
│       ├── forge/               # 🔨 锻造层：知识 → KOL Skill
│       │   ├── skill-generator.ts    # 生成 SKILL.md + JSON
│       │   ├── skill-updater.ts      # 增量更新已有 Skill
│       │   ├── quality-checker.ts    # Skill 质量检查
│       │   └── templates/            # SKILL.md 生成模板
│       │       ├── skill-md.hbs
│       │       ├── profile.hbs
│       │       └── knowledge.hbs
│       │
│       ├── consult/             # 🎓 咨询层：AI Agent 调用 KOL Skill
│       │   ├── advisor.ts            # 综合咨询引擎
│       │   ├── skill-loader.ts       # 加载 KOL Skill
│       │   ├── cross-reference.ts    # 多 KOL 交叉验证
│       │   └── onchainos-bridge.ts   # 调用 OnchainOS 做链上验证
│       │
│       ├── storage/             # 💾 存储层
│       │   ├── db.ts                 # SQLite 数据库
│       │   ├── schema.sql            # 表结构
│       │   └── migrations/
│       │
│       └── types.ts             # 全局类型定义
│
├── generated-skills/            # 🎯 产出物：生成的 KOL Skills
│   ├── kol-inversebrah/
│   │   ├── SKILL.md
│   │   ├── profile.json
│   │   ├── knowledge.json
│   │   ├── signals-history.json
│   │   └── style-guide.json
│   ├── kol-defiignas/
│   │   └── ...
│   └── kol-0xsisyphus/
│       └── ...
│
├── CLAUDE.md                    # Claude Code 主入口指令
├── AGENTS.md                    # 通用 Agent 指令
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── install.sh
```

### 3.2 四层架构说明

| 层 | 代号 | 职责 | 调用频率 |
|---|------|------|---------|
| **Harvest** | 📡 采集 | 抓取推文原始数据 | 定时（每 1-5 分钟） |
| **Distill** | 🧪 蒸馏 | 用 LLM 从推文中提炼知识 | 每批新推文触发 |
| **Forge** | 🔨 锻造 | 将知识打包为标准 KOL Skill | 每天/每周定时重建 |
| **Consult** | 🎓 咨询 | AI Agent 调用 KOL Skill + OnchainOS 做分析 | 按需实时 |

```
推特 ──[Harvest]──→ 原始推文 ──[Distill]──→ 结构化知识 ──[Forge]──→ KOL Skill
                                                                      │
                                                                      │
          AI Agent: "帮我分析要不要买 $XYZ"                              │
                │                                                      │
                ├── [Consult] 加载相关 KOL Skills ◀────────────────────┘
                ├── [Consult] 调用 OnchainOS → okx-wallet-portfolio（我的持仓）
                ├── [Consult] 调用 OnchainOS → okx-dex-market（实时行情）
                ├── [Consult] 调用 OnchainOS → okx-dex-token（token 分析）
                │
                └── 综合输出：买/卖/观望 + 理由 + 哪些 KOL 支持/反对
```

---

## 4. Harvest 层：采集

### 4.1 能力

| 函数 | 说明 |
|------|------|
| `harvest.addKOL(username)` | 添加一个 KOL 到采集列表 |
| `harvest.removeKOL(username)` | 移除 KOL |
| `harvest.scrapeHistory(username, count)` | 批量抓取历史推文 |
| `harvest.startMonitor()` | 启动增量监控 |
| `harvest.getStatus()` | 查看采集状态 |

### 4.2 推文数据模型

```typescript
interface RawTweet {
  tweet_id: string;
  author_username: string;
  text: string;
  created_at: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
  context: {
    is_thread: boolean;
    thread_position?: number;
    is_reply_to?: string;
    is_quote_of?: string;
    media_urls: string[];
    urls: string[];
    hashtags: string[];
    cashtags: string[];
  };
}
```

### 4.3 数据源降级策略

```
Twitter API v2 (P0)  ──失败──→  Nitter 实例 (P1)  ──失败──→  Browser 自动化 (P2)
     │                              │                            │
     │ 300 req/15min                │ 无官方限制                  │ 最慢但最稳
     │ 需要 Elevated Access         │ 实例不稳定                  │ 需要登录态
     │ 数据最完整                    │ 缺少部分 metrics            │ 全量数据
```

### 4.4 配置

```env
# 推特数据源
TWITTER_BEARER_TOKEN="your-bearer-token"
NITTER_INSTANCES="https://nitter.privacydev.net,https://nitter.poast.org"

# 采集策略
HARVEST_INTERVAL_SECONDS=60        # 增量轮询间隔
HARVEST_HISTORY_DEPTH=500          # 首次抓取历史推文数
HARVEST_MAX_CONCURRENT=3           # 同时采集 KOL 数
```

---

## 5. Distill 层：蒸馏

这是 CopyAlpha 最核心的差异化能力 — 把零散的推文变成可调用的知识。

### 5.1 蒸馏流水线

```
原始推文
  │
  ├──[1. 过滤]──→ 只保留交易相关推文（过滤生活/广告/无关内容）
  │
  ├──[2. 信号提取]──→ 从推文中提取结构化交易信号
  │                    token / sentiment / price_target / timeframe
  │
  ├──[3. 画像构建]──→ 累积更新 KOL 画像
  │                    trading_style / risk_appetite / preferred_sectors
  │
  ├──[4. 模式挖掘]──→ 发现该 KOL 的重复判断模式
  │                    "每次 TVL 暴增他都会看空" 等
  │
  ├──[5. 回测验证]──→ 对历史信号做后验评估
  │                    信号发出后实际涨跌如何
  │
  └──[6. 知识图谱]──→ 构建 token_opinions / macro_views / kol_network
```

### 5.2 信号提取 Prompt

```yaml
system: |
  你是一个加密货币交易信号分析专家。
  你的任务是从推特帖子中提取交易相关信息，忽略所有非交易内容。

  对每条推文，判断：
  1. 是否包含交易信号（明确的买/卖/看多/看空表态）
  2. 如果是，提取具体信息
  3. 如果不是交易相关内容，返回 is_signal: false

  严格返回 JSON，无多余内容。

output_schema:
  type: object
  properties:
    is_signal: { type: boolean }
    signal:
      type: object
      nullable: true
      properties:
        tokens:
          type: array
          items:
            type: object
            properties:
              symbol: { type: string }
              chain: { type: string, nullable: true }
              sentiment: { enum: [bullish, bearish, neutral] }
              price_target: { type: number, nullable: true }
              stop_loss: { type: number, nullable: true }
              timeframe: { enum: [short, medium, long] }
        confidence: { type: number, minimum: 0, maximum: 1 }
        reasoning: { type: string }
    topic_tags: { type: array, items: { type: string } }
```

### 5.3 画像构建 Prompt（批量推文分析）

```yaml
system: |
  你是一个交易员分析专家。给定一个推特用户最近 N 条交易相关推文，
  总结此人的交易画像。

  分析维度：
  1. 交易风格（技术面/基本面/链上数据/情绪驱动）
  2. 时间偏好（短线<24h / 中期1-2w / 长期>1m）
  3. 风险偏好（保守/中等/激进）
  4. 偏好赛道（DeFi/L1/L2/Meme/AI/RWA 等）
  5. 偏好链（Ethereum/Solana/Base 等）
  6. 判断质量（观点是否有链上数据支撑、论证是否严谨）
  7. 弱点（容易在什么情况下判断失误）

  用中文回答。严格返回 JSON。
```

### 5.4 模式挖掘

```typescript
interface TradingPattern {
  pattern_id: string;
  name: string;                    // "TVL暴增看空" / "TGE前24h抄底"
  description: string;
  trigger_conditions: string[];    // 触发条件
  typical_action: "buy" | "sell" | "wait";
  historical_occurrences: number;
  success_rate: number;
  avg_return_when_followed: number;
  supporting_tweet_ids: string[];
  confidence: number;
}
```

### 5.5 回测逻辑

```typescript
async function backtestSignal(signal: TradingSignal): Promise<BacktestResult> {
  // 1. 获取信号发出时的价格（调用 OnchainOS）
  const priceAtSignal = await onchainos.dexMarket.getHistoricalPrice(
    signal.token_address,
    signal.chain,
    signal.created_at
  );

  // 2. 根据 timeframe 获取后续价格
  const timeframes = {
    short: 24 * 3600,     // 24h
    medium: 7 * 86400,    // 7d
    long: 30 * 86400      // 30d
  };
  const endTime = signal.created_at + timeframes[signal.timeframe];
  const priceAtEnd = await onchainos.dexMarket.getHistoricalPrice(
    signal.token_address,
    signal.chain,
    endTime
  );

  // 3. 计算结果
  const returnPct = (priceAtEnd - priceAtSignal) / priceAtSignal;
  const isWin = signal.sentiment === "bullish"
    ? returnPct > 0
    : returnPct < 0;

  return {
    signal_id: signal.id,
    price_at_signal: priceAtSignal,
    price_at_end: priceAtEnd,
    return_pct: returnPct,
    outcome: isWin ? "win" : "loss",
    timeframe_used: signal.timeframe
  };
}
```

---

## 6. Forge 层：锻造

把蒸馏出的知识打包成标准的 KOL Skill 文件。

### 6.1 生成流程

```
Distill 输出的结构化知识
  │
  ├── profile.json        ← 直接从 profile-builder 输出
  ├── knowledge.json      ← 从 knowledge-builder + pattern-miner 输出
  ├── signals-history.json← 从 backtester 输出
  ├── style-guide.json    ← LLM 总结该 KOL 的分析风格
  │
  └── SKILL.md            ← 关键！用模板 + LLM 生成自然语言描述
                             这是 AI Agent 实际读取的入口
```

### 6.2 SKILL.md 生成策略

SKILL.md 的质量直接决定 AI Agent 能否有效利用这个 KOL Skill。生成策略：

```typescript
async function generateSkillMd(
  profile: KOLProfile,
  knowledge: KOLKnowledge,
  signals: SignalHistory
): Promise<string> {
  const prompt = `
    你是一个 AI Skill 文档专家。
    给定以下 KOL 的画像、知识图谱和历史信号数据，
    生成一个标准的 SKILL.md 文档。

    这个文档将被 AI Agent（如 Claude Code）读取，
    用于在做交易分析时参考该 KOL 的观点和判断模式。

    文档必须包含：
    1. YAML frontmatter（name, description, 关键指标）
    2. 何时调用此 Skill（明确的触发条件）
    3. KOL 画像摘要
    4. 高/中/低置信度的判断模式
    5. 当前活跃观点
    6. 与 OnchainOS 数据结合使用的指引
    7. 该 KOL 的局限性和弱点

    用中文撰写。语气专业但易读。
  `;

  return await llm.generate(prompt, { profile, knowledge, signals });
}
```

### 6.3 增量更新

KOL Skill 不是一次生成后就不变的，它需要**持续进化**：

```typescript
interface SkillUpdatePolicy {
  // 触发全量重建的条件
  full_rebuild_triggers: [
    "新推文数量超过上次构建时的 30%",
    "最近 7 天胜率与历史胜率偏差 > 15%",
    "KOL 明确表示交易风格/策略重大转变",
    "手动触发"
  ];

  // 触发增量更新的条件
  incremental_update_triggers: [
    "新的交易信号被提取",
    "历史信号有新的回测结果",
    "KOL 对某 token 态度发生变化"
  ];

  // 更新频率
  schedule: {
    incremental: "每次采集新推文后",
    full_rebuild: "每周一次 or 触发条件满足时"
  };
}
```

---

## 7. Consult 层：咨询（核心调用逻辑）

这是 AI Agent 实际使用 CopyAlpha 的入口。

### 7.1 能力清单

| 函数 | 说明 |
|------|------|
| `consult.analyze(token, question?)` | 综合分析某 token（核心入口） |
| `consult.askKOL(username, question)` | 向特定 KOL Skill 提问 |
| `consult.consensus(token)` | 获取所有 KOL 对某 token 的共识/分歧 |
| `consult.recommend()` | 基于所有 KOL Skill + 持仓，推荐最佳机会 |
| `consult.critique(trade_idea)` | 让 KOL Skills 评价一个交易想法 |

### 7.2 `consult.analyze` 完整流程

```typescript
async function analyze(
  token: string,
  question?: string
): Promise<AnalysisReport> {

  // ═══ Step 1: 加载相关 KOL Skills ═══
  const relevantKOLs = await skillLoader.findRelevant(token);
  // 匹配逻辑：
  // - KOL 的 preferred_sectors 包含该 token 所属赛道
  // - KOL 的 knowledge.token_opinions 中提到过该 token
  // - KOL 的 preferred_chains 包含该 token 所在链

  // ═══ Step 2: 从每个 KOL Skill 获取观点 ═══
  const kolOpinions = [];
  for (const kol of relevantKOLs) {
    const opinion = extractOpinion(kol, token);
    // opinion = {
    //   username, stance, confidence, reasoning,
    //   relevant_patterns, historical_accuracy_on_sector
    // }
    kolOpinions.push(opinion);
  }

  // ═══ Step 3: 调用 OnchainOS 获取链上真相 ═══
  const onchainData = {
    // 当前行情
    market: await onchainos.dexMarket.getPrice(token),
    volume: await onchainos.dexMarket.get24hVolume(token),
    kline: await onchainos.dexMarket.getKline(token, "1d", 30),

    // Token 基本面
    tokenInfo: await onchainos.dexToken.getMetadata(token),
    holders: await onchainos.dexToken.getHolderAnalysis(token),
    smartMoney: await onchainos.dexMarket.getSmartMoneyFlow(token),

    // 我的持仓
    portfolio: await onchainos.walletPortfolio.getBalance(),
    existingPosition: await onchainos.walletPortfolio.getPosition(token),
  };

  // ═══ Step 4: LLM 综合分析 ═══
  const report = await llm.analyze({
    prompt: `
      你是一个加密货币交易分析师。
      综合以下信息，给出对 ${token} 的交易建议。

      ## KOL 专家观点
      ${JSON.stringify(kolOpinions)}

      ## 链上数据（来自 OKX OnchainOS）
      ${JSON.stringify(onchainData)}

      ## 用户提问
      ${question || "这个 token 现在值得买吗？"}

      要求：
      1. 先列出支持买入的 KOL 及其理由
      2. 再列出反对买入的 KOL 及其理由
      3. 用链上数据验证 KOL 的判断是否靠谱
      4. 给出综合建议（买/卖/观望）和置信度
      5. 如果建议买入，给出建议仓位大小（基于当前持仓）
    `,
  });

  return report;
}
```

### 7.3 输出报告格式

```typescript
interface AnalysisReport {
  token: string;
  chain: string;
  timestamp: string;

  // 综合结论
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;  // 0-1
  reasoning: string;

  // KOL 观点汇总
  kol_consensus: {
    bullish: { username: string; confidence: number; key_argument: string }[];
    bearish: { username: string; confidence: number; key_argument: string }[];
    neutral: { username: string; confidence: number; key_argument: string }[];
    agreement_ratio: number;  // 0-1，KOL 之间的一致性
  };

  // 链上验证
  onchain_validation: {
    price_trend: "up" | "down" | "sideways";
    volume_trend: "increasing" | "decreasing" | "stable";
    smart_money_direction: "accumulating" | "distributing" | "neutral";
    holder_concentration_risk: "low" | "medium" | "high";
    kol_vs_onchain_alignment: number;  // KOL 观点与链上数据一致性
  };

  // 交易建议（如果 recommendation 是 buy/sell）
  trade_suggestion?: {
    action: "buy" | "sell";
    suggested_size_usd: number;
    suggested_size_pct: number;   // 占总持仓百分比
    entry_price: number;
    target_price: number;
    stop_loss: number;
    risk_reward_ratio: number;
  };

  // 来源追溯
  sources: {
    kol_skills_used: string[];     // 用了哪些 KOL Skill
    onchainos_apis_called: string[]; // 调了哪些 OnchainOS API
    total_tweets_referenced: number;
  };
}
```

---

## 8. 与 OnchainOS Skills 的集成

CopyAlpha 不是替代 OnchainOS，而是**作为它的上游消费者**。

### 8.1 调用关系

```
CopyAlpha                          OnchainOS Skills
─────────                          ──────────────
consult.analyze()
  ├── 加载 KOL Skills（本地）
  │
  ├── 调用 ──────────────────────→  okx-wallet-portfolio
  │   "查看我的持仓"                 → 返回 balance + positions
  │
  ├── 调用 ──────────────────────→  okx-dex-market
  │   "获取实时价格/K线/SmartMoney"   → 返回 market data
  │
  ├── 调用 ──────────────────────→  okx-dex-token
  │   "查 token 信息/持仓分布"       → 返回 token analytics
  │
  └── 综合 KOL 观点 + 链上数据
      输出分析报告

用户确认后:
  trade-executor
  ├── 调用 ──────────────────────→  okx-dex-swap
  │   "执行最优路径 swap"            → 返回 tx data
  │
  └── 调用 ──────────────────────→  okx-onchain-gateway
      "广播交易 + 跟踪状态"          → 返回 tx status
```

### 8.2 OnchainOS Bridge 实现

```typescript
// shared/onchainos-bridge.ts
import { readSkill } from '../utils/skill-loader';

class OnchainOSBridge {
  // CopyAlpha 通过标准 Skill 调用方式使用 OnchainOS
  // 不直接调 API，而是让 AI Agent 编排调用

  async getPortfolio(walletAddress: string) {
    return this.callSkill('okx-wallet-portfolio', {
      action: 'get_total_value',
      wallet: walletAddress
    });
  }

  async getMarketData(tokenAddress: string, chain: string) {
    return this.callSkill('okx-dex-market', {
      action: 'get_price',
      token: tokenAddress,
      chain: chain
    });
  }

  async getTokenAnalysis(tokenAddress: string, chain: string) {
    return this.callSkill('okx-dex-token', {
      action: 'get_holder_analysis',
      token: tokenAddress,
      chain: chain
    });
  }

  async executeSwap(params: SwapParams) {
    return this.callSkill('okx-dex-swap', {
      action: 'swap',
      ...params
    });
  }
}
```

---

## 9. CLAUDE.md 内容

```markdown
# CopyAlpha — 抄作业大师 🎓

> 把 KOL 变成你的私人 Skill，让 AI 替你抄最聪明的作业

## 这是什么

CopyAlpha 把推特 KOL 的历史推文提炼成可调用的 AI Skill。
当你需要做交易分析时，AI 会"请教"这些 KOL Skill，
再结合 OnchainOS 的链上数据，给你综合建议。

## 依赖

CopyAlpha 需要同时安装 OKX OnchainOS Skills:
  npx skills add okx/onchainos-skills

## 环境变量

  TWITTER_BEARER_TOKEN=your-token
  OKX_API_KEY=your-key
  OKX_SECRET_KEY=your-secret
  OKX_PASSPHRASE=your-passphrase
  WALLET_ADDRESS=your-wallet-address
  LLM_API_KEY=your-llm-key
  LLM_MODEL=claude-sonnet-4-20250514

## 核心命令

### 添加 KOL（开始抄他的作业）
  copyalpha harvest add @inversebrah
  copyalpha harvest add @DefiIgnas
  copyalpha harvest add @0xSisyphus

### 生成 KOL Skill（把作业提炼成知识）
  copyalpha forge @inversebrah
  copyalpha forge --all

### 分析某 token（综合请教所有 KOL + 链上数据）
  copyalpha consult analyze $PEPE
  copyalpha consult analyze $ETH "现在适合加仓吗？"

### 查看 KOL 共识（大家怎么看）
  copyalpha consult consensus $SOL

### 让 KOL 评价你的想法
  copyalpha consult critique "打算用 5% 仓位做多 $ARB"

### 查看 KOL 龙虎榜
  copyalpha consult leaderboard

## 工作原理

1. Harvest（采集）: 抓取 KOL 推文
2. Distill（蒸馏）: LLM 提炼交易知识
3. Forge（锻造）: 打包为标准 KOL Skill
4. Consult（咨询）: 分析时调用 KOL Skill + OnchainOS

## 注意事项

- KOL 的观点仅供参考，最终决策以链上数据为准
- 生成的 KOL Skill 会持续随新推文更新
- 所有交易操作需要用户确认
- 这不是投资建议
```

---

## 10. 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 运行时 | Node.js + TypeScript | 与 onchainos-skills 一致 |
| 推特抓取 | twitter-api-v2 + cheerio | API 优先，爬虫兜底 |
| 存储 | SQLite (better-sqlite3) | 零配置，单文件，本地 Agent 友好 |
| LLM | Anthropic API (Claude Sonnet) | 信号提取 & 知识蒸馏 |
| 链上数据 | OKX OnchainOS Skills | DEX 聚合、钱包、市场数据 |
| 模板引擎 | Handlebars | SKILL.md 生成 |
| 定时任务 | node-cron | 轻量级轮询 |

---

## 11. Milestone

### Phase 1: 能抄作业（Week 1-2）

- [ ] 项目脚手架 + TypeScript 配置
- [ ] Harvest 层实现（Twitter API + Nitter 降级）
- [ ] Distill 层 — 信号提取 pipeline
- [ ] 基础 SQLite 存储
- [ ] 能跑通：输入 KOL username → 输出结构化信号列表

### Phase 2: 能出 Skill（Week 3-4）

- [ ] Distill 层 — 画像构建 + 模式挖掘
- [ ] Distill 层 — 回测（调用 OnchainOS 获取历史价格）
- [ ] Forge 层 — SKILL.md 生成器
- [ ] Forge 层 — 增量更新
- [ ] 能跑通：输入 KOL username → 输出完整 KOL Skill 目录

### Phase 3: 能问 Skill（Week 5-6）

- [ ] Consult 层 — Skill 加载 & 多 KOL 交叉引用
- [ ] Consult 层 — OnchainOS Bridge 集成
- [ ] Consult 层 — 综合分析报告生成
- [ ] CLAUDE.md / AGENTS.md 完善
- [ ] 能跑通：`consult analyze $PEPE` → 输出含 KOL 观点 + 链上验证的报告

### Phase 4: 能用好（Week 7-8）

- [ ] 增量监控 + 自动 Skill 更新
- [ ] KOL 龙虎榜 & 绩效追踪
- [ ] 安全策略（交易确认 & 熔断）
- [ ] install.sh + 多平台兼容
- [ ] 文档 & 使用示例 & 开源准备

---

## 12. 风险与缓解

| 风险 | 缓解 |
|------|------|
| Twitter API 限流 | 三级降级（API → Nitter → Browser） |
| LLM 蒸馏质量差 | 多轮提炼 + 人工抽检 + 回测验证 |
| KOL 被收买发假信号 | credibility.shill_risk 评估 + 链上数据交叉验证 |
| 生成的 Skill 过时 | 增量更新策略 + 全量定期重建 |
| OnchainOS API 不可用 | 降级为纯 KOL 观点分析（标注缺少链上验证） |
| 多 KOL 观点冲突 | 加权平均（按胜率 + 可信度）+ 明确展示分歧 |

---

*CopyAlpha — 聪明人不自己做作业，聪明人把最聪明的人变成自己的 Skill。*
