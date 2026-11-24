import { serve } from "@hono/node-server";
import { join } from "node:path";

import { AiSettingsStore } from "./admin/ai-settings";
import { createApp } from "./app";
import { Dpd } from "./sources/dpd";
import { OpenFda, OpenFdaSearch } from "./sources/openfda";
import { RxNorm } from "./sources/rxnorm";
import type { DrugData } from "./sources/types";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.WEB_ORIGINS ?? "http://localhost:3000,http://localhost:8081")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const rxnorm = new RxNorm();
const openFdaKey = process.env.OPENFDA_API_KEY || undefined;
const openFda = new OpenFda(openFdaKey);
const openFdaSearch = new OpenFdaSearch(openFdaKey);

const dpd = new Dpd(rxnorm);

const data: DrugData = {
  searchNames: (query, limit) => rxnorm.searchNames(query, limit),
  resolve: (name) => rxnorm.resolve(name),
  searchProducts: (query, limit) => dpd.searchProducts(query, limit),
  resolveProduct: (din) => dpd.resolveProduct(din),
  ingredients: (rxcui) => rxnorm.ingredients(rxcui),
  labels: (ingredient) => openFda.labels(ingredient),
  labelsMentioning: (ingredient, terms, sections) =>
    openFdaSearch.labelsMentioning(ingredient, terms, sections),
};

// The admin area (AI provider settings) exists only when ADMIN_TOKEN is set.
const adminToken = process.env.ADMIN_TOKEN || null;
const dataDir = process.env.DATA_DIR || "data";
const admin = {
  token: adminToken,
  store: new AiSettingsStore(join(dataDir, "ai-settings.json"), adminToken),
};

const app = createApp({ allowedOrigins, data, admin });

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
