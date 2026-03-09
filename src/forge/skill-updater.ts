/**
 * Incremental update for existing KOL Skills.
 *
 * Deps: forge/skill-generator, forge/quality-checker, distill, storage/db
 * Input: username with new data
 * Output: updated KOL Skill directory
 */

import fs from "fs";
import path from "path";
import { config } from "../shared/config";
import { getSignalsByAuthor, getTweetsByAuthor } from "../storage/db";
import { extractSignals } from "../distill/signal-extractor";
import { buildProfile } from "../distill/profile-builder";
import { buildKnowledge } from "../distill/knowledge-builder";
import { generateSkill } from "./skill-generator";
import { checkQuality } from "./quality-checker";
import type { KOLProfile, KOLKnowledge } from "../types";

export interface UpdateDecision {
  shouldFullRebuild: boolean;
  shouldIncremental: boolean;
  reason: string;
}

/**
 * Decide whether to do a full rebuild or incremental update.
 */
export function decideUpdateStrategy(
  username: string
): UpdateDecision {
  const skillDir = path.join(
    config.paths.generatedSkills,
    `kol-${username}`
  );
  const profilePath = path.join(skillDir, "profile.json");

  // No existing skill → full rebuild
  if (!fs.existsSync(profilePath)) {
    return {
      shouldFullRebuild: true,
      shouldIncremental: false,
      reason: "No existing skill found",
    };
  }

  const existing = JSON.parse(
    fs.readFileSync(profilePath, "utf-8")
  ) as KOLProfile;

  const currentTweets = getTweetsByAuthor(username, 99999).length;
  const prevTweets = existing.tweet_count_scraped;
  const newTweetRatio =
    prevTweets > 0
      ? (currentTweets - prevTweets) / prevTweets
      : 1;

  // Full rebuild if >30% new tweets
  if (newTweetRatio > 0.3) {
    return {
      shouldFullRebuild: true,
      shouldIncremental: false,
      reason: `${(newTweetRatio * 100).toFixed(0)}% new tweets since last build`,
    };
  }

  // Incremental if any new tweets
  if (currentTweets > prevTweets) {
    return {
      shouldFullRebuild: false,
      shouldIncremental: true,
      reason: `${currentTweets - prevTweets} new tweets`,
    };
  }

  return {
    shouldFullRebuild: false,
    shouldIncremental: false,
    reason: "No new data",
  };
}

/**
 * Run incremental update: extract signals from new tweets only,
 * then regenerate the skill with updated data.
 */
export async function incrementalUpdate(
  username: string
): Promise<string | null> {
  const decision = decideUpdateStrategy(username);

  if (!decision.shouldIncremental && !decision.shouldFullRebuild) {
    console.log(
      `[Forge] @${username}: no update needed (${decision.reason})`
    );
    return null;
  }

  console.log(
    `[Forge] @${username}: ${decision.shouldFullRebuild ? "full rebuild" : "incremental update"} (${decision.reason})`
  );

  // Extract signals from new tweets
  const allTweets = getTweetsByAuthor(username, 500);
  const existingSignals = getSignalsByAuthor(username, 99999);
  const processedIds = new Set(existingSignals.map((s) => s.tweet_id));
  const newTweets = allTweets.filter(
    (t) => !processedIds.has(t.tweet_id)
  );

  if (newTweets.length > 0) {
    await extractSignals(newTweets);
    console.log(
      `[Forge] Extracted signals from ${newTweets.length} new tweets`
    );
  }

  // Rebuild profile and knowledge
  const profile = await buildProfile(username);
  const knowledge = await buildKnowledge(username);

  // Quality check
  const quality = checkQuality(profile, knowledge);
  if (!quality.passed) {
    console.warn(
      `[Forge] Quality check warning: ${quality.issues.join(", ")}`
    );
  }

  // Regenerate skill files
  const skillDir = await generateSkill(profile, knowledge);
  return skillDir;
}
