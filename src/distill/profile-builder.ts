/**
 * Build KOL trading profile from accumulated signals and tweets.
 *
 * Deps: shared/llm, storage/db, types
 * Input: username (with tweets and signals in DB)
 * Output: KOLProfile
 */

import { generateJSON } from "../shared/llm";
import { getTweetsByAuthor, getSignalsByAuthor } from "../storage/db";
import type { KOLProfile, RawTweet, TradingSignal } from "../types";

const SYSTEM_PROMPT = `你是一个交易员分析专家。给定一个推特用户最近的交易相关推文和提取出的信号，
总结此人的交易画像。

分析维度：
1. 交易风格（technical/fundamental/onchain/sentiment/mixed）
2. 时间偏好（scalp<24h / swing 1-2w / position >1m / mixed）
3. 风险偏好（conservative/moderate/aggressive）
4. 偏好赛道（defi/l1/l2/meme/ai/rwa 等）
5. 偏好链（ethereum/solana/base 等）
6. 平均持仓周期（天数）
7. 单笔最大仓位百分比
8. 弱点（容易在什么情况下判断失误）

严格返回 JSON，格式：
{
  "approach": "technical | fundamental | onchain | sentiment | mixed",
  "timeframe": "scalp | swing | position | mixed",
  "risk_appetite": "conservative | moderate | aggressive",
  "preferred_sectors": ["string"],
  "preferred_chains": ["string"],
  "avg_holding_period_days": number,
  "max_position_size_pct": number,
  "weaknesses": ["string"]
}`;

export async function buildProfile(
  username: string
): Promise<KOLProfile> {
  const tweets = getTweetsByAuthor(username, 200);
  const signals = getSignalsByAuthor(username, 200);

  const tradingTweets = tweets.filter(
    (t) => signals.some((s) => s.tweet_id === t.tweet_id)
  );

  const styleAnalysis = await analyzeStyle(
    username,
    tradingTweets,
    signals
  );
  const performance = computePerformance(signals);

  return {
    username,
    display_name: username,
    bio: "",
    followers_count: 0,
    following_count: 0,
    account_created: "",

    trading_style: {
      approach: styleAnalysis.approach,
      timeframe: styleAnalysis.timeframe,
      risk_appetite: styleAnalysis.risk_appetite,
      preferred_sectors: styleAnalysis.preferred_sectors,
      preferred_chains: styleAnalysis.preferred_chains,
      avg_holding_period_days: styleAnalysis.avg_holding_period_days,
      max_position_size_pct: styleAnalysis.max_position_size_pct,
    },

    performance,

    credibility: {
      score: 50,
      transparency: 50,
      skin_in_game: 50,
      shill_risk: 50,
      echo_chamber: 50,
      contrarian_value: 50,
    },

    last_scraped: new Date().toISOString(),
    tweet_count_scraped: tweets.length,
    skill_version: "1.0.0",
    generated_by: "copyalpha@v2.0",
  };
}

interface StyleAnalysis {
  approach: KOLProfile["trading_style"]["approach"];
  timeframe: KOLProfile["trading_style"]["timeframe"];
  risk_appetite: KOLProfile["trading_style"]["risk_appetite"];
  preferred_sectors: string[];
  preferred_chains: string[];
  avg_holding_period_days: number;
  max_position_size_pct: number;
  weaknesses: string[];
}

async function analyzeStyle(
  username: string,
  tweets: RawTweet[],
  signals: TradingSignal[]
): Promise<StyleAnalysis> {
  if (tweets.length === 0) {
    return defaultStyle();
  }

  const sampleTweets = tweets
    .slice(0, 50)
    .map((t) => `[${t.created_at}] ${t.text}`)
    .join("\n---\n");

  const signalSummary = signals
    .slice(0, 30)
    .map(
      (s) =>
        `${s.tokens.map((t) => t.symbol).join(",")} | ${s.tokens[0]?.sentiment} | conf:${s.confidence}`
    )
    .join("\n");

  return generateJSON<StyleAnalysis>({
    system: SYSTEM_PROMPT,
    prompt: `KOL: @${username}\n\n## 交易相关推文样本\n${sampleTweets}\n\n## 提取信号摘要\n${signalSummary}`,
    maxTokens: 2048,
  });
}

function defaultStyle(): StyleAnalysis {
  return {
    approach: "mixed",
    timeframe: "mixed",
    risk_appetite: "moderate",
    preferred_sectors: [],
    preferred_chains: [],
    avg_holding_period_days: 7,
    max_position_size_pct: 5,
    weaknesses: [],
  };
}

function computePerformance(
  signals: TradingSignal[]
): KOLProfile["performance"] {
  return {
    total_signals: signals.length,
    evaluated_signals: 0,
    win_rate: 0,
    avg_return_pct: 0,
    best_call: { token: "", return_pct: 0, date: "" },
    worst_call: { token: "", return_pct: 0, date: "" },
    sharpe_ratio: 0,
    max_drawdown_pct: 0,
    active_since: signals[signals.length - 1]?.created_at ?? "",
    peak_performance_market: "sideways",
  };
}
