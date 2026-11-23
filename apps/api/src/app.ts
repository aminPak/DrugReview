import { InteractionCheckRequest } from "@drugreview/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";

import { checkInteractions } from "./check";
import { type DrugData, UpstreamError } from "./sources/types";

export interface AppOptions {
  /** Browser origins allowed to call the API (the website). Native mobile apps don't need CORS. */
  allowedOrigins: string[];
  data: DrugData;
  /** Set to false to silence request logs (tests). */
  logRequests?: boolean;
}

const SEARCH_LIMIT = 10;

export function createApp({ allowedOrigins, data, logRequests = true }: AppOptions) {
  const app = new Hono();

  // Log method, path and status only. Query strings and bodies contain drug names, which are
  // health information, so they are never logged.
  if (logRequests) {
    app.use(async (c, next) => {
      const start = Date.now();
      await next();
      console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - start}ms`);
    });
  }
  app.use(secureHeaders());
  app.use("/v1/*", cors({ origin: allowedOrigins }));

  app.onError((error, c) => {
    if (error instanceof UpstreamError) {
      console.error(error.message);
      return c.json({ error: "upstream_unavailable" }, 502);
    }
    console.error(error);
    return c.json({ error: "internal_error" }, 500);
  });

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.get(
    "/v1/drugs/search",
    zValidator("query", z.object({ q: z.string().max(100) })),
    async (c) => {
      const { q } = c.req.valid("query");
      return c.json({ results: await data.searchNames(q, SEARCH_LIMIT) });
    },
  );

  app.get(
    "/v1/drugs/resolve",
    zValidator("query", z.object({ name: z.string().trim().min(1).max(200) })),
    async (c) => {
      const drug = await data.resolve(c.req.valid("query").name);
      return drug ? c.json(drug) : c.json({ error: "not_found" }, 404);
    },
  );

  app.post("/v1/interactions/check", zValidator("json", InteractionCheckRequest), async (c) => {
    const { items, profile } = c.req.valid("json");
    const result = await checkInteractions(items, data, profile);
    return c.json(result, result.status === "checked" ? 200 : 503);
  });

  return app;
}
