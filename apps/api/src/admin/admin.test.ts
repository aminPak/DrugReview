import { AiSettingsView } from "@drugreview/core";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app";
import type { DrugData } from "../sources/types";
import { AiSettingsStore } from "./ai-settings";

const TOKEN = "a-long-random-admin-token-for-tests";
const SECRET_KEY = "sk-test-1234567890abcdef-SECRETVALUE";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "drugreview-admin-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function setup(
  options: { token?: string | null; env?: Record<string, string>; fetchImpl?: typeof fetch } = {},
) {
  const token = options.token === undefined ? TOKEN : options.token;
  const file = join(dir, "ai-settings.json");
  const store = new AiSettingsStore(file, token, options.env ?? {});
  const app = createApp({
    allowedOrigins: ["http://localhost:3000"],
    data: {} as DrugData,
    logRequests: false,
    admin: { token, store, ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}) },
  });
  const call = (path: string, init: RequestInit = {}, auth: string | null = `Bearer ${TOKEN}`) =>
    app.request(`/admin${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
    });
  return { call, file, store };
}

const save = (body: object) => ({ method: "PUT", body: JSON.stringify(body) });
const anthropic = { provider: "anthropic", model: "claude-opus-5-5", baseUrl: "", enabled: true };

describe("admin access", () => {
  it("doesn't exist without an admin token", async () => {
    expect((await setup({ token: null }).call("/ai")).status).toBe(404);
  });

  it("doesn't exist with a token that is too short", async () => {
    expect((await setup({ token: "short" }).call("/ai", {}, "Bearer short")).status).toBe(404);
  });

  it("rejects a missing or wrong token", async () => {
    const { call } = setup();
    expect((await call("/ai", {}, null)).status).toBe(401);
    expect((await call("/ai", {}, "Bearer nope")).status).toBe(401);
    expect((await call("/ai", {}, `Bearer ${TOKEN}x`)).status).toBe(401);
  });

  it("is never cached", async () => {
    expect((await setup().call("/ai")).headers.get("cache-control")).toBe("no-store");
  });
});

describe("AI settings", () => {
  it("starts switched off with Anthropic's default model", async () => {
    const view = AiSettingsView.parse(await (await setup().call("/ai")).json());
    expect(view).toMatchObject({ provider: "anthropic", enabled: false, keySource: "none" });
    expect(view.model).toBe("claude-opus-5-5");
  });

  it("saves a key encrypted, and never returns it", async () => {
    const { call, file } = setup();
    const res = await call("/ai", save({ ...anthropic, apiKey: SECRET_KEY }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain(SECRET_KEY);
    expect(AiSettingsView.parse(JSON.parse(text))).toMatchObject({
      keySource: "saved",
      keyHint: `…${SECRET_KEY.slice(-4)}`,
      enabled: true,
    });
    expect(await readFile(file, "utf8")).not.toContain(SECRET_KEY);
    expect(await (await call("/ai")).text()).not.toContain(SECRET_KEY);
  });

  it("keeps the saved key when the key is left out", async () => {
    const { call, store } = setup();
    await call("/ai", save({ ...anthropic, apiKey: SECRET_KEY }));
    await call("/ai", save({ ...anthropic, model: "claude-haiku-5-5" }));
    expect(await store.config()).toMatchObject({ apiKey: SECRET_KEY, model: "claude-haiku-5-5" });
  });

  it("drops a saved key when the provider changes", async () => {
    const { call, store } = setup();
    await call("/ai", save({ ...anthropic, apiKey: SECRET_KEY }));
    await call("/ai", save({ provider: "openai", model: "m", baseUrl: "", enabled: false }));
    expect((await store.config()).apiKey).toBeNull();
  });

  it("can't read a saved key once the admin token changes", async () => {
    const { call, file } = setup();
    await call("/ai", save({ ...anthropic, apiKey: SECRET_KEY }));
    const other = new AiSettingsStore(file, "a-different-admin-token-123456", {});
    expect((await other.view()).keySource).toBe("none");
  });

  it("refuses to switch on without a key", async () => {
    const res = await setup().call("/ai", save(anthropic));
    expect(res.status).toBe(400);
  });

  it("uses a key from the environment and says so", async () => {
    const { call, store } = setup({ env: { ANTHROPIC_API_KEY: "env-key-abcdef-WXYZ" } });
    const res = await call("/ai", save(anthropic));
    expect(res.status).toBe(200);
    expect(AiSettingsView.parse(await res.json())).toMatchObject({
      keySource: "env",
      keyHint: "…WXYZ",
    });
    expect((await store.config()).apiKey).toBe("env-key-abcdef-WXYZ");
  });

  it("requires an https address for another provider", async () => {
    const other = { provider: "openai-compatible", model: "m", enabled: false };
    const { call } = setup();
    expect((await call("/ai", save({ ...other, baseUrl: "http://example.com/v1" }))).status).toBe(
      400,
    );
    expect((await call("/ai", save({ ...other, baseUrl: "nonsense" }))).status).toBe(400);
    expect((await call("/ai", save({ ...other, baseUrl: "https://example.com/v1" }))).status).toBe(
      200,
    );
    expect(
      (await call("/ai", save({ ...other, baseUrl: "http://localhost:11434/v1" }))).status,
    ).toBe(200);
  });

  it("clears the settings", async () => {
    const { call } = setup();
    await call("/ai", save({ ...anthropic, apiKey: SECRET_KEY }));
    const view = AiSettingsView.parse(await (await call("/ai", { method: "DELETE" })).json());
    expect(view).toMatchObject({ enabled: false, keySource: "none" });
  });
});

describe("connection test", () => {
  it("calls Anthropic with the key and reports success without echoing the key", async () => {
    const calls: { url: string; headers: Headers }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, headers: new Headers(init.headers) });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const { call } = setup({ fetchImpl });
    await call("/ai", save({ ...anthropic, apiKey: SECRET_KEY }));
    const res = await call("/ai/test", { method: "POST" });
    const body = await res.text();
    expect(JSON.parse(body)).toMatchObject({ ok: true });
    expect(body).not.toContain(SECRET_KEY);
    expect(calls[0]?.url).toBe("https://api.anthropic.com/v1/messages");
    expect(calls[0]?.headers.get("x-api-key")).toBe(SECRET_KEY);
  });

  it("calls an OpenAI-compatible address with a bearer key", async () => {
    const calls: { url: string; headers: Headers }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, headers: new Headers(init.headers) });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const { call } = setup({ fetchImpl });
    await call(
      "/ai",
      save({
        provider: "openai-compatible",
        model: "llama3",
        baseUrl: "https://example.com/v1/",
        enabled: true,
        apiKey: SECRET_KEY,
      }),
    );
    await call("/ai/test", { method: "POST" });
    expect(calls[0]?.url).toBe("https://example.com/v1/chat/completions");
    expect(calls[0]?.headers.get("authorization")).toBe(`Bearer ${SECRET_KEY}`);
  });

  it("explains a rejected key and an unreachable provider", async () => {
    const rejected = setup({
      fetchImpl: (async () => new Response("", { status: 401 })) as unknown as typeof fetch,
    });
    await rejected.call("/ai", save({ ...anthropic, apiKey: SECRET_KEY }));
    expect(await (await rejected.call("/ai/test", { method: "POST" })).json()).toMatchObject({
      ok: false,
      message: expect.stringContaining("rejected"),
    });
  });

  it("says when there is no key", async () => {
    expect(await (await setup().call("/ai/test", { method: "POST" })).json()).toEqual({
      ok: false,
      message: "No API key yet.",
    });
  });
});
