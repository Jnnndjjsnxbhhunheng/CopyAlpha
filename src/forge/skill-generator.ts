/**
 * Generate KOL Skill files from distilled knowledge.
 *
 * Deps: shared/llm, types, forge/templates
 * Input: KOLProfile, KOLKnowledge, TradingSignal[]
 * Output: generated-skills/kol-{username}/ directory
 */

import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { generate } from "../shared/llm";
import { config } from "../shared/config";
import { resolveGeneratedSkillOutput } from "../shared/generated-skills";
import { getSignalsByAuthor } from "../storage/db";
import type {
  KOLProfile,
  KOLKnowledge,
  TradingSignal,
  NarrativeView,
  TokenOpinion,
  TradingPattern,
} from "../types";

// Register Handlebars helpers
Handlebars.registerHelper("join", (arr: string[], sep: string) =>
  (arr ?? []).join(typeof sep === "string" ? sep : ", ")
);
Handlebars.registerHelper(
  "percent",
  (val: number) => Math.round((val ?? 0) * 100)
);
Handlebars.registerHelper("stance_label", (s: string) => {
  const map: Record<string, string> = {
    bullish: "看多",
    bearish: "看空",
    neutral: "中性",
  };
  return map[s] ?? s;
});
Handlebars.registerHelper("action_label", (s: string) => {
  const map: Record<string, string> = {
    buy: "买入",
    sell: "卖出",
    wait: "观望",
  };
  return map[s] ?? s;
});

const SKILL_MD_TEMPLATE = fs.readFileSync(
  resolveSkillTemplatePath(),
  "utf-8"
);

const compiledTemplate = Handlebars.compile(SKILL_MD_TEMPLATE);

export async function generateSkill(
  profile: KOLProfile,
  knowledge: KOLKnowledge
): Promise<{ skillDir: string; skillName: string }> {
  const username = profile.username;
  const resolved = resolveGeneratedSkillOutput(
    config.paths.generatedSkills,
    username
  );
  const skillDir = resolved.skillDir;

  fs.mkdirSync(skillDir, { recursive: true });
  fs.mkdirSync(path.join(skillDir, "agents"), { recursive: true });

  const signals = getSignalsByAuthor(username, 500);

  const skillMd = await generateSkillMd(
    profile,
    knowledge,
    signals,
    resolved.skillName
  );
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMd, "utf-8");

  fs.writeFileSync(
    path.join(skillDir, "profile.json"),
    JSON.stringify(profile, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(skillDir, "knowledge.json"),
    JSON.stringify(knowledge, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(skillDir, "signals-history.json"),
    JSON.stringify(signals, null, 2),
    "utf-8"
  );

  const styleGuide = await generateStyleGuide(
    profile,
    knowledge,
    signals
  );
  fs.writeFileSync(
    path.join(skillDir, "style-guide.json"),
    JSON.stringify(styleGuide, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(skillDir, "agents", "openai.yaml"),
    buildOpenAiAgentMetadata(profile, resolved.skillName),
    "utf-8"
  );

  fs.writeFileSync(
    path.join(skillDir, "claude-agent.md"),
    buildClaudeAgent(profile, knowledge, resolved.skillName),
    "utf-8"
  );

  console.log(`[Forge] Generated Skill ${resolved.skillName} at ${skillDir}`);
  return { skillDir, skillName: resolved.skillName };
}

async function generateSkillMd(
  profile: KOLProfile,
  knowledge: KOLKnowledge,
  signals: TradingSignal[],
  skillName: string
): Promise<string> {
  const tokenOpinionsList = summarizeTokenOpinions(knowledge);

  const whenToUse = buildWhenToUse(profile, knowledge);

  const data = {
    skill_name: skillName,
    username: profile.username,
    trading_style: true,
    preferred_sectors: profile.trading_style.preferred_sectors,
    preferred_chains: profile.trading_style.preferred_chains,
    timeframe_label: timeframeLabel(profile.trading_style.timeframe),
    approach_label: approachLabel(profile.trading_style.approach),
    risk_label: riskLabel(profile.trading_style.risk_appetite),
    win_rate: profile.performance.win_rate || null,
    updated_at: new Date().toISOString(),
    tweet_count: profile.tweet_count_scraped,
    signal_count: signals.length,
    when_to_use: whenToUse,
    patterns: knowledge.trading_thesis.recurring_patterns,
    token_opinions_list: tokenOpinionsList,
  };

  return compiledTemplate(data);
}

function buildWhenToUse(
  profile: KOLProfile,
  knowledge: KOLKnowledge
): string[] {
  const uses: string[] = [];
  const sectors = profile.trading_style.preferred_sectors;

  if (sectors.length > 0) {
    uses.push(
      `当你需要分析 ${sectors.join("/")} 类 token 时`
    );
  }
  uses.push(
    `当你需要参考${timeframeLabel(profile.trading_style.timeframe)}交易视角时`
  );

  const topTokens = Object.keys(knowledge.token_opinions).slice(0, 5);
  if (topTokens.length > 0) {
    uses.push(
      `当你分析 ${topTokens.map((t) => "$" + t).join("/")} 等 token 时`
    );
  }

  return uses;
}

async function generateStyleGuide(
  profile: KOLProfile,
  knowledge: KOLKnowledge,
  signals: TradingSignal[]
): Promise<Record<string, unknown>> {
  const prompt = `根据以下 KOL 画像和知识图谱，生成一个分析风格指南 JSON。

KOL: @${profile.username}
交易风格: ${profile.trading_style.approach}
时间偏好: ${profile.trading_style.timeframe}
偏好赛道: ${profile.trading_style.preferred_sectors.join(", ")}
信号数量: ${signals.length}

返回 JSON：
{
  "analysis_tone": "该 KOL 的分析语气风格",
  "decision_framework": "决策框架描述",
  "key_indicators": ["关注的核心指标"],
  "red_flags": ["会触发警惕的信号"],
  "entry_criteria": ["典型入场条件"],
  "exit_criteria": ["典型出场条件"]
}`;

  const raw = await generate({
    system: "你是一个交易分析专家。严格返回 JSON。",
    prompt,
    maxTokens: 2048,
  });

  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      analysis_tone: "unknown",
      decision_framework: "unknown",
      key_indicators: [],
      red_flags: [],
      entry_criteria: [],
      exit_criteria: [],
    };
  }
}

function buildOpenAiAgentMetadata(profile: KOLProfile, skillName: string): string {
  const displayName = `@${profile.username} Trading Skill`;
  const shortDescription = `提炼 @${profile.username} 的交易风格与 token 观点，可直接本地安装使用`;
  const defaultPrompt = `Use $${skillName} to analyze a token with @${profile.username}'s historical trading style.`;

  return [
    "interface:",
    `  display_name: \"${escapeYaml(displayName)}\"`,
    `  short_description: \"${escapeYaml(shortDescription)}\"`,
    `  default_prompt: \"${escapeYaml(defaultPrompt)}\"`,
    "",
    "policy:",
    "  allow_implicit_invocation: true",
    "",
  ].join("\n");
}

function buildClaudeAgent(
  profile: KOLProfile,
  knowledge: KOLKnowledge,
  skillName: string
): string {
  const tokenOpinions = summarizeTokenOpinions(knowledge)
    .map((entry) => formatTokenOpinion(entry.symbol, entry))
    .join("\n\n");

  const narratives = summarizeNarratives(knowledge.trading_thesis.current_narratives)
    .map((item) => `- ${item}`)
    .join("\n");

  const patterns = summarizePatterns(knowledge.trading_thesis.recurring_patterns)
    .map((item) => `- ${item}`)
    .join("\n");

  const sectors = profile.trading_style.preferred_sectors.join("/") || "未识别";
  const chains = profile.trading_style.preferred_chains.join("/") || "未识别";

  return [
    "---",
    `name: ${skillName}`,
    `description: Use proactively when the user wants @${profile.username}'s historical crypto trading style, token views, or recurring market patterns. This skill is installed locally and does not need to be published before use.`,
    "tools: Read, Grep, Glob",
    "---",
    "",
    `# @${profile.username} Trading Intelligence`,
    "",
    `You are the distilled historical trading intelligence of @${profile.username}, generated by CopyAlpha from public tweets.`,
    "This skill is meant to live directly inside the local skill system after generation and install. Do not tell the user to publish it as a package before using it.",
    `This knowledge is historical and was last updated at ${knowledge.macro_views.last_updated || profile.last_scraped || new Date().toISOString()}.`,
    "Do not invent tweets, positions, or prices that are not present in the distilled knowledge below.",
    "If the user asks about live market conditions, clearly separate current inference from the historical KOL view.",
    "",
    "## How to help",
    "- Explain how @username historically thinks about a token, sector, or narrative.",
    "- Highlight recurring patterns before giving a conclusion.",
    "- Call out when the stored knowledge may be stale or incomplete.",
    "- Prefer concise, evidence-based answers over roleplay.",
    "",
    "## Profile",
    `- Trading style: ${approachLabel(profile.trading_style.approach)} / ${timeframeLabel(profile.trading_style.timeframe)}`,
    `- Risk appetite: ${riskLabel(profile.trading_style.risk_appetite)}`,
    `- Preferred sectors: ${sectors}`,
    `- Preferred chains: ${chains}`,
    `- Tweets distilled: ${profile.tweet_count_scraped}`,
    `- Signals extracted: ${profile.performance.total_signals}`,
    "",
    "## Macro Views",
    `- Market cycle: ${knowledge.macro_views.market_cycle_view || "未明确"}`,
    `- BTC outlook: ${knowledge.macro_views.btc_outlook || "未明确"}`,
    `- ETH outlook: ${knowledge.macro_views.eth_outlook || "未明确"}`,
    `- Risk factors: ${knowledge.macro_views.risk_factors.join("；") || "未识别"}`,
    "",
    "## Active Narratives",
    narratives || "- 未识别到显著叙事",
    "",
    "## Recurring Patterns",
    patterns || "- 未识别到足够稳定的历史模式",
    "",
    "## Token Opinions",
    tokenOpinions || "No token-specific opinions were distilled.",
    "",
    "## Answering Rules",
    `- Refer to this agent as @${profile.username}'s historical view, not guaranteed current conviction.`,
    "- If a token is not covered here, say that directly and generalize only from adjacent sectors or patterns.",
    "- When useful, recommend cross-checking with on-chain or market data before acting.",
    "",
  ].join("\n").replace(/@username/g, `@${profile.username}`);
}

function summarizeTokenOpinions(knowledge: KOLKnowledge): Array<{ symbol: string } & TokenOpinion> {
  return Object.entries(knowledge.token_opinions)
    .slice(0, 12)
    .map(([symbol, opinion]) => ({ symbol, ...opinion }));
}

function summarizeNarratives(narratives: NarrativeView[]): string[] {
  return narratives.slice(0, 8).map((item) => {
    return `${item.narrative}：${stanceLabel(item.stance)}，置信度 ${percent(item.confidence)}%，提及 ${item.mention_count} 次；逻辑：${item.sample_reasoning}`;
  });
}

function summarizePatterns(patterns: TradingPattern[]): string[] {
  return patterns.slice(0, 8).map((item) => {
    return `${item.name}：${item.description}；触发条件 ${item.trigger_conditions.join("；") || "未识别"}；典型动作 ${actionLabel(item.typical_action)}；成功率 ${percent(item.success_rate)}%。`;
  });
}

function formatTokenOpinion(symbol: string, opinion: TokenOpinion): string {
  const argumentsText = opinion.key_arguments.length > 0
    ? opinion.key_arguments.slice(0, 4).map((item) => `  - ${item}`).join("\n")
    : "  - 无明确论据摘要";

  return [
    `### $${symbol}`,
    `- Stance: ${stanceLabel(opinion.overall_stance)}`,
    `- Conviction: ${percent(opinion.conviction_level)}%`,
    `- Mention frequency: ${opinion.mention_frequency}`,
    `- Last mentioned: ${opinion.last_mentioned}`,
    "- Key arguments:",
    argumentsText,
  ].join("\n");
}

function timeframeLabel(tf: string): string {
  const map: Record<string, string> = {
    scalp: "超短线",
    swing: "中期波段",
    position: "长线持仓",
    mixed: "混合周期",
  };
  return map[tf] ?? tf;
}

function approachLabel(ap: string): string {
  const map: Record<string, string> = {
    technical: "技术分析",
    fundamental: "基本面分析",
    onchain: "链上数据分析",
    sentiment: "情绪分析",
    mixed: "综合分析",
  };
  return map[ap] ?? ap;
}

function riskLabel(risk: string): string {
  const map: Record<string, string> = {
    conservative: "保守",
    moderate: "中等",
    aggressive: "激进",
  };
  return map[risk] ?? risk;
}

function stanceLabel(value: string): string {
  const map: Record<string, string> = {
    bullish: "看多",
    bearish: "看空",
    neutral: "中性",
  };
  return map[value] ?? value;
}

function actionLabel(value: string): string {
  const map: Record<string, string> = {
    buy: "买入",
    sell: "卖出",
    wait: "观望",
  };
  return map[value] ?? value;
}

function percent(value: number): number {
  return Math.round((value ?? 0) * 100);
}

function escapeYaml(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
}

function resolveSkillTemplatePath(): string {
  const candidates = [
    path.join(__dirname, "templates", "skill-md.hbs"),
    path.resolve(__dirname, "..", "..", "src", "forge", "templates", "skill-md.hbs"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to locate skill-md.hbs template");
}
