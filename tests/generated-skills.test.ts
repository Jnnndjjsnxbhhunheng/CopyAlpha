import fs from "fs";
import os from "os";
import path from "path";
import {
  buildBaseSkillName,
  findGeneratedSkillBundle,
  resolveGeneratedSkillOutput,
} from "../src/shared/generated-skills";

const tmpRoot = path.join(os.tmpdir(), `copyalpha-generated-skills-${Date.now()}`);

function writeProfile(skillName: string, username: string): string {
  const skillDir = path.join(tmpRoot, skillName);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "profile.json"),
    JSON.stringify({ username })
  );
  fs.writeFileSync(path.join(skillDir, "knowledge.json"), JSON.stringify({}));
  return skillDir;
}

describe("generated skill naming", () => {
  beforeEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    fs.mkdirSync(tmpRoot, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("uses the base name when no collision exists", () => {
    const resolved = resolveGeneratedSkillOutput(tmpRoot, "inversebrah");
    expect(resolved.skillName).toBe("kol-inversebrah");
  });

  it("reuses the existing bundle for the same KOL", () => {
    writeProfile("kol-inversebrah", "inversebrah");
    const resolved = resolveGeneratedSkillOutput(tmpRoot, "inversebrah");
    expect(resolved.skillName).toBe("kol-inversebrah");
  });

  it("appends a numeric suffix when the base name is taken by another skill", () => {
    writeProfile("kol-inversebrah", "another-user");
    const resolved = resolveGeneratedSkillOutput(tmpRoot, "inversebrah");
    expect(resolved.skillName).toBe("kol-inversebrah-2");
  });

  it("finds an existing suffixed bundle for the same KOL", () => {
    writeProfile("kol-inversebrah", "another-user");
    writeProfile("kol-inversebrah-2", "inversebrah");
    const found = findGeneratedSkillBundle(tmpRoot, "inversebrah");
    expect(found?.skillName).toBe("kol-inversebrah-2");
  });

  it("builds the canonical base skill name", () => {
    expect(buildBaseSkillName("@InverseBrah")).toBe("kol-inversebrah");
  });
});
