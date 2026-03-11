import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type LLMProvider = "openclaw" | "openai-compatible";

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalEnum<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }

  if (allowed.includes(raw as T)) {
    return raw as T;
  }

  throw new Error(
    `Invalid env var: ${key}. Expected one of ${allowed.join(", ")}`
  );
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

function firstDefined(keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return fallback;
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

const DEFAULT_OPENCLAW_BASE_URL = "http://127.0.0.1:18789/v1";
const llmProvider = optionalEnum(
  "LLM_PROVIDER",
  ["openclaw", "openai-compatible"] as const,
  "openclaw"
);
const llmBaseUrl = trimTrailingSlashes(
  llmProvider === "openclaw"
    ? firstDefined(
        ["OPENCLAW_GATEWAY_BASE_URL", "LLM_BASE_URL"],
        DEFAULT_OPENCLAW_BASE_URL
      )
    : firstDefined(
        ["LLM_BASE_URL", "OPENCLAW_GATEWAY_BASE_URL"],
        DEFAULT_OPENCLAW_BASE_URL
      )
);
const llmApiKey =
  llmProvider === "openclaw"
    ? firstDefined([
        "OPENCLAW_GATEWAY_TOKEN",
        "OPENCLAW_GATEWAY_PASSWORD",
        "LLM_API_KEY",
      ])
    : firstDefined([
        "LLM_API_KEY",
        "OPENCLAW_GATEWAY_TOKEN",
        "OPENCLAW_GATEWAY_PASSWORD",
      ]);

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
    provider: llmProvider as LLMProvider,
    baseUrl: llmBaseUrl,
    model: optional("LLM_MODEL", "openclaw"),
    agentId: optional("OPENCLAW_AGENT_ID", "main"),
    apiKey: llmApiKey,
    timeoutMs: optionalInt("LLM_TIMEOUT_MS", 120_000),
    maxRetries: optionalInt("LLM_MAX_RETRIES", 4),
    retryBaseDelayMs: optionalInt("LLM_RETRY_BASE_DELAY_MS", 1_500),
    retryMaxDelayMs: optionalInt("LLM_RETRY_MAX_DELAY_MS", 15_000),
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
