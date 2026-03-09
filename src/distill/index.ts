/**
 * Distill layer public API.
 *
 * Deps: distill/signal-extractor, distill/profile-builder,
 *       distill/knowledge-builder, distill/pattern-miner, distill/backtester
 * Input: username (with tweets in DB)
 * Output: TradingSignal[], KOLProfile, KOLKnowledge, TradingPattern[]
 */

import { getTweetsByAuthor } from "../storage/db";
import { extractSignals } from "./signal-extractor";
import { buildProfile } from "./profile-builder";
import { buildKnowledge } from "./knowledge-builder";
import { minePatterns } from "./pattern-miner";
import { backtestKOL, type PriceFetcher } from "./backtester";
import type {
  TradingSignal,
  KOLProfile,
  KOLKnowledge,
  TradingPattern,
  BacktestResult,
} from "../types";

export { extractSignals } from "./signal-extractor";
export { buildProfile } from "./profile-builder";
export { buildKnowledge } from "./knowledge-builder";
export { minePatterns } from "./pattern-miner";
export { backtestKOL } from "./backtester";

export interface DistillResult {
  signals: TradingSignal[];
  profile: KOLProfile;
  knowledge: KOLKnowledge;
  patterns: TradingPattern[];
  backtestResults: BacktestResult[];
}

/**
 * Run full distill pipeline for a KOL.
 */
export async function distillKOL(
  username: string,
  priceFetcher?: PriceFetcher
): Promise<DistillResult> {
  console.log(`[Distill] Starting pipeline for @${username}...`);

  // Step 1: Extract signals from tweets
  const tweets = getTweetsByAuthor(username, 500);
  console.log(`[Distill] Processing ${tweets.length} tweets...`);

  const signals = await extractSignals(tweets);
  console.log(`[Distill] Extracted ${signals.length} signals`);

  // Step 2: Build profile
  const profile = await buildProfile(username);
  console.log(`[Distill] Profile built`);

  // Step 3: Build knowledge graph
  const knowledge = await buildKnowledge(username);
  console.log(
    `[Distill] Knowledge graph: ${Object.keys(knowledge.token_opinions).length} tokens`
  );

  // Step 4: Mine patterns
  const patterns = await minePatterns(username);
  knowledge.trading_thesis.recurring_patterns = patterns;
  console.log(`[Distill] Found ${patterns.length} patterns`);

  // Step 5: Backtest (if price fetcher available)
  let backtestResults: BacktestResult[] = [];
  if (priceFetcher) {
    backtestResults = await backtestKOL(username, priceFetcher);
    console.log(`[Distill] Backtested ${backtestResults.length} signals`);
  } else {
    console.log(`[Distill] Skipping backtest (no price fetcher)`);
  }

  console.log(`[Distill] Pipeline complete for @${username}`);
  return { signals, profile, knowledge, patterns, backtestResults };
}
