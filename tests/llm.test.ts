import http from "http";
import type { AddressInfo } from "net";

describe("shared/llm", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("sends OpenClaw auth and agent headers when configured", async () => {
    const requestInfo = await withMockLLMServer(
      {
        provider: "openclaw",
        model: "openclaw",
        agentId: "main",
        apiKey: "gateway-token",
      },
      async ({ generateJSON }) =>
        generateJSON<{ ok: boolean }>({
          system: "You are strict JSON.",
          prompt: '{"ok": true}',
        })
    );

    expect(requestInfo.result).toEqual({ ok: true });
    expect(requestInfo.path).toBe("/v1/chat/completions");
    expect(requestInfo.authorization).toBe("Bearer gateway-token");
    expect(requestInfo.agentId).toBe("main");
  });

  it("omits OpenClaw agent header for generic OpenAI-compatible mode", async () => {
    const requestInfo = await withMockLLMServer(
      {
        provider: "openai-compatible",
        model: "gpt-4.1-mini",
        agentId: "ignored-agent",
        apiKey: "generic-key",
      },
      async ({ generate }) =>
        generate({
          system: "",
          prompt: "hello",
        })
    );

    expect(requestInfo.result).toBe("ok");
    expect(requestInfo.authorization).toBe("Bearer generic-key");
    expect(requestInfo.agentId).toBeUndefined();
  });

  it("retries recoverable concurrency errors and eventually succeeds", async () => {
    let attempts = 0;

    const requestInfo = await withMockLLMServer(
      {
        provider: "openclaw",
        model: "openclaw",
        agentId: "main",
        apiKey: "gateway-token",
        maxRetries: 3,
      },
      async ({ generate }) =>
        generate({
          system: "",
          prompt: "hello",
        }),
      () => {
        attempts += 1;

        if (attempts < 3) {
          return {
            statusCode: 429,
            body: "Concurrency limit exceeded for account",
          };
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            choices: [{ message: { content: "ok" } }],
          }),
        };
      }
    );

    expect(requestInfo.result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("surfaces a clear hint when OpenClaw chat completions is disabled", async () => {
    await expect(
      withMockLLMServer(
        {
          provider: "openclaw",
          model: "openclaw",
          agentId: "main",
          apiKey: "gateway-token",
          maxRetries: 0,
        },
        async ({ generate }) =>
          generate({
            system: "",
            prompt: "hello",
          }),
        () => ({
          statusCode: 404,
          body: "Not Found",
        })
      )
    ).rejects.toThrow(
      "OpenClaw Gateway chat completions endpoint may be disabled"
    );
  });
});

async function withMockLLMServer<T>(
  llmConfig: {
    provider: "openclaw" | "openai-compatible";
    model: string;
    agentId: string;
    apiKey: string;
    maxRetries?: number;
  },
  run: (
    llm: typeof import("../src/shared/llm")
  ) => Promise<T>,
  respond?: () => {
    statusCode: number;
    body: string;
    headers?: Record<string, string>;
  }
): Promise<{
  result: T;
  path?: string;
  authorization?: string;
  agentId?: string;
}> {
  let capturedPath: string | undefined;
  let capturedAuthorization: string | undefined;
  let capturedAgentId: string | undefined;

  const server = http.createServer((request, response) => {
    capturedPath = request.url ?? undefined;
    capturedAuthorization =
      typeof request.headers.authorization === "string"
        ? request.headers.authorization
        : undefined;
    capturedAgentId =
      typeof request.headers["x-openclaw-agent-id"] === "string"
        ? request.headers["x-openclaw-agent-id"]
        : undefined;

    let rawBody = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      rawBody += chunk;
    });
    request.on("end", () => {
      if (respond) {
        const next = respond();
        response.writeHead(next.statusCode, {
          "Content-Type": "application/json",
          ...(next.headers ?? {}),
        });
        response.end(next.body);
        return;
      }

      const body = JSON.parse(rawBody) as { model?: string };
      const content =
        llmConfig.provider === "openclaw" ? '{"ok": true}' : "ok";

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content,
              },
            },
          ],
          model: body.model,
        })
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address() as AddressInfo;

  jest.doMock("../src/shared/config", () => ({
    config: {
      llm: {
        ...llmConfig,
        baseUrl: `http://127.0.0.1:${address.port}/v1`,
        timeoutMs: 1_000,
        maxRetries: llmConfig.maxRetries ?? 0,
        retryBaseDelayMs: 1,
        retryMaxDelayMs: 5,
      },
    },
  }));

  const llm = require("../src/shared/llm") as typeof import("../src/shared/llm");

  try {
    const result = await run(llm);
    return {
      result,
      path: capturedPath,
      authorization: capturedAuthorization,
      agentId: capturedAgentId,
    };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}
