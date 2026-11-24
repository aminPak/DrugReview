import { z } from "zod";

/**
 * Settings for the optional AI layer (plain-language explanations, planned for v2). An admin sets
 * them on the website's /admin page. The key itself never leaves the API: the apps only ever see
 * a hint of its last characters.
 */

export const AiProvider = z.enum(["anthropic", "openai", "openai-compatible"]);
export type AiProvider = z.infer<typeof AiProvider>;

export const AI_PROVIDERS: Record<
  AiProvider,
  {
    label: string;
    defaultModel: string;
    needsBaseUrl: boolean;
    envKey: string | null;
    hint: string;
  }
> = {
  anthropic: {
    label: "Anthropic (Claude)",
    defaultModel: "claude-opus-5-5",
    needsBaseUrl: false,
    envKey: "ANTHROPIC_API_KEY",
    hint: "Create a key in the Anthropic Console.",
  },
  openai: {
    label: "OpenAI",
    defaultModel: "",
    needsBaseUrl: false,
    envKey: "OPENAI_API_KEY",
    hint: "Create a key on the OpenAI platform, then enter the model name you want to use.",
  },
  "openai-compatible": {
    label: "Other (OpenAI-compatible)",
    defaultModel: "",
    needsBaseUrl: true,
    envKey: null,
    hint: "Any service with an OpenAI-style chat completions API: Azure OpenAI, OpenRouter, Together, a local Ollama or vLLM server and others.",
  },
};

/** Where the API key comes from. "env" means a server environment variable, set outside the panel. */
export const KeySource = z.enum(["none", "saved", "env"]);
export type KeySource = z.infer<typeof KeySource>;

/** What the admin page may read: everything except the key. */
export const AiSettingsView = z.object({
  provider: AiProvider,
  model: z.string(),
  baseUrl: z.string(),
  enabled: z.boolean(),
  keySource: KeySource,
  /** The last four characters of the key, e.g. "…a1b2". Empty when there is no key. */
  keyHint: z.string(),
  /** Whether the server can encrypt a key to save it (it needs the admin token to be set). */
  canSaveKey: z.boolean(),
});
export type AiSettingsView = z.infer<typeof AiSettingsView>;

/** What the admin page sends. Leave `apiKey` out to keep the key already saved. */
export const AiSettingsUpdate = z.object({
  provider: AiProvider,
  model: z.string().trim().max(100),
  baseUrl: z.string().trim().max(300).default(""),
  enabled: z.boolean(),
  apiKey: z.string().trim().min(8).max(500).optional(),
});
export type AiSettingsUpdate = z.infer<typeof AiSettingsUpdate>;

export const AiTestResult = z.object({ ok: z.boolean(), message: z.string() });
export type AiTestResult = z.infer<typeof AiTestResult>;
