/**
 * Cross-reference multiple KOL opinions for consensus/divergence.
 *
 * Deps: consult/skill-loader, types
 * Input: token + loaded KOL Skills
 * Output: KOL consensus analysis
 */

import type { LoadedSkill } from "./skill-loader";
import type { Sentiment, KOLOpinionSummary } from "../types";

export interface KOLOpinion {
  username: string;
  stance: Sentiment;
  confidence: number;
  key_argument: string;
  win_rate: number;
  relevance_to_token: boolean;
}

export interface ConsensusResult {
  bullish: KOLOpinionSummary[];
  bearish: KOLOpinionSummary[];
  neutral: KOLOpinionSummary[];
  agreement_ratio: number;
  dominant_stance: Sentiment;
  weighted_confidence: number;
}

/**
 * Extract and cross-reference KOL opinions on a specific token.
 */
export function crossReference(
  token: string,
  skills: LoadedSkill[]
): ConsensusResult {
  const symbol = token.replace(/^\$/, "").toUpperCase();
  const opinions = skills.map((s) => extractOpinion(s, symbol));

  const bullish = opinions
    .filter((o) => o.stance === "bullish")
    .map(toSummary);
  const bearish = opinions
    .filter((o) => o.stance === "bearish")
    .map(toSummary);
  const neutral = opinions
    .filter((o) => o.stance === "neutral")
    .map(toSummary);

  const total = opinions.length;
  const dominant = getDominantStance(bullish.length, bearish.length, neutral.length);

  // Agreement ratio: proportion of KOLs sharing dominant stance
  const dominantCount = Math.max(
    bullish.length,
    bearish.length,
    neutral.length
  );
  const agreementRatio = total > 0 ? dominantCount / total : 0;

  // Weighted confidence: win_rate-weighted average confidence
  const weightedConfidence = computeWeightedConfidence(opinions);

  return {
    bullish,
    bearish,
    neutral,
    agreement_ratio: agreementRatio,
    dominant_stance: dominant,
    weighted_confidence: weightedConfidence,
  };
}

function extractOpinion(
  skill: LoadedSkill,
  symbol: string
): KOLOpinion {
  const tokenOp = skill.knowledge.token_opinions[symbol];

  if (tokenOp) {
    return {
      username: skill.username,
      stance: tokenOp.overall_stance,
      confidence: tokenOp.conviction_level,
      key_argument: tokenOp.key_arguments[0] ?? "",
      win_rate: skill.profile.performance.win_rate,
      relevance_to_token: true,
    };
  }

  // No direct mention — infer from sector/narrative alignment
  const narratives = skill.knowledge.trading_thesis.current_narratives;
  const relevantNarrative = narratives[0];

  return {
    username: skill.username,
    stance: relevantNarrative?.stance ?? "neutral",
    confidence: (relevantNarrative?.confidence ?? 0.3) * 0.5,
    key_argument: relevantNarrative?.sample_reasoning ?? "No direct opinion on this token",
    win_rate: skill.profile.performance.win_rate,
    relevance_to_token: false,
  };
}

function toSummary(opinion: KOLOpinion): KOLOpinionSummary {
  return {
    username: opinion.username,
    confidence: opinion.confidence,
    key_argument: opinion.key_argument,
  };
}

function getDominantStance(
  bullCount: number,
  bearCount: number,
  neutralCount: number
): Sentiment {
  if (bullCount > bearCount && bullCount > neutralCount) return "bullish";
  if (bearCount > bullCount && bearCount > neutralCount) return "bearish";
  return "neutral";
}

function computeWeightedConfidence(opinions: KOLOpinion[]): number {
  if (opinions.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const op of opinions) {
    const weight = Math.max(op.win_rate, 0.1);
    weightedSum += op.confidence * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
