import {
  AI_PROVIDERS,
  type AiProvider,
  AiProvider as AiProviderSchema,
  type AiSettingsUpdate,
  type AiSettingsView,
} from "@drugreview/core";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

/** The AI settings as used by the server: includes the key, so it never goes to a client. */
export interface AiConfig {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  enabled: boolean;
  apiKey: string | null;
}

const Stored = z.object({
  provider: AiProviderSchema,
  model: z.string(),
  baseUrl: z.string(),
  enabled: z.boolean(),
  key: z.object({ salt: z.string(), iv: z.string(), tag: z.string(), data: z.string() }).optional(),
});
type Stored = z.infer<typeof Stored>;

const DEFAULTS: Stored = {
  provider: "anthropic",
  model: AI_PROVIDERS.anthropic.defaultModel,
  baseUrl: "",
  enabled: false,
};

type Env = Record<string, string | undefined>;

/**
 * AI provider settings, kept in a file on the server.
 *
 * A key entered on the admin page is encrypted (AES-256-GCM) with a key derived from the admin
 * token, so the file alone is useless, and it is only ever decrypted in memory. If the admin token
 * changes, the saved key can no longer be read and has to be entered again. Without an admin token
 * there is no panel and nothing can be saved. A key can also come from a server environment
 * variable, which needs no file at all and is the better choice for production.
 */
export class AiSettingsStore {
  constructor(
    private readonly file: string,
    private readonly adminToken: string | null,
    private readonly env: Env = process.env,
  ) {}

  private async read(): Promise<Stored> {
    try {
      return Stored.parse(JSON.parse(await readFile(this.file, "utf8")));
    } catch {
      return DEFAULTS;
    }
  }

  private decryptKey(stored: Stored): string | null {
    if (!stored.key || !this.adminToken) return null;
    try {
      const key = scryptSync(this.adminToken, Buffer.from(stored.key.salt, "base64"), 32);
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(stored.key.iv, "base64"));
      decipher.setAuthTag(Buffer.from(stored.key.tag, "base64"));
      return Buffer.concat([
        decipher.update(Buffer.from(stored.key.data, "base64")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      return null;
    }
  }

  private encryptKey(apiKey: string): NonNullable<Stored["key"]> {
    if (!this.adminToken) throw new Error("An admin token is needed to save a key.");
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", scryptSync(this.adminToken, salt, 32), iv);
    const data = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
    return {
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: data.toString("base64"),
    };
  }

  /** The settings with the key, for server code that calls the provider. Never send this out. */
  async config(): Promise<AiConfig> {
    const stored = await this.read();
    const envName = AI_PROVIDERS[stored.provider].envKey;
    const apiKey = this.decryptKey(stored) ?? (envName ? (this.env[envName] ?? null) : null);
    return {
      provider: stored.provider,
      model: stored.model,
      baseUrl: stored.baseUrl,
      enabled: stored.enabled,
      apiKey: apiKey || null,
    };
  }

  /** The settings as the admin page sees them: no key, only where it comes from and its tail. */
  async view(): Promise<AiSettingsView> {
    const stored = await this.read();
    const saved = this.decryptKey(stored);
    const envName = AI_PROVIDERS[stored.provider].envKey;
    const fromEnv = envName ? this.env[envName] : undefined;
    const key = saved ?? fromEnv ?? null;
    return {
      provider: stored.provider,
      model: stored.model,
      baseUrl: stored.baseUrl,
      enabled: stored.enabled,
      keySource: saved ? "saved" : fromEnv ? "env" : "none",
      keyHint: key ? `…${key.slice(-4)}` : "",
      canSaveKey: this.adminToken !== null,
    };
  }

  async save(update: AiSettingsUpdate): Promise<void> {
    const current = await this.read();
    // Changing provider drops a saved key: it belongs to the old one.
    const sameProvider = current.provider === update.provider;
    const key = update.apiKey
      ? this.encryptKey(update.apiKey)
      : sameProvider
        ? current.key
        : undefined;
    const next: Stored = {
      provider: update.provider,
      model: update.model,
      baseUrl: update.baseUrl,
      enabled: update.enabled,
      ...(key ? { key } : {}),
    };
    await mkdir(dirname(this.file), { recursive: true });
    const temp = `${this.file}.tmp`;
    await writeFile(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
    await chmod(temp, 0o600).catch(() => {});
    await rename(temp, this.file);
  }

  /** Whether a key exists for this provider, saved on the panel or set in the environment. */
  async keyAvailable(provider: AiProvider): Promise<boolean> {
    const stored = await this.read();
    if (stored.provider === provider && this.decryptKey(stored)) return true;
    const envName = AI_PROVIDERS[provider].envKey;
    return Boolean(envName && this.env[envName]);
  }

  /** Forget the saved key and switch the AI layer off. */
  async clear(): Promise<void> {
    await rm(this.file, { force: true });
  }
}
