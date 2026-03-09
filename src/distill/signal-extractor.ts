/**
 * Extract trading signals from tweets using LLM.
 *
 * Deps: shared/llm, types
 * Input: RawTweet[]
 * Output: TradingSignal[]
 */

import { generateJSON } from "../shared/llm";
import { insertSignal } from "../storage/db";
import type {
  RawTweet,
  TradingSignal,
  SignalExtractionResult,
} from "../types";
import crypto from "crypto";

const SYSTEM_PROMPT = `你是一个加密货币交易信号分析专家。
你的任务是从推特帖子中提取交易相关信息，忽略所有非交易内容。

对每条推文，判断：
1. 是否包含交易信号（明确的买/卖/看多/看空表态）
2. 如果是，提取具体信息
3. 如果不是交易相关内容，返回 is_signal: false

严格返回 JSON，无多余内容。

返回格式：
{
  "is_signal": boolean,
  "signal": {
    "tokens": [{
      "symbol": "string",
      "chain": "string or null",
      "sentiment": "bullish | bearish | neutral",
      "price_target": number or null,
      "stop_loss": number or null,
      "timeframe": "short | medium | long"
    }],
    "confidence": number (0-1),
    "reasoning": "string"
  } | null,
  "topic_tags": ["string"]
}`;

/**
 * Extract signals from a batch of tweets.
 * Processes in chunks to stay within token limits.
 */
export async function extractSignals(
  tweets: RawTweet[]
): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];
  const chunkSize = 10;

  for (let i = 0; i < tweets.length; i += chunkSize) {
    const chunk = tweets.slice(i, i + chunkSize);
    const chunkSignals = await extractChunk(chunk);
    signals.push(...chunkSignals);
  }

  return signals;
}

async function extractChunk(
  tweets: RawTweet[]
): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = [];

  for (const tweet of tweets) {
    try {
      const result = await extractSingleTweet(tweet);
      if (result) {
        signals.push(result);
      }
    } catch (err) {
      console.error(
        `[Distill] Signal extraction failed for tweet ${tweet.tweet_id}:`,
        (err as Error).message
      );
    }
  }

  return signals;
}

async function extractSingleTweet(
  tweet: RawTweet
): Promise<TradingSignal | null> {
  // Skip very short tweets or obvious non-trading content
  if (tweet.text.length < 10) return null;

  const result = await generateJSON<SignalExtractionResult>({
    system: SYSTEM_PROMPT,
    prompt: buildTweetPrompt(tweet),
    maxTokens: 1024,
  });

  if (!result.is_signal || !result.signal) return null;

  const signal: TradingSignal = {
    id: generateSignalId(tweet.tweet_id),
    tweet_id: tweet.tweet_id,
    author_username: tweet.author_username,
    tokens: result.signal.tokens,
    confidence: result.signal.confidence,
    reasoning: result.signal.reasoning,
    topic_tags: result.topic_tags ?? [],
    created_at: tweet.created_at,
  };

  insertSignal(signal);
  return signal;
}

function buildTweetPrompt(tweet: RawTweet): string {
  const parts = [`Tweet from @${tweet.author_username}:`];
  parts.push(`"""${tweet.text}"""`);
  parts.push(`Date: ${tweet.created_at}`);

  if (tweet.context.cashtags.length > 0) {
    parts.push(`Cashtags: ${tweet.context.cashtags.join(", ")}`);
  }
  if (tweet.context.hashtags.length > 0) {
    parts.push(`Hashtags: ${tweet.context.hashtags.join(", ")}`);
  }
  if (tweet.metrics.likes > 100) {
    parts.push(
      `Engagement: ${tweet.metrics.likes} likes, ${tweet.metrics.retweets} RTs`
    );
  }

  return parts.join("\n");
}

function generateSignalId(tweetId: string): string {
  return `sig-${crypto
    .createHash("sha256")
    .update(tweetId)
    .digest("hex")
    .slice(0, 12)}`;
}
