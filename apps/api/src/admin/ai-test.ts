import type { AiTestResult } from "@drugreview/core";

import type { AiConfig } from "./ai-settings";

type Fetch = typeof fetch;

const TIMEOUT_MS = 15_000;
const OPENAI_BASE = "https://api.openai.com/v1";

/** Why a base URL can't be used, or null if it's fine. Plain http is only allowed for this computer. */
export function baseUrlProblem(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Enter the full address, for example https://openrouter.ai/api/v1.";
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    return "Use an https address (http is only allowed for localhost).";
  }
  if (url.username || url.password) return "Don't put a username or password in the address.";
  return null;
}

/**
 * Send one tiny request to the provider, to check the key, the model name and the address work.
 * Never throws and never includes the key in what it returns.
 */
export async function testAiConnection(
  config: AiConfig,
  doFetch: Fetch = fetch,
): Promise<AiTestResult> {
  if (!config.apiKey) return { ok: false, message: "No API key yet." };
  if (!config.model) return { ok: false, message: "Enter a model name." };

  let baseUrl = OPENAI_BASE;
  if (config.provider === "openai-compatible") {
    const problem = baseUrlProblem(config.baseUrl);
    if (problem) return { ok: false, message: problem };
    baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  const request: { url: string; headers: Record<string, string>; body: object } =
    config.provider === "anthropic"
      ? {
          url: "https://api.anthropic.com/v1/messages",
          headers: {
            "x-api-key": config.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: {
            model: config.model,
            max_tokens: 8,
            messages: [{ role: "user", content: "Reply with the word OK." }],
          },
        }
      : {
          url: `${baseUrl}/chat/completions`,
          headers: { Authorization: `Bearer ${config.apiKey}` },
          body: {
            model: config.model,
            max_tokens: 8,
            messages: [{ role: "user", content: "Reply with the word OK." }],
          },
        };

  try {
    const res = await doFetch(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...request.headers },
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return { ok: true, message: "Connected. The provider accepted the key and model." };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "The provider rejected this key. Check it and try again." };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message: "Model or address not found. Check the model name and address.",
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        message:
          "The key works, but the provider is rate limiting it or the account has no credit.",
      };
    }
    return { ok: false, message: `The provider answered with HTTP ${res.status}.` };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the provider. Check the address and your connection.",
    };
  }
}
