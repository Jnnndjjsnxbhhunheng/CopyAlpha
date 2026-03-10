/**
 * Forge layer public API.
 *
 * Deps: forge/skill-generator, forge/quality-checker, distill
 * Input: username (with distilled data)
 * Output: KOL Skill directory in generated-skills/
 */

import { distillKOL } from "../distill";
import { generateSkill } from "./skill-generator";
import { checkQuality, type QualityReport } from "./quality-checker";
export { incrementalUpdate, decideUpdateStrategy } from "./skill-updater";
export { installAgentSkillBundle, parseInstallTargets } from "./agent-skill-installer";
export type { AgentInstallTarget, AgentInstallOptions, AgentInstallResult } from "./agent-skill-installer";

export interface ForgeResult {
  skillDir: string;
  quality: QualityReport;
}

/**
 * Full forge pipeline: distill → generate → quality check.
 */
export async function forgeKOL(
  username: string
): Promise<ForgeResult> {
  console.log(`[Forge] Starting forge for @${username}...`);

  // Run distill pipeline first
  const distilled = await distillKOL(username);

  // Quality check
  const quality = checkQuality(distilled.profile, distilled.knowledge);
  if (!quality.passed) {
    console.warn(
      `[Forge] Quality check failed (score: ${quality.score}): ${quality.issues.join(", ")}`
    );
  }
  if (quality.warnings.length > 0) {
    console.warn(
      `[Forge] Warnings: ${quality.warnings.join(", ")}`
    );
  }

  // Generate skill files
  const skillDir = await generateSkill(
    distilled.profile,
    distilled.knowledge
  );

  console.log(
    `[Forge] Complete for @${username} (quality: ${quality.score}/100)`
  );

  return { skillDir, quality };
}
