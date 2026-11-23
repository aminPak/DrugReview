import { InteractionCheckRequest, type InteractionCheckResult } from "@drugreview/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

export interface AppOptions {
  /** Browser origins allowed to call the API (the web app). Native mobile apps don't need CORS. */
  allowedOrigins: string[];
}

export function createApp({ allowedOrigins }: AppOptions) {
  const app = new Hono();

  app.use(logger());
  app.use(secureHeaders());
  app.use("/v1/*", cors({ origin: allowedOrigins }));

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.post("/v1/interactions/check", zValidator("json", InteractionCheckRequest), (c) => {
    // No clinical knowledge base is connected yet. Never answer "no interactions" without one.
    const result: InteractionCheckResult = {
      status: "unavailable",
      reason: "No interaction knowledge base is connected yet.",
    };
    return c.json(result, 503);
  });

  return app;
}
