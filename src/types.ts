// ─── Raw Tweet (Harvest layer output) ───

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}

export interface TweetContext {
  is_thread: boolean;
  thread_position?: number;
  is_reply_to?: string;
  is_quote_of?: string;
  media_urls: string[];
  urls: string[];
  hashtags: string[];
  cashtags: string[];
}

export interface RawTweet {
  tweet_id: string;
  author_username: string;
  text: string;
  created_at: string;
  metrics: TweetMetrics;
  context: TweetContext;
}

// ─── Trading Signal (Distill layer output) ───

export type Sentiment = "bullish" | "bearish" | "neutral";
export type Timeframe = "short" | "medium" | "long";

export interface TokenSignal {
  symbol: string;
  chain: string | null;
  sentiment: Sentiment;
  price_target: number | null;
  stop_loss: number | null;
  timeframe: Timeframe;
}

export interface TradingSignal {
  id: string;
  tweet_id: string;
  author_username: string;
  tokens: TokenSignal[];
  confidence: number;
  reasoning: string;
  topic_tags: string[];
  created_at: string;
}

export interface SignalExtractionResult {
  is_signal: boolean;
  signal: {
    tokens: TokenSignal[];
    confidence: number;
    reasoning: string;
  } | null;
  topic_tags: string[];
}

// ─── Backtest Result ───

export interface BacktestResult {
  signal_id: string;
  price_at_signal: number;
  price_at_end: number;
  return_pct: number;
  outcome: "win" | "loss";
  timeframe_used: Timeframe;
}

// ─── KOL Profile (Forge layer output) ───

export type TradingApproach =
  | "technical"
  | "fundamental"
  | "onchain"
  | "sentiment"
  | "mixed";

export type TimeframeStyle = "scalp" | "swing" | "position" | "mixed";
export type RiskAppetite = "conservative" | "moderate" | "aggressive";
export type MarketPhase = "bull" | "bear" | "sideways";

export interface KOLProfile {
  username: string;
  display_name: string;
  bio: string;
  followers_count: number;
  following_count: number;
  account_created: string;

  trading_style: {
    approach: TradingApproach;
    timeframe: TimeframeStyle;
    risk_appetite: RiskAppetite;
    preferred_sectors: string[];
    preferred_chains: string[];
    avg_holding_period_days: number;
    max_position_size_pct: number;
  };

  performance: {
    total_signals: number;
    evaluated_signals: number;
    win_rate: number;
    avg_return_pct: number;
    best_call: { token: string; return_pct: number; date: string };
    worst_call: { token: string; return_pct: number; date: string };
    sharpe_ratio: number;
    max_drawdown_pct: number;
    active_since: string;
    peak_performance_market: MarketPhase;
  };

  credibility: {
    score: number;
    transparency: number;
    skin_in_game: number;
    shill_risk: number;
    echo_chamber: number;
    contrarian_value: number;
  };

  last_scraped: string;
  tweet_count_scraped: number;
  skill_version: string;
  generated_by: "copyalpha@v2.0";
}

// ─── KOL Knowledge (Forge layer output) ───

export interface NarrativeView {
  narrative: string;
  stance: Sentiment;
  confidence: number;
  first_mentioned: string;
  mention_count: number;
  sample_reasoning: string;
}

export interface TradingPattern {
  pattern_id: string;
  name: string;
  description: string;
  trigger_conditions: string[];
  typical_action: "buy" | "sell" | "wait";
  historical_occurrences: number;
  success_rate: number;
  avg_return_when_followed: number;
  supporting_tweet_ids: string[];
  confidence: number;
}

export interface TokenOpinion {
  overall_stance: Sentiment;
  conviction_level: number;
  price_targets: { price: number; date: string; hit: boolean }[];
  key_arguments: string[];
  last_mentioned: string;
  mention_frequency: "frequent" | "occasional" | "rare";
  consistency: number;
}

export interface KOLKnowledge {
  trading_thesis: {
    current_narratives: NarrativeView[];
    recurring_patterns: TradingPattern[];
  };

  token_opinions: Record<string, TokenOpinion>;

  macro_views: {
    market_cycle_view: string;
    btc_outlook: string;
    eth_outlook: string;
    sector_rankings: { sector: string; rank: number; reasoning: string }[];
    risk_factors: string[];
    last_updated: string;
  };

  kol_network: {
    frequently_agrees_with: string[];
    frequently_disagrees_with: string[];
    often_quotes: string[];
    influence_score: number;
  };
}

// ─── Analysis Report (Consult layer output) ───

export type Recommendation =
  | "strong_buy"
  | "buy"
  | "hold"
  | "sell"
  | "strong_sell";

export interface KOLOpinionSummary {
  username: string;
  confidence: number;
  key_argument: string;
}

export interface AnalysisReport {
  token: string;
  chain: string;
  timestamp: string;

  recommendation: Recommendation;
  confidence: number;
  reasoning: string;

  kol_consensus: {
    bullish: KOLOpinionSummary[];
    bearish: KOLOpinionSummary[];
    neutral: KOLOpinionSummary[];
    agreement_ratio: number;
  };

  onchain_validation: {
    price_trend: "up" | "down" | "sideways";
    volume_trend: "increasing" | "decreasing" | "stable";
    smart_money_direction: "accumulating" | "distributing" | "neutral";
    holder_concentration_risk: "low" | "medium" | "high";
    kol_vs_onchain_alignment: number;
  };

  trade_suggestion?: {
    action: "buy" | "sell";
    suggested_size_usd: number;
    suggested_size_pct: number;
    entry_price: number;
    target_price: number;
    stop_loss: number;
    risk_reward_ratio: number;
  };

  sources: {
    kol_skills_used: string[];
    onchainos_apis_called: string[];
    total_tweets_referenced: number;
  };
}

// ─── Harvest Config ───

export interface HarvestConfig {
  intervalSeconds: number;
  historyDepth: number;
  maxConcurrent: number;
}

// ─── KOL tracking entry ───

export interface TrackedKOL {
  username: string;
  added_at: string;
  last_scraped: string | null;
  tweet_count: number;
  status: "active" | "paused" | "error";
  error_message: string | null;
}
