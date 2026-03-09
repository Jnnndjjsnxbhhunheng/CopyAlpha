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
import { getSignalsByAuthor } from "../storage/db";
import type { KOLProfile, KOLKnowledge, TradingSignal } from "../types";

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
): Promise<string> {
  const username = profile.username;
  const skillDir = path.join(
    config.paths.generatedSkills,
    `kol-${username}`
  );

  fs.mkdirSync(skillDir, { recursive: true });

  const signals = getSignalsByAuthor(username, 500);

  // Generate SKILL.md
  const skillMd = await generateSkillMd(
    profile,
    knowledge,
    signals
  );
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMd, "utf-8");

  // Write profile.json
  fs.writeFileSync(
    path.join(skillDir, "profile.json"),
    JSON.stringify(profile, null, 2),
    "utf-8"
  );

  // Write knowledge.json
  fs.writeFileSync(
    path.join(skillDir, "knowledge.json"),
    JSON.stringify(knowledge, null, 2),
    "utf-8"
  );

  // Write signals-history.json
  fs.writeFileSync(
    path.join(skillDir, "signals-history.json"),
    JSON.stringify(signals, null, 2),
    "utf-8"
  );

  // Generate style-guide.json via LLM
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

  console.log(`[Forge] Generated Skill at ${skillDir}`);
  return skillDir;
}

async function generateSkillMd(
  profile: KOLProfile,
  knowledge: KOLKnowledge,
  signals: TradingSignal[]
): Promise<string> {
  const tokenOpinionsList = Object.entries(knowledge.token_opinions)
    .slice(0, 10)
    .map(([symbol, op]) => ({ symbol, ...op }));

  const whenToUse = buildWhenToUse(profile, knowledge);

  const data = {
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
