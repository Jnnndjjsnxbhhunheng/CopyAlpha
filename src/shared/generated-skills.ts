import fs from "fs";
import path from "path";

export interface GeneratedSkillBundle {
  username: string;
  skillName: string;
  skillDir: string;
  updatedAtMs: number;
}

export function normalizeSkillUsername(username: string): string {
  return username.replace(/^@/, "").toLowerCase();
}

export function buildBaseSkillName(username: string): string {
  return `kol-${normalizeSkillUsername(username)}`;
}

export function listGeneratedSkillBundles(rootDir: string): GeneratedSkillBundle[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("kol-"))
    .map((entry) => toGeneratedSkillBundle(path.join(rootDir, entry.name), entry.name))
    .filter((item): item is GeneratedSkillBundle => item !== null);
}

export function findGeneratedSkillBundle(
  rootDir: string,
  username: string
): GeneratedSkillBundle | null {
  const normalized = normalizeSkillUsername(username);
  const baseName = buildBaseSkillName(normalized);
  const matches = listGeneratedSkillBundles(rootDir).filter(
    (bundle) => bundle.username === normalized
  );

  if (matches.length === 0) {
    return null;
  }

  const exact = matches.find((bundle) => bundle.skillName === baseName);
  if (exact) {
    return exact;
  }

  return matches.sort(compareGeneratedSkillBundles)[0] ?? null;
}

export function resolveGeneratedSkillOutput(
  rootDir: string,
  username: string
): GeneratedSkillBundle {
  const normalized = normalizeSkillUsername(username);
  const existing = findGeneratedSkillBundle(rootDir, normalized);
  if (existing) {
    return existing;
  }

  const baseName = buildBaseSkillName(normalized);
  let candidateName = baseName;
  let suffix = 2;

  while (fs.existsSync(path.join(rootDir, candidateName))) {
    candidateName = `${baseName}-${suffix}`;
    suffix += 1;
  }

  return {
    username: normalized,
    skillName: candidateName,
    skillDir: path.join(rootDir, candidateName),
    updatedAtMs: 0,
  };
}

export function dedupeGeneratedSkillBundles(
  bundles: GeneratedSkillBundle[]
): GeneratedSkillBundle[] {
  const bestByUsername = new Map<string, GeneratedSkillBundle>();

  for (const bundle of bundles) {
    const current = bestByUsername.get(bundle.username);
    if (!current || compareGeneratedSkillBundles(bundle, current) < 0) {
      bestByUsername.set(bundle.username, bundle);
    }
  }

  return Array.from(bestByUsername.values()).sort((left, right) =>
    left.username.localeCompare(right.username)
  );
}

function toGeneratedSkillBundle(
  skillDir: string,
  skillName: string
): GeneratedSkillBundle | null {
  const username = readGeneratedSkillUsername(skillDir);
  if (!username) {
    return null;
  }

  const stat = fs.statSync(skillDir);
  return {
    username,
    skillName,
    skillDir,
    updatedAtMs: stat.mtimeMs,
  };
}

function readGeneratedSkillUsername(skillDir: string): string | null {
  const profilePath = path.join(skillDir, "profile.json");
  if (!fs.existsSync(profilePath)) {
    return null;
  }

  try {
    const profile = JSON.parse(fs.readFileSync(profilePath, "utf-8")) as {
      username?: string;
    };
    if (!profile.username) {
      return null;
    }
    return normalizeSkillUsername(profile.username);
  } catch {
    return null;
  }
}

function compareGeneratedSkillBundles(
  left: GeneratedSkillBundle,
  right: GeneratedSkillBundle
): number {
  const leftBase = buildBaseSkillName(left.username);
  const rightBase = buildBaseSkillName(right.username);

  if (left.skillName === leftBase && right.skillName !== rightBase) {
    return -1;
  }
  if (left.skillName !== leftBase && right.skillName === rightBase) {
    return 1;
  }

  if (left.updatedAtMs !== right.updatedAtMs) {
    return right.updatedAtMs - left.updatedAtMs;
  }

  return left.skillName.localeCompare(right.skillName);
}
