/**
 * Bridge to OKX OnchainOS Skills for on-chain data.
 *
 * CopyAlpha calls OnchainOS Skills to get:
 * - Portfolio data (okx-wallet-portfolio)
 * - Market data (okx-dex-market)
 * - Token analytics (okx-dex-token)
 * - Swap execution (okx-dex-swap) — Phase 4
 *
 * Deps: shared/config
 * Output: OnchainData
 */

import { config } from "../shared/config";

export interface MarketData {
  price: number;
  price_change_24h_pct: number;
  volume_24h: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  chain: string;
  address: string;
  total_supply: number;
  holder_count: number;
}

export interface HolderAnalysis {
  top10_pct: number;
  top50_pct: number;
  concentration_risk: "low" | "medium" | "high";
  smart_money_holders: number;
}

export interface SmartMoneyFlow {
  direction: "accumulating" | "distributing" | "neutral";
  net_flow_24h: number;
  notable_wallets: { address: string; action: string; amount: number }[];
}

export interface PortfolioPosition {
  token: string;
  chain: string;
  balance: number;
  value_usd: number;
}

export interface Portfolio {
  total_value_usd: number;
  positions: PortfolioPosition[];
}

export interface OnchainData {
  market: MarketData | null;
  tokenInfo: TokenInfo | null;
  holders: HolderAnalysis | null;
  smartMoney: SmartMoneyFlow | null;
  portfolio: Portfolio | null;
  existingPosition: PortfolioPosition | null;
}

/**
 * Fetch all on-chain data for a token.
 * Gracefully degrades if any API fails.
 */
export async function fetchOnchainData(
  token: string,
  chain?: string
): Promise<OnchainData> {
  const results = await Promise.allSettled([
    getMarketData(token, chain),
    getTokenInfo(token, chain),
    getHolderAnalysis(token, chain),
    getSmartMoneyFlow(token, chain),
    getPortfolio(),
  ]);

  const market = extractResult<MarketData>(results[0]);
  const tokenInfo = extractResult<TokenInfo>(results[1]);
  const holders = extractResult<HolderAnalysis>(results[2]);
  const smartMoney = extractResult<SmartMoneyFlow>(results[3]);
  const portfolio = extractResult<Portfolio>(results[4]);

  const symbol = token.replace(/^\$/, "").toUpperCase();
  const existingPosition =
    portfolio?.positions.find(
      (p) => p.token.toUpperCase() === symbol
    ) ?? null;

  return { market, tokenInfo, holders, smartMoney, portfolio, existingPosition };
}

function extractResult<T>(
  result: PromiseSettledResult<T>
): T | null {
  if (result.status === "fulfilled") return result.value;
  console.warn(
    `[OnchainOS] API call failed:`,
    (result.reason as Error)?.message
  );
  return null;
}

// ─── OnchainOS Skill Callers ───

async function getMarketData(
  token: string,
  chain?: string
): Promise<MarketData> {
  return callSkill("okx-dex-market", {
    action: "get_price",
    token,
    chain: chain ?? "ethereum",
  });
}

async function getTokenInfo(
  token: string,
  chain?: string
): Promise<TokenInfo> {
  return callSkill("okx-dex-token", {
    action: "get_metadata",
    token,
    chain: chain ?? "ethereum",
  });
}

async function getHolderAnalysis(
  token: string,
  chain?: string
): Promise<HolderAnalysis> {
  return callSkill("okx-dex-token", {
    action: "get_holder_analysis",
    token,
    chain: chain ?? "ethereum",
  });
}

async function getSmartMoneyFlow(
  token: string,
  chain?: string
): Promise<SmartMoneyFlow> {
  return callSkill("okx-dex-market", {
    action: "get_smart_money_flow",
    token,
    chain: chain ?? "ethereum",
  });
}

async function getPortfolio(): Promise<Portfolio> {
  throw new Error("WALLET_ADDRESS not configured — removed from config");
}

/**
 * Call an OnchainOS Skill.
 *
 * In production, this would use the onchainos-skills SDK.
 * Currently returns mock data for development.
 */
async function callSkill<T>(
  skillName: string,
  params: Record<string, string>
): Promise<T> {
  // Check if OKX credentials are configured
  if (!config.okx.apiKey) {
    throw new Error(
      `OnchainOS Skill '${skillName}' requires OKX_API_KEY`
    );
  }

  // TODO: Replace with actual onchainos-skills SDK call
  // import { callSkill } from 'onchainos-skills';
  // return callSkill(skillName, params);

  throw new Error(
    `OnchainOS integration pending: ${skillName} (${params.action})`
  );
}

/**
 * Check if OnchainOS is available.
 */
export function isOnchainOSAvailable(): boolean {
  return !!config.okx.apiKey;
}
