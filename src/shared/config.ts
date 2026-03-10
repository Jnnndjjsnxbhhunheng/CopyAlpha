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

export type LLMProvider = "openclaw" | "openai-compatible";

export const config = {
  twitter: {
    bearerToken: optional("TWITTER_BEARER_TOKEN", ""),
    nitterInstances: optional("NITTER_INSTANCES", "")
      .split(",")
      .filter(Boolean),
  },

  llm: {
    provider: optional("LLM_PROVIDER", "openclaw") as LLMProvider,
    model: optional("LLM_MODEL", "openclaw"),
    baseUrl: optional(
      "LLM_BASE_URL",
      optional("OPENCLAW_GATEWAY_BASE_URL", "http://127.0.0.1:18789/v1")
    ),
    apiKey: optional(
      "LLM_API_KEY",
      optional(
        "OPENCLAW_GATEWAY_TOKEN",
        optional("OPENCLAW_GATEWAY_PASSWORD", "")
      )
    ),
    openclawAgentId: optional("OPENCLAW_AGENT_ID", "main"),
    timeoutMs: optionalInt("LLM_TIMEOUT_MS", 120000),
  },

  okx: {
    apiKey: optional("OKX_API_KEY", ""),
    secretKey: optional("OKX_SECRET_KEY", ""),
    passphrase: optional("OKX_PASSPHRASE", ""),
    walletAddress: optional("WALLET_ADDRESS", ""),
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
