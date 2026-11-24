import { AiSettingsUpdate } from "@drugreview/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { timingSafeEqual } from "node:crypto";

import { baseUrlProblem, testAiConnection } from "./ai-test";
import type { AiSettingsStore } from "./ai-settings";

/** Shorter tokens are too easy to guess, so the admin area stays off. */
export const MIN_ADMIN_TOKEN_LENGTH = 24;

export interface AdminOptions {
  /** The secret the admin page sends as a bearer token. Null or too short turns the area off. */
  token: string | null;
  store: AiSettingsStore;
  allowedOrigins: string[];
  fetchImpl?: typeof fetch;
}

function sameToken(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The admin area. Everything is behind one secret (`ADMIN_TOKEN`). Without it the area answers
 * 404 as if it didn't exist. The AI key is write-only: nothing here ever returns it.
 */
export function adminRoutes({ token, store, allowedOrigins, fetchImpl }: AdminOptions) {
  const admin = new Hono();
  admin.use(
    cors({
      origin: allowedOrigins,
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    }),
  );

  admin.use(async (c, next) => {
    if (!token || token.length < MIN_ADMIN_TOKEN_LENGTH) return c.json({ error: "not_found" }, 404);
    if (c.req.method === "OPTIONS") return next();
    const header = c.req.header("Authorization") ?? "";
    const given = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!given || !sameToken(given, token)) return c.json({ error: "unauthorized" }, 401);
    c.header("Cache-Control", "no-store");
    return next();
  });

  admin.get("/ai", async (c) => c.json(await store.view()));

  admin.put("/ai", zValidator("json", AiSettingsUpdate), async (c) => {
    const update = c.req.valid("json");
    if (update.provider === "openai-compatible") {
      const problem = baseUrlProblem(update.baseUrl);
      if (problem) return c.json({ error: "invalid_base_url", message: problem }, 400);
    }
    if (update.enabled && !update.apiKey && !(await store.keyAvailable(update.provider))) {
      return c.json(
        { error: "key_required", message: "Add an API key before turning this on." },
        400,
      );
    }
    if (update.apiKey && !(await store.view()).canSaveKey) {
      return c.json({ error: "cannot_save_key" }, 400);
    }
    await store.save(update);
    return c.json(await store.view());
  });

  admin.post("/ai/test", async (c) =>
    c.json(await testAiConnection(await store.config(), fetchImpl)),
  );

  admin.delete("/ai", async (c) => {
    await store.clear();
    return c.json(await store.view());
  });

  return admin;
}
