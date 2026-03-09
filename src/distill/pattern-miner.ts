/**
 * Mine recurring trading patterns from KOL signals.
 *
 * Deps: shared/llm, storage/db, types
 * Input: username (with signals in DB)
 * Output: TradingPattern[]
 */

import { generateJSON } from "../shared/llm";
import { getSignalsByAuthor } from "../storage/db";
import type { TradingPattern, TradingSignal } from "../types";
import crypto from "crypto";

const SYSTEM_PROMPT = `你是一个交易模式识别专家。
根据以下 KOL 的历史交易信号，发现重复出现的交易模式。

一个模式是指：该 KOL 在类似情况下反复做出类似判断的行为。

返回 JSON 格式：
{
  "patterns": [{
    "name": "模式名称（简短描述）",
    "description": "详细描述",
    "trigger_conditions": ["触发条件1", "触发条件2"],
    "typical_action": "buy | sell | wait",
    "historical_occurrences": number,
    "success_rate": 0-1,
    "avg_return_when_followed": number (百分比),
    "confidence": 0-1
  }]
}`;

export async function minePatterns(
  username: string
): Promise<TradingPattern[]> {
  const signals = getSignalsByAuthor(username, 200);

  if (signals.length < 5) {
    return [];
  }

  const signalDescriptions = signals
    .map(
      (s) =>
        `[${s.created_at}] ${s.tokens.map((t) => `${t.symbol}(${t.sentiment}, conf:${s.confidence})`).join(",")} | ${s.reasoning}`
    )
    .join("\n");

  const result = await generateJSON<{ patterns: PatternRaw[] }>({
    system: SYSTEM_PROMPT,
    prompt: `KOL: @${username}\n\n## 历史信号 (${signals.length} 条)\n${signalDescriptions}`,
    maxTokens: 4096,
  });

  return (result.patterns ?? []).map((p) =>
    toTradingPattern(p, signals)
  );
}

interface PatternRaw {
  name: string;
  description: string;
  trigger_conditions: string[];
  typical_action: "buy" | "sell" | "wait";
  historical_occurrences: number;
  success_rate: number;
  avg_return_when_followed: number;
  confidence: number;
}

function toTradingPattern(
  raw: PatternRaw,
  signals: TradingSignal[]
): TradingPattern {
  const id = crypto
    .createHash("sha256")
    .update(raw.name)
    .digest("hex")
    .slice(0, 12);

  return {
    pattern_id: `pat-${id}`,
    name: raw.name,
    description: raw.description,
    trigger_conditions: raw.trigger_conditions,
    typical_action: raw.typical_action,
    historical_occurrences: raw.historical_occurrences,
    success_rate: raw.success_rate,
    avg_return_when_followed: raw.avg_return_when_followed,
    supporting_tweet_ids: signals
      .slice(0, raw.historical_occurrences)
      .map((s) => s.tweet_id),
    confidence: raw.confidence,
  };
}
