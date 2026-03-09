/**
 * LLM client wrapper for Anthropic Claude API.
 *
 * Deps: @anthropic-ai/sdk, shared/config
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return client;
}

export interface LLMRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
}

/**
 * Send a prompt and expect JSON back.
 * Retries once on parse failure.
 */
export async function generateJSON<T>(req: LLMRequest): Promise<T> {
  const raw = await generate(req);
  return parseJSONResponse<T>(raw);
}

export async function generate(req: LLMRequest): Promise<string> {
  const response = await getClient().messages.create({
    model: config.anthropic.model,
    max_tokens: req.maxTokens ?? 4096,
    system: req.system,
    messages: [{ role: "user", content: req.prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected response type: ${block.type}`);
  }
  return block.text;
}

function parseJSONResponse<T>(raw: string): T {
  // Strip markdown code fences if present
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
