/**
 * Backtest historical signals against actual price movements.
 *
 * Deps: storage/db, types
 * Input: TradingSignal[]
 * Output: BacktestResult[]
 *
 * Note: Full backtesting requires OnchainOS price API.
 * This module provides the framework; price fetching is pluggable.
 */

import {
  getUntestedSignals,
  insertBacktestResult,
} from "../storage/db";
import type { TradingSignal, BacktestResult, Timeframe } from "../types";

export type PriceFetcher = (
  tokenSymbol: string,
  chain: string | null,
  timestamp: string
) => Promise<number | null>;

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  short: 24 * 3600,
  medium: 7 * 86400,
  long: 30 * 86400,
};

/**
 * Run backtest on all untested signals for a KOL.
 * Requires a PriceFetcher function (provided by OnchainOS bridge).
 */
export async function backtestKOL(
  username: string,
  fetchPrice: PriceFetcher
): Promise<BacktestResult[]> {
  const untested = getUntestedSignals(username);
  const results: BacktestResult[] = [];

  for (const signal of untested) {
    const result = await backtestSignal(signal, fetchPrice);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

async function backtestSignal(
  signal: TradingSignal,
  fetchPrice: PriceFetcher
): Promise<BacktestResult | null> {
  if (signal.tokens.length === 0) return null;

  const token = signal.tokens[0];
  const timeframe = token.timeframe ?? "medium";

  const priceAtSignal = await fetchPrice(
    token.symbol,
    token.chain,
    signal.created_at
  );

  if (priceAtSignal === null) return null;

  const endDate = new Date(signal.created_at);
  endDate.setSeconds(
    endDate.getSeconds() + TIMEFRAME_SECONDS[timeframe]
  );

  // Skip if end date is in the future
  if (endDate > new Date()) return null;

  const priceAtEnd = await fetchPrice(
    token.symbol,
    token.chain,
    endDate.toISOString()
  );

  if (priceAtEnd === null) return null;

  const returnPct =
    (priceAtEnd - priceAtSignal) / priceAtSignal;
  const isWin =
    token.sentiment === "bullish"
      ? returnPct > 0
      : token.sentiment === "bearish"
        ? returnPct < 0
        : Math.abs(returnPct) < 0.05;

  const result: BacktestResult = {
    signal_id: signal.id,
    price_at_signal: priceAtSignal,
    price_at_end: priceAtEnd,
    return_pct: returnPct,
    outcome: isWin ? "win" : "loss",
    timeframe_used: timeframe,
  };

  insertBacktestResult(result);
  return result;
}
