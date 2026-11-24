import { describe, expect, it } from "vitest";

import {
  canRunCheck,
  CONDITIONS,
  findMention,
  getCondition,
  InteractionCheckRequest,
  searchConditions,
} from "./index";

describe("conditions", () => {
  it("has unique ids and search phrases long enough to match safely", () => {
    expect(new Set(CONDITIONS.map((c) => c.id)).size).toBe(CONDITIONS.length);
    for (const condition of CONDITIONS) {
      expect(condition.searchTerms.length).toBeGreaterThan(0);
      for (const term of condition.searchTerms) expect(term.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("finds conditions by name or alias", () => {
    expect(searchConditions("myasth").map((c) => c.id)).toEqual(["myasthenia-gravis"]);
    expect(searchConditions("ckd").map((c) => c.id)).toEqual(["kidney-disease"]);
  });

  it("matches the way labels describe myasthenia gravis", () => {
    const terms = getCondition("myasthenia-gravis")!.searchTerms;
    expect(
      findMention(
        "Fluoroquinolones may exacerbate muscle weakness in patients with myasthenia gravis.",
        terms,
      ),
    ).not.toBeNull();
  });
});

describe("quoting headings", () => {
  it("includes the sentence after a heading that ends with a colon", () => {
    expect(
      findMention(
        "Pregnant Women: Ciprofloxacin crosses the placenta. Other text.",
        getCondition("pregnancy")!.searchTerms,
      ),
    ).toBe("Pregnant Women: Ciprofloxacin crosses the placenta.");
  });
});

describe("check request with a health profile", () => {
  const cipro = { kind: "medicine", name: "Ciprofloxacin", rxcui: "2551" } as const;

  it("accepts one item when there is a condition to check it against", () => {
    expect(
      InteractionCheckRequest.safeParse({
        items: [cipro],
        profile: { conditions: [{ id: "myasthenia-gravis" }] },
      }).success,
    ).toBe(true);
    expect(canRunCheck(1, 1)).toBe(true);
  });

  it("rejects one item with no conditions", () => {
    expect(InteractionCheckRequest.safeParse({ items: [cipro] }).success).toBe(false);
    expect(canRunCheck(1, 0)).toBe(false);
  });

  it("accepts a condition the person typed in", () => {
    expect(
      InteractionCheckRequest.safeParse({
        items: [cipro],
        profile: { conditions: [{ custom: "Lambert-Eaton syndrome" }] },
      }).success,
    ).toBe(true);
  });
});
