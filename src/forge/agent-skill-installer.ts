import fs from "fs";
import os from "os";
import path from "path";

export type AgentInstallTarget = "bundle" | "openclaw" | "codex" | "claude";

export interface AgentInstallOptions {
  targets: AgentInstallTarget[];
  force?: boolean;
  bundleHome?: string;
  openclawHome?: string;
  codexHome?: string;
  claudeHome?: string;
  installedName?: string;
}

export interface AgentInstallResult {
  target: AgentInstallTarget;
  sourcePath: string;
  destPath: string;
}

export function installAgentSkillBundle(
  sourceDir: string,
  options: AgentInstallOptions
): AgentInstallResult[] {
  validateSkillBundle(sourceDir);

  const skillName = options.installedName ?? path.basename(sourceDir);
  const results: AgentInstallResult[] = [];

  for (const target of options.targets) {
    switch (target) {
      case "bundle": {
        const destPath = path.join(resolveBundleHome(options), skillName);
        installDirectory(sourceDir, destPath, !!options.force);
        results.push({ target, sourcePath: sourceDir, destPath });
        break;
      }
      case "openclaw": {
        const destPath = path.join(
          resolveOpenclawHome(options),
          "skills",
          skillName
        );
        installDirectory(sourceDir, destPath, !!options.force);
        results.push({ target, sourcePath: sourceDir, destPath });
        break;
      }
      case "codex": {
        const destPath = path.join(resolveCodexHome(options), "skills", skillName);
        installDirectory(sourceDir, destPath, !!options.force);
        results.push({ target, sourcePath: sourceDir, destPath });
        break;
      }
      case "claude": {
        const sourcePath = resolveClaudeAdapterPath(sourceDir);
        const destPath = path.join(resolveClaudeHome(options), "agents", `${skillName}.md`);
        installFile(sourcePath, destPath, !!options.force);
        results.push({ target, sourcePath, destPath });
        break;
      }
      default:
        assertNever(target);
    }
  }

  return results;
}

export function parseInstallTargets(value?: string): AgentInstallTarget[] {
  const rawTargets = (value ?? "openclaw,codex,claude,bundle")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (rawTargets.length === 0) {
    throw new Error("At least one install target is required");
  }

  const seen = new Set<AgentInstallTarget>();
  for (const target of rawTargets) {
    if (!isInstallTarget(target)) {
      throw new Error(
        `Unsupported install target: ${target}. Use openclaw, codex, claude, or bundle.`
      );
    }
    seen.add(target);
  }

  return Array.from(seen);
}

function validateSkillBundle(sourceDir: string): void {
  if (!fs.existsSync(path.join(sourceDir, "SKILL.md"))) {
    throw new Error(`Not a valid skill bundle: ${sourceDir}`);
  }
}

function resolveBundleHome(options: AgentInstallOptions): string {
  return options.bundleHome ?? process.env.AGENT_SKILLS_HOME ?? path.join(os.homedir(), ".agent-skills");
}

function resolveOpenclawHome(options: AgentInstallOptions): string {
  return options.openclawHome ?? process.env.OPENCLAW_HOME ?? path.join(os.homedir(), ".openclaw");
}

function resolveCodexHome(options: AgentInstallOptions): string {
  return options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
}

function resolveClaudeHome(options: AgentInstallOptions): string {
  return options.claudeHome ?? process.env.CLAUDE_HOME ?? path.join(os.homedir(), ".claude");
}

function resolveClaudeAdapterPath(sourceDir: string): string {
  const candidate = path.join(sourceDir, "claude-agent.md");
  if (fs.existsSync(candidate)) {
    return candidate;
  }

  throw new Error(`Claude adapter not found in skill bundle: ${sourceDir}`);
}

function installDirectory(sourceDir: string, destDir: string, force: boolean): void {
  ensureParentDir(destDir);

  if (fs.existsSync(destDir)) {
    if (!force) {
      throw new Error(
        `Destination already exists: ${destDir}. Re-run with force enabled to overwrite.`
      );
    }
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  copyDirectory(sourceDir, destDir);
}

function installFile(sourcePath: string, destPath: string, force: boolean): void {
  ensureParentDir(destPath);

  if (fs.existsSync(destPath) && !force) {
    throw new Error(
      `Destination already exists: ${destPath}. Re-run with force enabled to overwrite.`
    );
  }

  fs.copyFileSync(sourcePath, destPath);
}

function ensureParentDir(targetPath: string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
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

function isInstallTarget(value: string): value is AgentInstallTarget {
  return (
    value === "bundle" ||
    value === "openclaw" ||
    value === "codex" ||
    value === "claude"
  );
}

function assertNever(value: never): never {
  throw new Error(`Unexpected install target: ${value}`);
}
