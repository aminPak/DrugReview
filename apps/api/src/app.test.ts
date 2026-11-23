import { InteractionCheckResult, type ResolvedDrug } from "@drugreview/core";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";
import { type DrugData, type DrugLabel, UpstreamError } from "./sources/types";

const ingredients: Record<string, { rxcui: string; name: string }[]> = {
  "11289": [{ rxcui: "11289", name: "warfarin" }],
  "1191": [{ rxcui: "1191", name: "aspirin" }],
  "161": [{ rxcui: "161", name: "acetaminophen" }],
  "202433": [{ rxcui: "161", name: "acetaminophen" }], // Tylenol
  "999": [{ rxcui: "999", name: "unlabelled" }],
};

const labels: Record<string, DrugLabel> = {
  warfarin: {
    setId: "warfarin-set",
    title: "Coumadin",
    sections: {
      boxed_warning: "Warfarin can cause major or fatal bleeding.",
      drug_interactions:
        "Some botanicals may cause bleeding events when taken alone (e.g., garlic and Ginkgo biloba). Drugs that increase bleeding risk include aspirin.",
    },
  },
  aspirin: {
    setId: "aspirin-set",
    title: "Aspirin",
    sections: {
      ask_doctor_or_pharmacist: "Ask a doctor before use if you are taking a blood thinner.",
    },
  },
  acetaminophen: {
    setId: "apap-set",
    title: "Acetaminophen",
    sections: { warnings: "Do not use with any other drug containing acetaminophen." },
  },
};

function fakeData(overrides: Partial<DrugData> = {}): DrugData {
  return {
    searchNames: async (q) => ["warfarin", "warfarin sodium"].filter((n) => n.startsWith(q)),
    resolve: async (name): Promise<ResolvedDrug | null> =>
      name.toLowerCase() === "warfarin"
        ? { rxcui: "11289", name: "warfarin", ingredients: ingredients["11289"]! }
        : null,
    ingredients: async (rxcui) => ingredients[rxcui] ?? [],
    label: async (name) => labels[name] ?? null,
    ...overrides,
  };
}

function appWith(data = fakeData()) {
  return createApp({ allowedOrigins: ["http://localhost:3000"], data, logRequests: false });
}

const warfarin = { kind: "medicine", name: "Warfarin", rxcui: "11289" };
const aspirin = { kind: "medicine", name: "Aspirin", rxcui: "1191" };
const ginkgo = { kind: "supplement", name: "Ginkgo biloba", supplementId: "ginkgo" };
const zinc = { kind: "supplement", name: "Zinc", supplementId: "zinc" };

async function check(items: unknown[], data?: DrugData) {
  const res = await appWith(data).request("/v1/interactions/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return { status: res.status, result: InteractionCheckResult.parse(await res.json()) };
}

describe("health and search", () => {
  it("reports health", async () => {
    const res = await appWith().request("/health");
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("searches drug names", async () => {
    const res = await appWith().request("/v1/drugs/search?q=warf");
    expect(await res.json()).toEqual({ results: ["warfarin", "warfarin sodium"] });
  });

  it("resolves a known name and 404s an unknown one", async () => {
    expect((await appWith().request("/v1/drugs/resolve?name=Warfarin")).status).toBe(200);
    expect((await appWith().request("/v1/drugs/resolve?name=nope")).status).toBe(404);
  });

  it("allows the website's origin", async () => {
    const res = await appWith().request("/v1/drugs/search?q=wa", {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
  });
});

describe("interaction check", () => {
  it("rejects a list with fewer than two items", async () => {
    const res = await appWith().request("/v1/interactions/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [warfarin] }),
    });
    expect(res.status).toBe(400);
  });

  it("quotes the label sentence that mentions a supplement, with its section and source", async () => {
    const { status, result } = await check([warfarin, ginkgo]);
    expect(status).toBe(200);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.findings).toEqual([
      {
        type: "label_mention",
        between: [0, 1],
        labelOf: 0,
        section: "drug_interactions",
        excerpt:
          "Some botanicals may cause bleeding events when taken alone (e.g., garlic and Ginkgo biloba).",
        source: {
          name: "Coumadin label (DailyMed)",
          url: "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=warfarin-set",
        },
      },
    ]);
    expect(result.checkedPairs).toBe(1);
  });

  it("checks both labels of a medicine pair", async () => {
    const { result } = await check([warfarin, aspirin]);
    if (result.status !== "checked") throw new Error("expected checked");
    // Warfarin's label names aspirin; aspirin's label only says "blood thinner", so no match there.
    expect(result.findings.map((f) => f.type === "label_mention" && f.labelOf)).toEqual([0]);
  });

  it("flags two products with the same active ingredient", async () => {
    const { result } = await check([
      { kind: "medicine", name: "Acetaminophen", rxcui: "161" },
      { kind: "medicine", name: "Tylenol", rxcui: "202433" },
    ]);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.findings).toEqual([
      { type: "same_ingredient", between: [0, 1], ingredient: "acetaminophen" },
    ]);
  });

  it("lists pairs it couldn't check instead of calling them safe", async () => {
    const { result } = await check([ginkgo, zinc, { kind: "medicine", name: "X", rxcui: "999" }]);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.findings).toEqual([]);
    expect(result.checkedPairs).toBe(0);
    expect(result.unchecked).toEqual([
      { between: [0, 1], reason: "no_label_source" },
      { between: [0, 2], reason: "label_not_found" },
      { between: [1, 2], reason: "label_not_found" },
    ]);
  });

  it("answers 'unavailable' when a data source fails", async () => {
    const failing = fakeData({
      label: async () => {
        throw new UpstreamError("openFDA", "HTTP 500");
      },
    });
    const { status, result } = await check([warfarin, ginkgo], failing);
    expect(status).toBe(503);
    expect(result.status).toBe("unavailable");
  });
});
