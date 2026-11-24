import {
  type ClinicalRule,
  InteractionCheckResult,
  type ResolvedDrug,
  RULES,
} from "@drugreview/core";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";
import { type DrugData, type DrugLabel, UpstreamError } from "./sources/types";

const ingredients: Record<string, { rxcui: string; name: string }[]> = {
  "11289": [{ rxcui: "11289", name: "warfarin" }],
  "1191": [{ rxcui: "1191", name: "aspirin" }],
  "161": [{ rxcui: "161", name: "acetaminophen" }],
  "202433": [{ rxcui: "161", name: "acetaminophen" }], // Tylenol
  "999": [{ rxcui: "999", name: "unlabelled" }],
  "2551": [{ rxcui: "2551", name: "ciprofloxacin" }],
  "3640": [{ rxcui: "3640", name: "doxycycline" }],
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
  ciprofloxacin: {
    setId: "cipro-set",
    title: "Cipro",
    sections: {
      boxed_warning:
        "Fluoroquinolones may exacerbate muscle weakness in patients with myasthenia gravis. Avoid in patients with known history of myasthenia gravis.",
      warnings_and_cautions: "Use with caution in patients with renal impairment.",
    },
  },
  doxycycline: {
    setId: "doxy-set",
    title: "Doxycycline",
    sections: { warnings: "Photosensitivity has been observed with tetracyclines." },
  },
  "magnesium sulfate": {
    setId: "mgso4-set",
    title: "Magnesium Sulfate Injection",
    sections: {
      contraindications: "Do not use in heart block.",
    },
  },
};

/** A label that's only found by the targeted search (not among the newest labels). */
const extraLabels: DrugLabel[] = [
  {
    setId: "mgso4-dextrose-set",
    title: "Magnesium sulfate in dextrose",
    sections: { contraindications: "Contraindicated in patients with myasthenia gravis." },
  },
];

function fakeData(overrides: Partial<DrugData> = {}): DrugData {
  return {
    searchNames: async (q) => ["warfarin", "warfarin sodium"].filter((n) => n.startsWith(q)),
    resolve: async (name): Promise<ResolvedDrug | null> =>
      name.toLowerCase() === "warfarin"
        ? { rxcui: "11289", name: "warfarin", ingredients: ingredients["11289"]! }
        : null,
    ingredients: async (rxcui) => ingredients[rxcui] ?? [],
    searchProducts: async (q) =>
      q.toLowerCase().startsWith("tylenol")
        ? [
            {
              din: "00559393",
              name: "TYLENOL REGULAR STRENGTH",
              company: "KENVUE CANADA INC.",
              ingredients: [{ name: "acetaminophen", strength: "325 MG" }],
            },
          ]
        : [],
    resolveProduct: async (din) =>
      din === "00559393"
        ? {
            din,
            name: "TYLENOL REGULAR STRENGTH",
            ingredients: ingredients["161"]!,
            unmatched: [],
          }
        : null,
    labels: async (name) => (labels[name] ? [labels[name]] : []),
    labelsMentioning: async (name, terms, sections) =>
      [...extraLabels, ...(labels[name] ? [labels[name]] : [])].filter(
        (label) =>
          label.title.toLowerCase().includes(name) &&
          sections.some((s) => terms.some((t) => label.sections[s]?.toLowerCase().includes(t))),
      ),
    ...overrides,
  };
}

function appWith(data = fakeData(), rules?: readonly ClinicalRule[]) {
  return createApp({
    allowedOrigins: ["http://localhost:3000"],
    data,
    logRequests: false,
    ...(rules ? { rules } : {}),
  });
}

const warfarin = { kind: "medicine", name: "Warfarin", rxcui: "11289" };
const aspirin = { kind: "medicine", name: "Aspirin", rxcui: "1191" };
const ginkgo = { kind: "supplement", name: "Ginkgo biloba", supplementId: "ginkgo" };
const zinc = { kind: "supplement", name: "Zinc", supplementId: "zinc" };

async function check(
  items: unknown[],
  data?: DrugData,
  profile?: unknown,
  rules?: readonly ClinicalRule[],
) {
  const res = await appWith(data, rules).request("/v1/interactions/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile ? { items, profile } : { items }),
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

  it("searches Canadian products and resolves one by DIN", async () => {
    const found = await appWith().request("/v1/products/search?q=tylenol");
    expect(await found.json()).toEqual({
      results: [
        {
          din: "00559393",
          name: "TYLENOL REGULAR STRENGTH",
          company: "KENVUE CANADA INC.",
          ingredients: [{ name: "acetaminophen", strength: "325 MG" }],
        },
      ],
    });
    expect((await appWith().request("/v1/products/resolve?din=00559393")).status).toBe(200);
    expect((await appWith().request("/v1/products/resolve?din=00000000")).status).toBe(404);
    expect((await appWith().request("/v1/products/resolve?din=abc")).status).toBe(400);
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

  it("checks a Canadian product through its ingredients and cites the DPD", async () => {
    const tylenol = { kind: "medicine", name: "Tylenol Regular Strength", din: "00559393" };
    const { result } = await check([
      { kind: "medicine", name: "Acetaminophen", rxcui: "161" },
      tylenol,
    ]);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.findings).toEqual([
      { type: "same_ingredient", between: [0, 1], ingredient: "acetaminophen" },
    ]);
    expect(result.sources.map((s) => s.name)).toContain("Drug Product Database, Health Canada");
  });

  it("lists a DIN the database no longer knows as not checked, never as clear", async () => {
    const { result } = await check([warfarin, { kind: "medicine", name: "Gone", din: "99999999" }]);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.unchecked).toEqual([{ between: [0, 1], reason: "label_not_found" }]);
  });

  it("rejects a medicine with neither an RxNorm ID nor a DIN", async () => {
    const res = await appWith().request("/v1/interactions/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [warfarin, { kind: "medicine", name: "Mystery" }] }),
    });
    expect(res.status).toBe(400);
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
      labels: async () => {
        throw new UpstreamError("openFDA", "HTTP 500");
      },
    });
    const { status, result } = await check([warfarin, ginkgo], failing);
    expect(status).toBe(503);
    expect(result.status).toBe("unavailable");
  });
});

describe("health profile", () => {
  const cipro = { kind: "medicine", name: "Ciprofloxacin", rxcui: "2551" };
  const magnesium = { kind: "supplement", name: "Magnesium", supplementId: "magnesium" };
  const mg = { conditions: [{ id: "myasthenia-gravis" }] };

  it("allows one item when the profile has a condition", async () => {
    const { status } = await check([cipro], undefined, mg);
    expect(status).toBe(200);
  });

  it("flags a boxed warning about the person's condition", async () => {
    const { result } = await check([cipro], undefined, mg);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.findings).toEqual([
      {
        type: "condition_caution",
        item: 0,
        condition: 0,
        section: "boxed_warning",
        excerpt:
          "Fluoroquinolones may exacerbate muscle weakness in patients with myasthenia gravis.",
        source: {
          name: "Cipro label (DailyMed)",
          url: "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=cipro-set",
        },
      },
    ]);
  });

  it("finds a condition warning on any label of a supplement's medicine form", async () => {
    const { result } = await check([magnesium], undefined, mg);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.findings[0]).toMatchObject({
      type: "condition_caution",
      item: 0,
      viaIngredient: "magnesium sulfate",
      section: "contraindications",
      excerpt: "Contraindicated in patients with myasthenia gravis.",
    });
  });

  it("searches labels for a condition typed in by the person", async () => {
    const { result } = await check([cipro], undefined, {
      conditions: [{ custom: "renal impairment" }],
    });
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ section: "warnings_and_cautions" });
  });

  describe("clinically reviewed rules", () => {
    const doxy = { kind: "medicine", name: "Doxycycline", rxcui: "3640" };
    const signed = (rule: ClinicalRule): ClinicalRule => ({
      ...rule,
      reviewedBy: "Test Reviewer, RPh",
      reviewedAt: "2026-11-22",
    });

    it("never shows the shipped drafts", async () => {
      const { result } = await check([doxy, magnesium], undefined, mg);
      if (result.status !== "checked") throw new Error("expected checked");
      expect(result.findings.filter((f) => f.type === "reviewed_rule")).toEqual([]);
      // Doxycycline's label doesn't mention myasthenia gravis, so it's listed as nothing found.
      expect(result.findings.some((f) => "item" in f && f.item === 0)).toBe(false);
    });

    it("shows a rule, with its citations, once it is marked reviewed", async () => {
      const rules = RULES.map((r) => (r.id === "magnesium-myasthenia-gravis" ? signed(r) : r));
      const { result } = await check([doxy, magnesium], undefined, mg, rules);
      if (result.status !== "checked") throw new Error("expected checked");
      const ruleFindings = result.findings.filter((f) => f.type === "reviewed_rule");
      expect(ruleFindings).toHaveLength(1);
      const finding = ruleFindings[0]!;
      expect(finding).toMatchObject({
        item: 1,
        condition: 0,
        rule: { id: "magnesium-myasthenia-gravis", version: 1 },
        reviewedBy: "Test Reviewer, RPh",
        reviewedAt: "2026-11-22",
      });
      expect(finding.citations.length).toBeGreaterThan(0);
      for (const citation of finding.citations) {
        expect(result.sources).toContainEqual(citation);
      }
    });

    it("doesn't publish a signed rule that has no statement or citation", async () => {
      // The tetracycline draft has no supporting source yet, so signing it isn't enough.
      const { result } = await check([doxy], undefined, mg, RULES.map(signed));
      if (result.status !== "checked") throw new Error("expected checked");
      expect(result.findings).toEqual([]);
    });
  });

  it("lists items it couldn't check against the conditions", async () => {
    const { result } = await check([cipro, ginkgo], undefined, mg);
    if (result.status !== "checked") throw new Error("expected checked");
    expect(result.uncheckedForConditions).toEqual([1]);
  });
});
