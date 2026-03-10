import fs from "fs";
import os from "os";
import path from "path";
import {
  installAgentSkillBundle,
  parseInstallTargets,
} from "../src/forge/agent-skill-installer";

describe("agent-skill-installer", () => {
  const tmpRoot = path.join(os.tmpdir(), `copyalpha-agent-installer-${Date.now()}`);
  const sourceDir = path.join(tmpRoot, "kol-demo");
  const bundleHome = path.join(tmpRoot, "bundle-home");
  const openclawHome = path.join(tmpRoot, "openclaw-home");
  const codexHome = path.join(tmpRoot, "codex-home");
  const claudeHome = path.join(tmpRoot, "claude-home");

  beforeAll(() => {
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(path.join(sourceDir, "agents"), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, "SKILL.md"), "# demo skill\n");
    fs.writeFileSync(path.join(sourceDir, "claude-agent.md"), "---\nname: kol-demo\n---\n");
    fs.writeFileSync(path.join(sourceDir, "agents", "openai.yaml"), "interface:\n");
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("parses install targets", () => {
    expect(parseInstallTargets("openclaw,bundle,claude,codex")).toEqual([
      "openclaw",
      "bundle",
      "claude",
      "codex",
    ]);
  });

  it("installs bundle for all supported runtimes", () => {
    const results = installAgentSkillBundle(sourceDir, {
      targets: ["openclaw", "bundle", "codex", "claude"],
      force: true,
      bundleHome,
      openclawHome,
      codexHome,
      claudeHome,
      installedName: "kol-demo",
    });

    expect(results).toHaveLength(4);
    expect(fs.existsSync(path.join(openclawHome, "skills", "kol-demo", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(bundleHome, "kol-demo", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(codexHome, "skills", "kol-demo", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(claudeHome, "agents", "kol-demo.md"))).toBe(true);
  });
});
