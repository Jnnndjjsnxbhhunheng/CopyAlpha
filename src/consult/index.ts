/**
 * Consult layer public API.
 *
 * Deps: consult/advisor, consult/skill-loader, consult/cross-reference,
 *       consult/onchainos-bridge
 * Input: token/question from user or AI Agent
 * Output: AnalysisReport, consensus, recommendations
 */

export {
  analyze,
  askKOL,
  consensus,
  critique,
  recommend,
  leaderboard,
} from "./advisor";

export { loadAllSkills, loadSkill, findRelevantSkills } from "./skill-loader";
export { fetchOnchainData, isOnchainOSAvailable } from "./onchainos-bridge";
export { crossReference } from "./cross-reference";
