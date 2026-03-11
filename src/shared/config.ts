import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }

  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer env var: ${key}`);
  }
  return parsed;
}

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
}

export const config = {
  socialdata: {
    apiKey: optional("SOCIALDATA_API_KEY", ""),
  },

  okx: {
    apiKey: optional("OKX_API_KEY", ""),
    secretKey: optional("OKX_SECRET_KEY", ""),
    passphrase: optional("OKX_PASSPHRASE", ""),
  },

  llm: {
    baseUrl: "http://127.0.0.1:18789/v1",
    model: "openclaw",
    agentId: "main",
  },

  harvest: {
    intervalSeconds: optionalInt("HARVEST_INTERVAL_SECONDS", 60),
    historyDepth: optionalInt("HARVEST_HISTORY_DEPTH", 500),
    maxConcurrent: optionalInt("HARVEST_MAX_CONCURRENT", 3),
  },

  paths: {
    db: path.resolve(process.cwd(), "copyalpha.db"),
    generatedSkills: path.resolve(process.cwd(), "generated-skills"),
  },
};
