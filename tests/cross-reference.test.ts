import { crossReference } from "../src/consult/cross-reference";
import type { LoadedSkill } from "../src/consult/skill-loader";
import type { KOLProfile, KOLKnowledge } from "../src/types";

function makeSkill(
  username: string,
  tokenStance: Record<string, "bullish" | "bearish" | "neutral"> = {},
  winRate = 0.6
): LoadedSkill {
  const opinions: KOLKnowledge["token_opinions"] = {};
  for (const [sym, stance] of Object.entries(tokenStance)) {
    opinions[sym] = {
      overall_stance: stance,
      conviction_level: 0.7,
      price_targets: [],
      key_arguments: [`${stance} reasoning for ${sym}`],
      last_mentioned: "2026-01-01",
      mention_frequency: "occasional",
      consistency: 0.8,
    };
  }

  return {
    username,
    profile: {
      username,
      display_name: username,
      bio: "",
      followers_count: 1000,
      following_count: 100,
      account_created: "2020-01-01",
      trading_style: {
        approach: "mixed",
        timeframe: "swing",
        risk_appetite: "moderate",
        preferred_sectors: ["defi"],
        preferred_chains: ["ethereum"],
        avg_holding_period_days: 7,
        max_position_size_pct: 5,
      },
      performance: {
        total_signals: 20,
        evaluated_signals: 10,
        win_rate: winRate,
        avg_return_pct: 12,
        best_call: { token: "ETH", return_pct: 50, date: "2026-01-01" },
        worst_call: { token: "SOL", return_pct: -20, date: "2026-02-01" },
        sharpe_ratio: 1.2,
        max_drawdown_pct: 15,
        active_since: "2025-01-01",
        peak_performance_market: "bull",
      },
      credibility: {
        score: 70,
        transparency: 60,
        skin_in_game: 70,
        shill_risk: 20,
        echo_chamber: 30,
        contrarian_value: 50,
      },
      last_scraped: new Date().toISOString(),
      tweet_count_scraped: 100,
      skill_version: "1.0.0",
      generated_by: "copyalpha@v2.0",
    } as KOLProfile,
    knowledge: {
      trading_thesis: {
        current_narratives: [
          {
            narrative: "DeFi growth",
            stance: "bullish",
            confidence: 0.8,
            first_mentioned: "2026-01-01",
            mention_count: 5,
            sample_reasoning: "TVL increasing",
          },
        ],
        recurring_patterns: [],
      },
      token_opinions: opinions,
      macro_views: {
        market_cycle_view: "early bull",
        btc_outlook: "bullish",
        eth_outlook: "bullish",
        sector_rankings: [],
        risk_factors: [],
        last_updated: new Date().toISOString(),
      },
      kol_network: {
        frequently_agrees_with: [],
        frequently_disagrees_with: [],
        often_quotes: [],
        influence_score: 50,
      },
    } as KOLKnowledge,
  };
}

describe("cross-reference", () => {
  it("identifies consensus when all KOLs agree", () => {
    const skills = [
      makeSkill("kol1", { ETH: "bullish" }),
      makeSkill("kol2", { ETH: "bullish" }),
      makeSkill("kol3", { ETH: "bullish" }),
    ];

    const result = crossReference("ETH", skills);
    expect(result.dominant_stance).toBe("bullish");
    expect(result.bullish.length).toBe(3);
    expect(result.bearish.length).toBe(0);
    expect(result.agreement_ratio).toBe(1);
  });

  it("identifies divergence", () => {
    const skills = [
      makeSkill("kol1", { SOL: "bullish" }),
      makeSkill("kol2", { SOL: "bearish" }),
      makeSkill("kol3", { SOL: "neutral" }),
    ];

    const result = crossReference("SOL", skills);
    expect(result.bullish.length).toBe(1);
    expect(result.bearish.length).toBe(1);
    expect(result.neutral.length).toBe(1);
    expect(result.agreement_ratio).toBeCloseTo(1 / 3);
  });

  it("falls back to narrative for unknown tokens", () => {
    const skills = [makeSkill("kol1", {})];
    const result = crossReference("UNKNOWN", skills);

    // Should use narrative stance as fallback
    expect(result.bullish.length + result.bearish.length + result.neutral.length).toBe(1);
  });

  it("handles empty skills list", () => {
    const result = crossReference("ETH", []);
    expect(result.bullish.length).toBe(0);
    expect(result.bearish.length).toBe(0);
    expect(result.agreement_ratio).toBe(0);
  });

  it("weighted confidence factors in win_rate", () => {
    const skills = [
      makeSkill("high_wr", { BTC: "bullish" }, 0.8),
      makeSkill("low_wr", { BTC: "bullish" }, 0.2),
    ];

    const result = crossReference("BTC", skills);
    expect(result.weighted_confidence).toBeGreaterThan(0);
  });
});
