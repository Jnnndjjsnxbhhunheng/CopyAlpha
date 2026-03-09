/**
 * Core consultation engine: synthesize KOL opinions + on-chain data.
 *
 * Deps: shared/llm, consult/skill-loader, consult/cross-reference,
 *       consult/onchainos-bridge, types
 * Input: token, optional question
 * Output: AnalysisReport
 */

import { generateJSON } from "../shared/llm";
import { findRelevantSkills, loadAllSkills } from "./skill-loader";
import { crossReference, type ConsensusResult } from "./cross-reference";
import {
  fetchOnchainData,
  isOnchainOSAvailable,
  type OnchainData,
} from "./onchainos-bridge";
import type { AnalysisReport, Recommendation } from "../types";

const ANALYSIS_SYSTEM_PROMPT = `你是一个加密货币交易分析师。
综合 KOL 专家观点和链上数据，给出交易建议。

要求：
1. 先列出支持买入的 KOL 及其理由
2. 再列出反对买入的 KOL 及其理由
3. 用链上数据验证 KOL 的判断是否靠谱
4. 给出综合建议（strong_buy/buy/hold/sell/strong_sell）和置信度
5. 如果建议买入/卖出，给出交易建议（仓位、入场价、目标价、止损）

严格返回 JSON 格式：
{
  "recommendation": "strong_buy | buy | hold | sell | strong_sell",
  "confidence": 0-1,
  "reasoning": "综合分析理由",
  "onchain_validation": {
    "price_trend": "up | down | sideways",
    "volume_trend": "increasing | decreasing | stable",
    "smart_money_direction": "accumulating | distributing | neutral",
    "holder_concentration_risk": "low | medium | high",
    "kol_vs_onchain_alignment": 0-1
  },
  "trade_suggestion": {
    "action": "buy | sell",
    "suggested_size_pct": number,
    "entry_price": number,
    "target_price": number,
    "stop_loss": number,
    "risk_reward_ratio": number
  } | null
}`;

/**
 * Main analysis entry point.
 */
export async function analyze(
  token: string,
  question?: string
): Promise<AnalysisReport> {
  const symbol = token.replace(/^\$/, "").toUpperCase();
  console.log(`[Consult] Analyzing $${symbol}...`);

  // Step 1: Find relevant KOL Skills
  const skills = findRelevantSkills(symbol);
  console.log(`[Consult] Found ${skills.length} relevant KOL Skills`);

  // Step 2: Cross-reference KOL opinions
  const consensus = crossReference(symbol, skills);
  console.log(
    `[Consult] Consensus: ${consensus.bullish.length} bullish, ` +
      `${consensus.bearish.length} bearish, ${consensus.neutral.length} neutral`
  );

  // Step 3: Fetch on-chain data (graceful degradation)
  let onchain: OnchainData | null = null;
  if (isOnchainOSAvailable()) {
    try {
      onchain = await fetchOnchainData(symbol);
      console.log(`[Consult] On-chain data fetched`);
    } catch (err) {
      console.warn(
        `[Consult] On-chain data unavailable: ${(err as Error).message}`
      );
    }
  } else {
    console.log(`[Consult] Skipping on-chain data (OKX not configured)`);
  }

  // Step 4: LLM synthesis
  const report = await synthesize(
    symbol,
    consensus,
    onchain,
    question
  );

  return report;
}

/**
 * Query a specific KOL's opinion on a topic.
 */
export async function askKOL(
  username: string,
  question: string
): Promise<string> {
  const skills = loadAllSkills();
  const skill = skills.find(
    (s) => s.username === username.replace(/^@/, "").toLowerCase()
  );

  if (!skill) {
    return `KOL Skill for @${username} not found. Run: copyalpha forge build ${username}`;
  }

  const response = await generateJSON<{ answer: string }>({
    system: `你是 @${username} 的交易风格模拟器。
基于以下画像和知识，以该 KOL 的视角回答问题。

画像: ${JSON.stringify(skill.profile.trading_style)}
知识: ${JSON.stringify(skill.knowledge.trading_thesis)}
Token 观点: ${JSON.stringify(skill.knowledge.token_opinions)}

以第一人称回答，模拟该 KOL 的分析风格。返回 JSON: {"answer": "..."}`,
    prompt: question,
    maxTokens: 2048,
  });

  return response.answer;
}

/**
 * Get consensus from all KOLs on a token.
 */
export async function consensus(
  token: string
): Promise<ConsensusResult> {
  const symbol = token.replace(/^\$/, "").toUpperCase();
  const skills = findRelevantSkills(symbol);

  if (skills.length === 0) {
    // Fallback: use all skills
    const all = loadAllSkills();
    return crossReference(symbol, all);
  }

  return crossReference(symbol, skills);
}

/**
 * Get KOL feedback on a trade idea.
 */
export async function critique(
  tradeIdea: string
): Promise<string> {
  const skills = loadAllSkills();

  if (skills.length === 0) {
    return "No KOL Skills available. Add KOLs first.";
  }

  const kolSummaries = skills
    .map(
      (s) =>
        `@${s.username}: ${s.profile.trading_style.approach}风格, ` +
        `胜率${Math.round(s.profile.performance.win_rate * 100)}%, ` +
        `偏好${s.profile.trading_style.preferred_sectors.join("/")}`
    )
    .join("\n");

  const response = await generateJSON<{ critiques: CritiqueItem[] }>({
    system: `你模拟多个 KOL 对一个交易想法的评价。

可用 KOL:
${kolSummaries}

对每个 KOL，给出他们可能的评价（基于其交易风格和偏好）。
返回 JSON: {"critiques": [{"username": "...", "verdict": "support|oppose|neutral", "reasoning": "..."}]}`,
    prompt: `交易想法: ${tradeIdea}`,
    maxTokens: 4096,
  });

  return response.critiques
    .map(
      (c) =>
        `@${c.username} [${c.verdict}]: ${c.reasoning}`
    )
    .join("\n\n");
}

interface CritiqueItem {
  username: string;
  verdict: "support" | "oppose" | "neutral";
  reasoning: string;
}

/**
 * Recommend best opportunities based on KOL Skills + portfolio.
 */
export async function recommend(): Promise<string> {
  const skills = loadAllSkills();

  if (skills.length === 0) {
    return "No KOL Skills available. Add KOLs first.";
  }

  // Collect all bullish token opinions across KOLs
  const opportunities: {
    symbol: string;
    supporters: string[];
    avgConfidence: number;
  }[] = [];

  const tokenMap = new Map<
    string,
    { supporters: string[]; totalConf: number }
  >();

  for (const skill of skills) {
    for (const [sym, op] of Object.entries(
      skill.knowledge.token_opinions
    )) {
      if (op.overall_stance !== "bullish") continue;

      if (!tokenMap.has(sym)) {
        tokenMap.set(sym, { supporters: [], totalConf: 0 });
      }
      const entry = tokenMap.get(sym)!;
      entry.supporters.push(skill.username);
      entry.totalConf += op.conviction_level;
    }
  }

  for (const [sym, data] of tokenMap) {
    opportunities.push({
      symbol: sym,
      supporters: data.supporters,
      avgConfidence: data.totalConf / data.supporters.length,
    });
  }

  opportunities.sort(
    (a, b) =>
      b.supporters.length * b.avgConfidence -
      a.supporters.length * a.avgConfidence
  );

  if (opportunities.length === 0) {
    return "No bullish opportunities found across KOL Skills.";
  }

  return opportunities
    .slice(0, 10)
    .map(
      (o, i) =>
        `${i + 1}. $${o.symbol} — ${o.supporters.length} KOL(s) bullish ` +
        `(avg confidence: ${Math.round(o.avgConfidence * 100)}%) ` +
        `[${o.supporters.map((s) => "@" + s).join(", ")}]`
    )
    .join("\n");
}

/**
 * Get KOL leaderboard by performance.
 */
export function leaderboard(): string {
  const skills = loadAllSkills();

  if (skills.length === 0) {
    return "No KOL Skills available.";
  }

  const ranked = skills
    .map((s) => ({
      username: s.username,
      winRate: s.profile.performance.win_rate,
      signals: s.profile.performance.total_signals,
      credibility: s.profile.credibility.score,
      sectors: s.profile.trading_style.preferred_sectors,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  const lines = [
    "KOL Leaderboard",
    "─".repeat(60),
    "Rank | KOL              | Win Rate | Signals | Credibility",
    "─".repeat(60),
  ];

  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    lines.push(
      `#${i + 1}   | @${r.username.padEnd(15)} | ` +
        `${(r.winRate * 100).toFixed(1)}%    | ` +
        `${String(r.signals).padEnd(7)} | ${r.credibility}/100`
    );
  }

  return lines.join("\n");
}

// ─── Private: LLM Synthesis ───

async function synthesize(
  symbol: string,
  consensus: ConsensusResult,
  onchain: OnchainData | null,
  question?: string
): Promise<AnalysisReport> {
  const prompt = buildAnalysisPrompt(
    symbol,
    consensus,
    onchain,
    question
  );

  const llmResult = await generateJSON<LLMAnalysisResult>({
    system: ANALYSIS_SYSTEM_PROMPT,
    prompt,
    maxTokens: 4096,
  });

  return {
    token: symbol,
    chain: onchain?.tokenInfo?.chain ?? "unknown",
    timestamp: new Date().toISOString(),

    recommendation: llmResult.recommendation,
    confidence: llmResult.confidence,
    reasoning: llmResult.reasoning,

    kol_consensus: {
      bullish: consensus.bullish,
      bearish: consensus.bearish,
      neutral: consensus.neutral,
      agreement_ratio: consensus.agreement_ratio,
    },

    onchain_validation: llmResult.onchain_validation ?? {
      price_trend: "sideways",
      volume_trend: "stable",
      smart_money_direction: "neutral",
      holder_concentration_risk: "medium",
      kol_vs_onchain_alignment: 0.5,
    },

    trade_suggestion: llmResult.trade_suggestion
      ? {
          action: llmResult.trade_suggestion.action,
          suggested_size_usd: 0,
          suggested_size_pct: llmResult.trade_suggestion.suggested_size_pct,
          entry_price: llmResult.trade_suggestion.entry_price,
          target_price: llmResult.trade_suggestion.target_price,
          stop_loss: llmResult.trade_suggestion.stop_loss,
          risk_reward_ratio: llmResult.trade_suggestion.risk_reward_ratio,
        }
      : undefined,

    sources: {
      kol_skills_used: [
        ...consensus.bullish,
        ...consensus.bearish,
        ...consensus.neutral,
      ].map((k) => k.username),
      onchainos_apis_called: onchain
        ? [
            "okx-dex-market",
            "okx-dex-token",
            "okx-wallet-portfolio",
          ]
        : [],
      total_tweets_referenced: 0,
    },
  };
}

function buildAnalysisPrompt(
  symbol: string,
  consensus: ConsensusResult,
  onchain: OnchainData | null,
  question?: string
): string {
  const parts: string[] = [];

  parts.push(`## 分析目标: $${symbol}`);
  parts.push(`## 用户提问: ${question ?? "这个 token 现在值得买吗？"}`);

  parts.push(`\n## KOL 专家观点`);

  if (consensus.bullish.length > 0) {
    parts.push("### 看多:");
    for (const k of consensus.bullish) {
      parts.push(
        `- @${k.username} (confidence: ${k.confidence}): ${k.key_argument}`
      );
    }
  }

  if (consensus.bearish.length > 0) {
    parts.push("### 看空:");
    for (const k of consensus.bearish) {
      parts.push(
        `- @${k.username} (confidence: ${k.confidence}): ${k.key_argument}`
      );
    }
  }

  if (consensus.neutral.length > 0) {
    parts.push("### 中性:");
    for (const k of consensus.neutral) {
      parts.push(
        `- @${k.username} (confidence: ${k.confidence}): ${k.key_argument}`
      );
    }
  }

  parts.push(`\n共识度: ${(consensus.agreement_ratio * 100).toFixed(0)}%`);
  parts.push(`主导观点: ${consensus.dominant_stance}`);

  if (onchain) {
    parts.push(`\n## 链上数据（来自 OKX OnchainOS）`);
    if (onchain.market) {
      parts.push(`价格: $${onchain.market.price}`);
      parts.push(`24h 涨跌: ${onchain.market.price_change_24h_pct}%`);
      parts.push(`24h 成交量: $${onchain.market.volume_24h}`);
    }
    if (onchain.holders) {
      parts.push(`Top10 持仓占比: ${onchain.holders.top10_pct}%`);
      parts.push(`集中度风险: ${onchain.holders.concentration_risk}`);
    }
    if (onchain.smartMoney) {
      parts.push(`Smart Money: ${onchain.smartMoney.direction}`);
    }
    if (onchain.existingPosition) {
      parts.push(
        `当前持仓: ${onchain.existingPosition.balance} ($${onchain.existingPosition.value_usd})`
      );
    }
  } else {
    parts.push(`\n## 链上数据: 不可用（降级为纯 KOL 观点分析）`);
  }

  return parts.join("\n");
}

interface LLMAnalysisResult {
  recommendation: Recommendation;
  confidence: number;
  reasoning: string;
  onchain_validation?: AnalysisReport["onchain_validation"];
  trade_suggestion?: {
    action: "buy" | "sell";
    suggested_size_pct: number;
    entry_price: number;
    target_price: number;
    stop_loss: number;
    risk_reward_ratio: number;
  } | null;
}
