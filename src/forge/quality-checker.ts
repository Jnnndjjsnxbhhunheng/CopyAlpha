/**
 * Validate generated KOL Skill quality.
 *
 * Deps: types
 * Input: KOLProfile, KOLKnowledge
 * Output: QualityReport
 */

import type { KOLProfile, KOLKnowledge } from "../types";

export interface QualityReport {
  score: number;
  issues: string[];
  warnings: string[];
  passed: boolean;
}

const MIN_SCORE = 40;

export function checkQuality(
  profile: KOLProfile,
  knowledge: KOLKnowledge
): QualityReport {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Check profile completeness
  if (profile.trading_style.preferred_sectors.length === 0) {
    issues.push("No preferred sectors identified");
    score -= 15;
  }

  if (profile.tweet_count_scraped < 10) {
    issues.push(`Too few tweets (${profile.tweet_count_scraped})`);
    score -= 20;
  }

  if (profile.performance.total_signals === 0) {
    issues.push("No trading signals extracted");
    score -= 30;
  }

  // Check knowledge completeness
  const tokenCount = Object.keys(knowledge.token_opinions).length;
  if (tokenCount === 0) {
    warnings.push("No token opinions found");
    score -= 10;
  }

  if (knowledge.trading_thesis.current_narratives.length === 0) {
    warnings.push("No narratives identified");
    score -= 10;
  }

  if (knowledge.trading_thesis.recurring_patterns.length === 0) {
    warnings.push("No recurring patterns found");
    score -= 5;
  }

  // Check credibility
  if (profile.credibility.shill_risk > 70) {
    warnings.push(`High shill risk: ${profile.credibility.shill_risk}`);
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    warnings,
    passed: score >= MIN_SCORE,
  };
}
