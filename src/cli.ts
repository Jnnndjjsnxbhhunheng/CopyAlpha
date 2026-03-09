#!/usr/bin/env node

/**
 * CLI entry point for CopyAlpha.
 *
 * Usage:
 *   copyalpha init [dir]
 *   copyalpha install-skill
 *   copyalpha harvest add @username
 *   copyalpha harvest remove @username
 *   copyalpha harvest status
 *   copyalpha harvest monitor
 *   copyalpha forge build @username
 *   copyalpha forge materialize @username
 *   copyalpha forge all
 *   copyalpha consult analyze $TOKEN [question]
 *   copyalpha consult ask @username <question>
 *   copyalpha consult consensus $TOKEN
 *   copyalpha consult critique "trade idea"
 *   copyalpha consult recommend
 *   copyalpha consult leaderboard
 */

import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";
import * as harvest from "./harvest";
import { forgeKOL } from "./forge";
import {
  analyze,
  askKOL,
  consensus,
  critique,
  recommend,
  leaderboard,
} from "./consult";
import { getTrackedKOLs } from "./storage/db";

const program = new Command();

program
  .name("copyalpha")
  .description("把 KOL 变成你的私人 Skill，让 AI 替你抄最聪明的作业")
  .version("2.0.0");

program
  .command("init")
  .description("Scaffold a CopyAlpha workspace")
  .argument("[dir]", "Target directory", ".")
  .action((dir: string) => {
    const result = initWorkspace(dir);

    console.log(`Workspace ready at: ${result.workspaceDir}`);
    console.log(`Env template: ${result.envCreated ? "created" : "already exists"}`);
    console.log(`Generated skills dir: ${result.generatedSkillsDir}`);
    console.log("\nNext steps:");
    console.log(`  1. Fill secrets in ${path.join(result.workspaceDir, ".env")}`);
    console.log("  2. Run: copyalpha forge materialize @username");
  });

program
  .command("install-skill")
  .description("Install the bundled Codex skill into ~/.codex/skills")
  .option("-d, --dest <dir>", "Destination skills directory")
  .option("-n, --name <name>", "Installed skill directory name", "copyalpha-kol-factory")
  .option("-f, --force", "Overwrite an existing installed skill")
  .action((options: InstallSkillOptions) => {
    const result = installBundledSkill(options);

    console.log(`Installed skill to: ${result.destDir}`);
    console.log(`Source: ${result.sourceDir}`);
    console.log("Restart Codex to pick up the new skill.");
  });

// ─── Harvest Commands ───

const harvestCmd = program
  .command("harvest")
  .description("KOL tweet collection");

harvestCmd
  .command("add <username>")
  .description("Start tracking a KOL")
  .action(async (username: string) => {
    await harvest.addKOL(username);
    const count = await harvest.scrapeHistory(username);
    console.log(`Done. Scraped ${count} tweets for @${username}`);
  });

harvestCmd
  .command("remove <username>")
  .description("Stop tracking a KOL")
  .action(async (username: string) => {
    await harvest.removeKOL(username);
    console.log(`Stopped tracking @${username}`);
  });

harvestCmd
  .command("status")
  .description("Show tracking status")
  .action(() => {
    const kols = harvest.getStatus();
    if (kols.length === 0) {
      console.log(
        "No KOLs tracked yet. Use: copyalpha harvest add @username"
      );
      return;
    }
    console.log("\nTracked KOLs:");
    console.log("─".repeat(60));
    for (const kol of kols) {
      const icon =
        kol.status === "active"
          ? "+"
          : kol.status === "error"
            ? "x"
            : "-";
      console.log(
        `  [${icon}] @${kol.username} | ${kol.tweet_count} tweets | last: ${kol.last_scraped ?? "never"}`
      );
      if (kol.error_message) {
        console.log(`      Error: ${kol.error_message}`);
      }
    }
  });

harvestCmd
  .command("monitor")
  .description("Start incremental monitoring")
  .action(() => {
    harvest.startMonitor();
    console.log("Monitor started. Press Ctrl+C to stop.");
  });

// ─── Forge Commands ───

const forgeCmd = program
  .command("forge")
  .description("Generate KOL Skills");

forgeCmd
  .command("build <username>")
  .description("Generate/update a KOL Skill")
  .action(async (username: string) => {
    const normalized = username.replace(/^@/, "").toLowerCase();
    const result = await forgeKOL(normalized);
    console.log(`\nSkill generated at: ${result.skillDir}`);
    console.log(`Quality score: ${result.quality.score}/100`);
    if (result.quality.issues.length > 0) {
      console.log(`Issues: ${result.quality.issues.join("; ")}`);
    }
    if (result.quality.warnings.length > 0) {
      console.log(`Warnings: ${result.quality.warnings.join("; ")}`);
    }
  });

forgeCmd
  .command("materialize <username>")
  .description("Track, harvest, and forge a brand new KOL Skill")
  .option("-c, --count <count>", "Historical tweet count to scrape")
  .action(async (username: string, options: { count?: string }) => {
    const count = parseOptionalInt(options.count, "count");
    const result = await materializeKOL(username, count);

    console.log(`\nMaterialized @${result.username} into a new skill.`);
    console.log(`Tweets scraped: ${result.scrapedCount}`);
    console.log(`Skill generated at: ${result.forgeResult.skillDir}`);
    console.log(`Quality score: ${result.forgeResult.quality.score}/100`);

    if (result.forgeResult.quality.issues.length > 0) {
      console.log(`Issues: ${result.forgeResult.quality.issues.join("; ")}`);
    }
    if (result.forgeResult.quality.warnings.length > 0) {
      console.log(`Warnings: ${result.forgeResult.quality.warnings.join("; ")}`);
    }
  });

forgeCmd
  .command("all")
  .description("Rebuild all KOL Skills")
  .action(async () => {
    const kols = getTrackedKOLs("active");
    if (kols.length === 0) {
      console.log(
        "No active KOLs. Use: copyalpha harvest add @username"
      );
      return;
    }
    console.log(`Forging ${kols.length} KOL Skills...`);
    for (const kol of kols) {
      try {
        const result = await forgeKOL(kol.username);
        console.log(
          `  @${kol.username}: done (quality: ${result.quality.score}/100)`
        );
      } catch (err) {
        console.error(
          `  @${kol.username}: FAILED — ${(err as Error).message}`
        );
      }
    }
  });

// ─── Consult Commands ───

const consultCmd = program
  .command("consult")
  .description("Query KOL Skills for trading analysis");

consultCmd
  .command("analyze <token>")
  .description("Comprehensive token analysis")
  .argument("[question]", "Optional specific question")
  .action(async (token: string, question?: string) => {
    const report = await analyze(token, question);
    printReport(report);
  });

consultCmd
  .command("ask <username> <question>")
  .description("Ask a specific KOL a question")
  .action(async (username: string, question: string) => {
    const answer = await askKOL(username, question);
    console.log(`\n@${username} says:\n${answer}`);
  });

consultCmd
  .command("consensus <token>")
  .description("Get KOL consensus on a token")
  .action(async (token: string) => {
    const result = await consensus(token);
    console.log(`\nConsensus for $${token.replace(/^\$/, "").toUpperCase()}:`);
    console.log("─".repeat(50));
    console.log(
      `Dominant: ${result.dominant_stance} (agreement: ${(result.agreement_ratio * 100).toFixed(0)}%)`
    );

    if (result.bullish.length > 0) {
      console.log(`\nBullish (${result.bullish.length}):`);
      for (const k of result.bullish) {
        console.log(`  @${k.username}: ${k.key_argument}`);
      }
    }
    if (result.bearish.length > 0) {
      console.log(`\nBearish (${result.bearish.length}):`);
      for (const k of result.bearish) {
        console.log(`  @${k.username}: ${k.key_argument}`);
      }
    }
    if (result.neutral.length > 0) {
      console.log(`\nNeutral (${result.neutral.length}):`);
      for (const k of result.neutral) {
        console.log(`  @${k.username}: ${k.key_argument}`);
      }
    }
  });

consultCmd
  .command("critique <idea>")
  .description("Get KOL feedback on a trade idea")
  .action(async (idea: string) => {
    const result = await critique(idea);
    console.log(`\nKOL Critiques:\n${result}`);
  });

consultCmd
  .command("recommend")
  .description("Get top opportunities from all KOL Skills")
  .action(async () => {
    const result = await recommend();
    console.log(`\nTop Opportunities:\n${result}`);
  });

consultCmd
  .command("leaderboard")
  .description("KOL performance ranking")
  .action(() => {
    const result = leaderboard();
    console.log(`\n${result}`);
  });

// ─── Report Printer ───

function printReport(report: any): void {
  console.log("\n" + "═".repeat(60));
  console.log(`  Analysis Report: $${report.token}`);
  console.log("═".repeat(60));

  const recEmoji: Record<string, string> = {
    strong_buy: "[STRONG BUY]",
    buy: "[BUY]",
    hold: "[HOLD]",
    sell: "[SELL]",
    strong_sell: "[STRONG SELL]",
  };

  console.log(
    `\n  Recommendation: ${recEmoji[report.recommendation] ?? report.recommendation}`
  );
  console.log(
    `  Confidence: ${(report.confidence * 100).toFixed(0)}%`
  );
  console.log(`  Reasoning: ${report.reasoning}`);

  const kc = report.kol_consensus;
  console.log("\n  KOL Consensus:");
  console.log(
    `    Agreement: ${(kc.agreement_ratio * 100).toFixed(0)}%`
  );
  if (kc.bullish.length > 0) {
    console.log(
      `    Bullish: ${kc.bullish.map((k: any) => "@" + k.username).join(", ")}`
    );
  }
  if (kc.bearish.length > 0) {
    console.log(
      `    Bearish: ${kc.bearish.map((k: any) => "@" + k.username).join(", ")}`
    );
  }

  const ov = report.onchain_validation;
  console.log("\n  On-chain Validation:");
  console.log(`    Price trend: ${ov.price_trend}`);
  console.log(`    Volume trend: ${ov.volume_trend}`);
  console.log(`    Smart money: ${ov.smart_money_direction}`);
  console.log(
    `    KOL vs On-chain alignment: ${(ov.kol_vs_onchain_alignment * 100).toFixed(0)}%`
  );

  if (report.trade_suggestion) {
    const ts = report.trade_suggestion;
    console.log("\n  Trade Suggestion:");
    console.log(`    Action: ${ts.action}`);
    console.log(`    Size: ${ts.suggested_size_pct}% of portfolio`);
    console.log(`    Entry: $${ts.entry_price}`);
    console.log(`    Target: $${ts.target_price}`);
    console.log(`    Stop loss: $${ts.stop_loss}`);
    console.log(`    R/R ratio: ${ts.risk_reward_ratio}`);
  }

  console.log("\n  Sources:");
  console.log(
    `    KOL Skills: ${report.sources.kol_skills_used.map((s: string) => "@" + s).join(", ") || "none"}`
  );
  console.log(
    `    OnchainOS APIs: ${report.sources.onchainos_apis_called.join(", ") || "none"}`
  );
  console.log("═".repeat(60));
}

program.parseAsync().catch((err: Error) => {
  console.error(`CopyAlpha failed: ${err.message}`);
  process.exitCode = 1;
});

interface InitWorkspaceResult {
  workspaceDir: string;
  generatedSkillsDir: string;
  envCreated: boolean;
}

interface MaterializeResult {
  username: string;
  scrapedCount: number;
  forgeResult: Awaited<ReturnType<typeof forgeKOL>>;
}

interface InstallSkillOptions {
  dest?: string;
  name: string;
  force?: boolean;
}

interface InstallSkillResult {
  sourceDir: string;
  destDir: string;
}

function initWorkspace(dir: string): InitWorkspaceResult {
  const workspaceDir = path.resolve(process.cwd(), dir);
  const generatedSkillsDir = path.join(workspaceDir, "generated-skills");
  const envPath = path.join(workspaceDir, ".env");

  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.mkdirSync(generatedSkillsDir, { recursive: true });

  let envCreated = false;
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(resolveEnvExamplePath(), envPath);
    envCreated = true;
  }

  return {
    workspaceDir,
    generatedSkillsDir,
    envCreated,
  };
}

function installBundledSkill(
  options: InstallSkillOptions
): InstallSkillResult {
  const sourceDir = resolveBundledSkillDir(options.name);
  const destRoot = options.dest
    ? path.resolve(process.cwd(), options.dest)
    : path.join(resolveCodexHome(), "skills");
  const destDir = path.join(destRoot, options.name);

  fs.mkdirSync(destRoot, { recursive: true });

  if (fs.existsSync(destDir)) {
    if (!options.force) {
      throw new Error(
        `Skill already exists at ${destDir}. Re-run with --force to overwrite.`
      );
    }
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  copyDirectory(sourceDir, destDir);

  return { sourceDir, destDir };
}

function resolveBundledSkillDir(skillName: string): string {
  const candidates = [
    path.resolve(__dirname, "..", "skills", skillName),
    path.resolve(process.cwd(), "skills", skillName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "SKILL.md"))) {
      return candidate;
    }
  }

  throw new Error(`Unable to locate bundled skill: ${skillName}`);
}

function resolveCodexHome(): string {
  return process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
}

function copyDirectory(sourceDir: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
      continue;
    }

    fs.copyFileSync(sourcePath, destPath);
  }
}

async function materializeKOL(
  username: string,
  count?: number
): Promise<MaterializeResult> {
  const normalized = username.replace(/^@/, "").toLowerCase();

  await harvest.addKOL(normalized);
  const scrapedCount = await harvest.scrapeHistory(normalized, count);
  const forgeResult = await forgeKOL(normalized);

  return {
    username: normalized,
    scrapedCount,
    forgeResult,
  };
}

function resolveEnvExamplePath(): string {
  const candidates = [
    path.resolve(__dirname, "..", ".env.example"),
    path.resolve(process.cwd(), ".env.example"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to find .env.example for workspace initialization");
}

function parseOptionalInt(
  value: string | undefined,
  flagName: string
): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`--${flagName} must be a positive integer`);
  }

  return parsed;
}
