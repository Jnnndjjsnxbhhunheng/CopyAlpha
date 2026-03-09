/**
 * CopyAlpha main entry point.
 *
 * Programmatic API for embedding CopyAlpha in other tools.
 */

export * as harvest from "./harvest";
export * as distill from "./distill";
export * as forge from "./forge";
export * as consult from "./consult";
export type {
  RawTweet,
  TradingSignal,
  KOLProfile,
  KOLKnowledge,
  AnalysisReport,
  BacktestResult,
  TrackedKOL,
} from "./types";
