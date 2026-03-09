import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  twitter: {
    bearerToken: optional("TWITTER_BEARER_TOKEN", ""),
    nitterInstances: optional("NITTER_INSTANCES", "")
      .split(",")
      .filter(Boolean),
  },

  anthropic: {
    apiKey: optional("ANTHROPIC_API_KEY", ""),
    model: optional("LLM_MODEL", "claude-sonnet-4-20250514"),
  },

  okx: {
    apiKey: optional("OKX_API_KEY", ""),
    secretKey: optional("OKX_SECRET_KEY", ""),
    passphrase: optional("OKX_PASSPHRASE", ""),
    walletAddress: optional("WALLET_ADDRESS", ""),
  },

  harvest: {
    intervalSeconds: parseInt(optional("HARVEST_INTERVAL_SECONDS", "60"), 10),
    historyDepth: parseInt(optional("HARVEST_HISTORY_DEPTH", "500"), 10),
    maxConcurrent: parseInt(optional("HARVEST_MAX_CONCURRENT", "3"), 10),
  },

  paths: {
    db: path.resolve(process.cwd(), "copyalpha.db"),
    generatedSkills: path.resolve(process.cwd(), "generated-skills"),
  },
};
