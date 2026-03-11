/**
 * LLM client wrapper — hardcoded to local OpenClaw gateway.
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

const TIMEOUT_MS = 120_000;

/**
 * Send a prompt and expect JSON back.
 */
export async function generateJSON<T>(req: LLMRequest): Promise<T> {
  const raw = await generate(req);
  return parseJSONResponse<T>(raw);
}

export async function generate(req: LLMRequest): Promise<string> {
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
  return {
    "Content-Type": "application/json",
    "x-openclaw-agent-id": config.llm.agentId,
  };
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
        timeout: TIMEOUT_MS,
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
              new Error(
                `LLM HTTP ${response.statusCode}: ${raw.slice(0, 400)}`
              )
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
      request.destroy(new Error(`LLM request timed out after ${TIMEOUT_MS}ms`));
    });
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
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
