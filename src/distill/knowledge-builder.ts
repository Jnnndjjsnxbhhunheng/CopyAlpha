/**
 * Build KOL knowledge graph from signals and tweets.
 *
 * Deps: shared/llm, storage/db, types
 * Input: username (with signals in DB)
 * Output: KOLKnowledge
 */

import { generateJSON } from "../shared/llm";
import { getSignalsByAuthor, getTweetsByAuthor } from "../storage/db";
import type { KOLKnowledge, TradingSignal, TokenOpinion } from "../types";

const NARRATIVE_PROMPT = `你是一个加密货币市场分析师。
根据以下 KOL 的交易信号和推文，提取他关注的市场叙事。

返回 JSON 格式：
{
  "narratives": [{
    "narrative": "叙事名称",
    "stance": "bullish | bearish | neutral",
    "confidence": 0-1,
    "first_mentioned": "ISO date",
    "mention_count": number,
    "sample_reasoning": "KOL 原始逻辑的提炼总结"
  }],
  "macro_views": {
    "market_cycle_view": "对当前周期的判断",
    "btc_outlook": "BTC 看法",
    "eth_outlook": "ETH 看法",
    "sector_rankings": [{ "sector": "string", "rank": number, "reasoning": "string" }],
    "risk_factors": ["string"]
  }
}`;

export async function buildKnowledge(
  username: string
): Promise<KOLKnowledge> {
  const signals = getSignalsByAuthor(username, 200);
  const tweets = getTweetsByAuthor(username, 200);

  const tokenOpinions = aggregateTokenOpinions(signals);

  const narrativeAnalysis = await analyzeNarratives(
    username,
    signals,
    tweets
  );

  return {
    trading_thesis: {
      current_narratives: narrativeAnalysis.narratives ?? [],
      recurring_patterns: [],
    },
    token_opinions: tokenOpinions,
    macro_views: narrativeAnalysis.macro_views ?? {
      market_cycle_view: "",
      btc_outlook: "",
      eth_outlook: "",
      sector_rankings: [],
      risk_factors: [],
      last_updated: new Date().toISOString(),
    },
    kol_network: {
      frequently_agrees_with: [],
      frequently_disagrees_with: [],
      often_quotes: [],
      influence_score: 0,
    },
  };
}

function aggregateTokenOpinions(
  signals: TradingSignal[]
): Record<string, TokenOpinion> {
  const opinions: Record<string, TokenOpinion> = {};

  for (const signal of signals) {
    for (const token of signal.tokens) {
      const sym = token.symbol.toUpperCase();
      if (!opinions[sym]) {
        opinions[sym] = {
          overall_stance: token.sentiment,
          conviction_level: signal.confidence,
          price_targets: [],
          key_arguments: [],
          last_mentioned: signal.created_at,
          mention_frequency: "rare",
          consistency: 1,
        };
      } else {
        const op = opinions[sym];
        // Update with latest data
        op.last_mentioned = signal.created_at;
        op.conviction_level = Math.max(
          op.conviction_level,
          signal.confidence
        );

        if (signal.reasoning && !op.key_arguments.includes(signal.reasoning)) {
          op.key_arguments.push(signal.reasoning);
        }

        if (token.price_target) {
          op.price_targets.push({
            price: token.price_target,
            date: signal.created_at,
            hit: false,
          });
        }
      }
    }
  }

  // Compute mention frequency
  for (const [sym, op] of Object.entries(opinions)) {
    const mentions = signals.filter((s) =>
      s.tokens.some((t) => t.symbol.toUpperCase() === sym)
    ).length;

    op.mention_frequency =
      mentions >= 10 ? "frequent" : mentions >= 3 ? "occasional" : "rare";
  }

  return opinions;
}

interface NarrativeAnalysis {
  narratives: KOLKnowledge["trading_thesis"]["current_narratives"];
  macro_views: KOLKnowledge["macro_views"];
}

async function analyzeNarratives(
  username: string,
  signals: TradingSignal[],
  tweets: any[]
): Promise<NarrativeAnalysis> {
  if (signals.length === 0) {
    return {
      narratives: [],
      macro_views: {
        market_cycle_view: "",
        btc_outlook: "",
        eth_outlook: "",
        sector_rankings: [],
        risk_factors: [],
        last_updated: new Date().toISOString(),
      },
    };
  }

  const signalSummary = signals
    .slice(0, 50)
    .map(
      (s) =>
        `[${s.created_at}] ${s.tokens.map((t) => `${t.symbol}(${t.sentiment})`).join(",")} - ${s.reasoning}`
    )
    .join("\n");

  const tweetSample = tweets
    .slice(0, 30)
    .map((t: any) => `[${t.created_at}] ${t.text}`)
    .join("\n---\n");

  return generateJSON<NarrativeAnalysis>({
    system: NARRATIVE_PROMPT,
    prompt: `KOL: @${username}\n\n## 信号列表\n${signalSummary}\n\n## 推文样本\n${tweetSample}`,
    maxTokens: 4096,
  });
}
