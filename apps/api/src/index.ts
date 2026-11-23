import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { OpenFda } from "./sources/openfda";
import { RxNorm } from "./sources/rxnorm";
import type { DrugData } from "./sources/types";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.WEB_ORIGINS ?? "http://localhost:3000,http://localhost:8081")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const rxnorm = new RxNorm();
const openFda = new OpenFda(process.env.OPENFDA_API_KEY || undefined);

const data: DrugData = {
  searchNames: (query, limit) => rxnorm.searchNames(query, limit),
  resolve: (name) => rxnorm.resolve(name),
  ingredients: (rxcui) => rxnorm.ingredients(rxcui),
  label: (ingredient) => openFda.label(ingredient),
};

const app = createApp({ allowedOrigins, data });

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
