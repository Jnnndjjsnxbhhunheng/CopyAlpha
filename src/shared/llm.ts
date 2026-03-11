/**
 * LLM client wrapper for OpenClaw and generic OpenAI-compatible backends.
 *
 * Deps: shared/config
 */

import http from "http";
import https from "https";
import { URL } from "url";
import { config } from "./config";

export interface LLMRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

/**
 * Send a prompt and expect JSON back.
 */
export async function generateJSON<T>(req: LLMRequest): Promise<T> {
  const raw = await generate(req);
  return parseJSONResponse<T>(raw);
}

export async function generate(req: LLMRequest): Promise<string> {
  return withRetry(async () => {
    const response = await postJson<ChatCompletionResponse>(
      `${config.llm.baseUrl}/chat/completions`,
      buildHeaders(),
      buildRequestBody(req)
    );

    if (response.error?.message) {
      throw new Error(`LLM request failed: ${response.error.message}`);
    }

    const content = response.choices?.[0]?.message?.content;
    const text = normalizeMessageContent(content);
    if (!text) {
      throw new Error("LLM response did not contain text content");
    }
    return text;
  });
}

function buildRequestBody(req: LLMRequest): Record<string, unknown> {
  const messages = [
    { role: "user", content: req.prompt },
  ];
  const system = req.system?.trim();

  if (system) {
    messages.unshift({ role: "system", content: system });
  }

  return {
    model: config.llm.model,
    messages,
    max_tokens: req.maxTokens ?? 4096,
    temperature: 0,
  };
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.llm.apiKey) {
    headers.Authorization = `Bearer ${config.llm.apiKey}`;
  }

  if (config.llm.provider === "openclaw" && config.llm.agentId) {
    headers["x-openclaw-agent-id"] = config.llm.agentId;
  }

  return headers;
}

function normalizeMessageContent(
  content: string | Array<{ type?: string; text?: string }> | undefined
): string {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();
}

async function postJson<T>(
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<T> {
  const target = new URL(url);
  const payload = JSON.stringify(body);
  const transport = target.protocol === "https:" ? https : http;

  return new Promise<T>((resolve, reject) => {
    const request = transport.request(
      target,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(payload).toString(),
        },
        timeout: config.llm.timeoutMs,
      },
      (response) => {
        let raw = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 400) {
            return reject(
              new Error(formatHttpError(response.statusCode, raw))
            );
          }

          try {
            resolve(JSON.parse(raw) as T);
          } catch {
            reject(
              new Error(
                `Failed to parse LLM response JSON: ${raw.slice(0, 400)}`
              )
            );
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(
        new Error(`LLM request timed out after ${config.llm.timeoutMs}ms`)
      );
    });
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= config.llm.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= config.llm.maxRetries || !isRetryableLlmError(error)) {
        throw error;
      }

      const delayMs = computeRetryDelayMs(attempt);
      await sleep(delayMs);
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function computeRetryDelayMs(attempt: number): number {
  const baseDelayMs = Math.max(config.llm.retryBaseDelayMs, 1);
  const maxDelayMs = Math.max(config.llm.retryMaxDelayMs, baseDelayMs);
  const exponentialDelayMs = Math.min(
    maxDelayMs,
    baseDelayMs * 2 ** attempt
  );
  const jitterMs = Math.floor(exponentialDelayMs * 0.2 * Math.random());

  return Math.min(maxDelayMs, exponentialDelayMs + jitterMs);
}

function isRetryableLlmError(error: unknown): boolean {
  const message = normalizeErrorMessage(error);

  if (!message) {
    return false;
  }

  if (/\b(408|409|425|429|500|502|503|504)\b/.test(extractHttpStatus(message))) {
    return true;
  }

  return (
    /concurrency limit exceeded/i.test(message) ||
    /rate limit/i.test(message) ||
    /socket hang up/i.test(message) ||
    /timed out/i.test(message) ||
    /econnreset/i.test(message) ||
    /etimedout/i.test(message) ||
    /eai_again/i.test(message)
  );
}

function extractHttpStatus(message: string): string {
  const match = message.match(/LLM HTTP (\d{3})/i);
  return match?.[1] ?? "";
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message} ${(error as NodeJS.ErrnoException).code ?? ""}`.trim();
  }

  return String(error ?? "");
}

function formatHttpError(statusCode: number, raw: string): string {
  const body = raw.slice(0, 400).trim();
  const suffix = buildHttpErrorHint(statusCode);

  return [`LLM HTTP ${statusCode}: ${body}`, suffix]
    .filter(Boolean)
    .join(" ");
}

function buildHttpErrorHint(statusCode: number): string {
  if (config.llm.provider !== "openclaw") {
    return "";
  }

  if (statusCode === 404) {
    return "OpenClaw Gateway chat completions endpoint may be disabled. Enable `gateway.http.endpoints.chatCompletions.enabled = true` and restart the gateway.";
  }

  if (statusCode === 401) {
    return "OpenClaw Gateway auth failed. Check `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` and restart if you changed gateway auth.";
  }

  return "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJSONResponse<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse LLM JSON response: ${cleaned.slice(0, 200)}...`
    );
  }
}
