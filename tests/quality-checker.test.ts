import { checkQuality } from "../src/forge/quality-checker";
import type { KOLProfile, KOLKnowledge } from "../src/types";

function makeProfile(overrides: Partial<KOLProfile> = {}): KOLProfile {
  return {
    username: "testuser",
    display_name: "Test User",
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
      win_rate: 0.65,
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
    ...overrides,
  };
}

function makeKnowledge(
  overrides: Partial<KOLKnowledge> = {}
): KOLKnowledge {
  return {
    trading_thesis: {
      current_narratives: [
        {
          narrative: "DeFi renaissance",
          stance: "bullish",
          confidence: 0.8,
          first_mentioned: "2026-01-01",
          mention_count: 5,
          sample_reasoning: "TVL growth",
        },
      ],
      recurring_patterns: [],
    },
    token_opinions: {
      ETH: {
        overall_stance: "bullish",
        conviction_level: 0.8,
        price_targets: [],
        key_arguments: ["Ultrasound money"],
        last_mentioned: "2026-03-01",
        mention_frequency: "frequent",
        consistency: 0.9,
      },
    },
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
    ...overrides,
  };
}

describe("quality-checker", () => {
  it("passes a good profile", () => {
    const report = checkQuality(makeProfile(), makeKnowledge());
    expect(report.passed).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
  });

  it("fails with no signals", () => {
    const profile = makeProfile({
      performance: {
        ...makeProfile().performance,
        total_signals: 0,
      },
    });
    const report = checkQuality(profile, makeKnowledge());
    expect(report.score).toBeLessThan(100);
    expect(report.issues).toContain("No trading signals extracted");
  });

  it("fails with too few tweets", () => {
    const profile = makeProfile({ tweet_count_scraped: 5 });
    const report = checkQuality(profile, makeKnowledge());
    expect(report.issues).toContain("Too few tweets (5)");
  });

  it("warns on high shill risk", () => {
    const profile = makeProfile({
      credibility: { ...makeProfile().credibility, shill_risk: 80 },
    });
    const report = checkQuality(profile, makeKnowledge());
    expect(report.warnings.some((w) => w.includes("shill risk"))).toBe(true);
  });
});
