import fs from "fs";
import path from "path";
import os from "os";
import { loadAllSkills, findRelevantSkills, loadSkill } from "../src/consult/skill-loader";

// We'll test with a temp directory
const tmpDir = path.join(os.tmpdir(), `copyalpha-test-${Date.now()}`);
const skillsDir = path.join(tmpDir, "generated-skills");

// Override config for testing
jest.mock("../src/shared/config", () => ({
  config: {
    paths: {
      db: ":memory:",
      generatedSkills: path.join(
        os.tmpdir(),
        `copyalpha-test-${Date.now()}`,
        "generated-skills"
      ),
    },
  },
}));

function writeTestSkill(username: string, sectors: string[], tokenOpinions: Record<string, any> = {}): void {
  // Re-read the mock to get the actual path
  const { config } = require("../src/shared/config");
  const dir = path.join(config.paths.generatedSkills, `kol-${username}`);
  fs.mkdirSync(dir, { recursive: true });

  const profile = {
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
      preferred_sectors: sectors,
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
    credibility: { score: 70, transparency: 60, skin_in_game: 70, shill_risk: 20, echo_chamber: 30, contrarian_value: 50 },
    last_scraped: new Date().toISOString(),
    tweet_count_scraped: 100,
    skill_version: "1.0.0",
    generated_by: "copyalpha@v2.0",
  };

  const knowledge = {
    trading_thesis: { current_narratives: [], recurring_patterns: [] },
    token_opinions: tokenOpinions,
    macro_views: {
      market_cycle_view: "bull",
      btc_outlook: "bullish",
      eth_outlook: "bullish",
      sector_rankings: [],
      risk_factors: [],
      last_updated: new Date().toISOString(),
    },
    kol_network: { frequently_agrees_with: [], frequently_disagrees_with: [], often_quotes: [], influence_score: 50 },
  };

  fs.writeFileSync(path.join(dir, "profile.json"), JSON.stringify(profile));
  fs.writeFileSync(path.join(dir, "knowledge.json"), JSON.stringify(knowledge));
}

afterAll(() => {
  const { config } = require("../src/shared/config");
  fs.rmSync(config.paths.generatedSkills, { recursive: true, force: true });
});

describe("skill-loader", () => {
  beforeAll(() => {
    writeTestSkill("defi-guru", ["defi"], {
      ETH: { overall_stance: "bullish", conviction_level: 0.9, price_targets: [], key_arguments: ["Ultrasound money"], last_mentioned: "2026-03-01", mention_frequency: "frequent", consistency: 0.9 },
    });
    writeTestSkill("meme-lord", ["meme"], {
      PEPE: { overall_stance: "bullish", conviction_level: 0.7, price_targets: [], key_arguments: ["Meme szn"], last_mentioned: "2026-03-01", mention_frequency: "frequent", consistency: 0.5 },
    });
  });

  it("loads all skills", () => {
    const skills = loadAllSkills();
    expect(skills.length).toBe(2);
  });

  it("finds relevant skills by token mention", () => {
    const relevant = findRelevantSkills("ETH");
    expect(relevant.length).toBeGreaterThan(0);
    expect(relevant[0].username).toBe("defi-guru");
  });

  it("ranks by relevance score", () => {
    const relevant = findRelevantSkills("PEPE");
    const memeIdx = relevant.findIndex((s) => s.username === "meme-lord");
    expect(memeIdx).toBe(0);
  });

  it("loads a suffixed bundle when the base name belongs to another skill", () => {
    writeTestSkill("another-user", ["macro"]);
    const { config } = require("../src/shared/config");
    const baseDir = path.join(config.paths.generatedSkills, "kol-defi-guru");
    const suffixedDir = path.join(config.paths.generatedSkills, "kol-defi-guru-2");

    fs.rmSync(baseDir, { recursive: true, force: true });
    fs.mkdirSync(baseDir, { recursive: true });
    fs.writeFileSync(path.join(baseDir, "profile.json"), JSON.stringify({ username: "other-person" }));
    fs.writeFileSync(path.join(baseDir, "knowledge.json"), JSON.stringify({}));

    fs.mkdirSync(suffixedDir, { recursive: true });
    fs.writeFileSync(path.join(suffixedDir, "profile.json"), JSON.stringify({
      username: "defi-guru",
      display_name: "defi-guru",
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
      credibility: { score: 70, transparency: 60, skin_in_game: 70, shill_risk: 20, echo_chamber: 30, contrarian_value: 50 },
      last_scraped: new Date().toISOString(),
      tweet_count_scraped: 100,
      skill_version: "1.0.0",
      generated_by: "copyalpha@v2.0",
    }));
    fs.writeFileSync(path.join(suffixedDir, "knowledge.json"), JSON.stringify({
      trading_thesis: { current_narratives: [], recurring_patterns: [] },
      token_opinions: {
        ETH: { overall_stance: "bullish", conviction_level: 0.95, price_targets: [], key_arguments: ["Suffix survives collision"], last_mentioned: "2026-03-01", mention_frequency: "frequent", consistency: 0.9 },
      },
      macro_views: {
        market_cycle_view: "bull",
        btc_outlook: "bullish",
        eth_outlook: "bullish",
        sector_rankings: [],
        risk_factors: [],
        last_updated: new Date().toISOString(),
      },
      kol_network: { frequently_agrees_with: [], frequently_disagrees_with: [], often_quotes: [], influence_score: 50 },
    }));

    const loaded = loadSkill("defi-guru");
    expect(loaded?.username).toBe("defi-guru");
  });
});
