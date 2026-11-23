import { serve } from "@hono/node-server";

import { createApp } from "./app";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.WEB_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = createApp({ allowedOrigins });

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
