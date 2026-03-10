/**
 * Load and match relevant KOL Skills for a given token/query.
 *
 * Deps: shared/config, types
 * Input: token symbol or query
 * Output: loaded KOL Skill data (profile + knowledge)
 */

import fs from "fs";
import path from "path";
import { config } from "../shared/config";
import { dedupeGeneratedSkillBundles, findGeneratedSkillBundle, listGeneratedSkillBundles } from "../shared/generated-skills";
import type { KOLProfile, KOLKnowledge } from "../types";

export interface LoadedSkill {
  username: string;
  profile: KOLProfile;
  knowledge: KOLKnowledge;
}

export function loadAllSkills(): LoadedSkill[] {
  const bundles = dedupeGeneratedSkillBundles(
    listGeneratedSkillBundles(config.paths.generatedSkills)
  );

  const skills: LoadedSkill[] = [];
  for (const bundle of bundles) {
    const skill = loadSkillFromDir(bundle.skillDir);
    if (skill) skills.push(skill);
  }
  return skills;
}

export function loadSkill(username: string): LoadedSkill | null {
  const bundle = findGeneratedSkillBundle(config.paths.generatedSkills, username);
  return bundle ? loadSkillFromDir(bundle.skillDir) : null;
}

function loadSkillFromDir(dir: string): LoadedSkill | null {
  try {
    const profilePath = path.join(dir, "profile.json");
    const knowledgePath = path.join(dir, "knowledge.json");

    if (!fs.existsSync(profilePath) || !fs.existsSync(knowledgePath)) {
      return null;
    }

    const profile = JSON.parse(
      fs.readFileSync(profilePath, "utf-8")
    ) as KOLProfile;
    const knowledge = JSON.parse(
      fs.readFileSync(knowledgePath, "utf-8")
    ) as KOLKnowledge;

    return { username: profile.username, profile, knowledge };
  } catch {
    return null;
  }
}

/**
 * Find KOL Skills relevant to a given token.
 *
 * Matching logic:
 * 1. KOL's token_opinions mentions the token
 * 2. KOL's preferred_sectors overlap with token's sector
 * 3. KOL's preferred_chains overlap with token's chain
 */
export function findRelevantSkills(
  token: string,
  chain?: string
): LoadedSkill[] {
  const all = loadAllSkills();
  const symbol = token.replace(/^\$/, "").toUpperCase();

  const scored = all.map((skill) => ({
    skill,
    score: computeRelevance(skill, symbol, chain),
  }));

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.skill);
}

function computeRelevance(
  skill: LoadedSkill,
  symbol: string,
  chain?: string
): number {
  let score = 0;

  // Direct token mention is highest signal
  const opinions = skill.knowledge.token_opinions;
  if (opinions[symbol]) {
    score += 10;
    score += opinions[symbol].conviction_level * 5;
  }

  // Sector overlap
  const sectors = skill.profile.trading_style.preferred_sectors;
  if (sectors.length > 0) {
    score += 2; // Has sector preference = some relevance
  }

  // Chain match
  if (chain) {
    const chains = skill.profile.trading_style.preferred_chains;
    if (chains.some((c) => c.toLowerCase() === chain.toLowerCase())) {
      score += 3;
    }
  }

  // Credibility bonus
  if (skill.profile.credibility.score > 60) {
    score += 1;
  }

  // Performance bonus
  if (skill.profile.performance.win_rate > 0.5) {
    score += skill.profile.performance.win_rate * 3;
  }

  return score;
}
