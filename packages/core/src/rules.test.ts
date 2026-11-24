import { describe, expect, it } from "vitest";

import { getCondition } from "./conditions";
import { type ClinicalRule, isPublished, matchingRules, RULES } from "./rules";
import { getSupplement } from "./supplements";

const magnesium = RULES.find((r) => r.id === "magnesium-myasthenia-gravis")!;
const reviewed: ClinicalRule = {
  ...magnesium,
  reviewedBy: "Test Reviewer",
  reviewedAt: "2026-11-22",
};

describe("clinically reviewed rules", () => {
  it("are well formed", () => {
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
    for (const rule of RULES) {
      expect(getCondition(rule.condition), rule.id).toBeDefined();
      expect(Number.isInteger(rule.version) && rule.version > 0).toBe(true);
      for (const id of rule.match.supplementIds ?? []) expect(getSupplement(id), id).toBeDefined();
      for (const c of rule.citations) expect(c.url).toMatch(/^https:\/\//);
    }
  });

  it("ships no draft: every seeded rule is still unreviewed", () => {
    expect(RULES.filter(isPublished)).toEqual([]);
    expect(
      matchingRules({ ingredients: [], supplementId: "magnesium" }, "myasthenia-gravis"),
    ).toEqual([]);
    expect(matchingRules({ ingredients: ["doxycycline"] }, "myasthenia-gravis")).toEqual([]);
  });

  it("shows a draft only once it is marked reviewed", () => {
    expect(
      matchingRules({ ingredients: [], supplementId: "magnesium" }, "myasthenia-gravis", [
        magnesium,
      ]),
    ).toEqual([]);
    expect(
      matchingRules({ ingredients: [], supplementId: "magnesium" }, "myasthenia-gravis", [
        reviewed,
      ]),
    ).toEqual([reviewed]);
    expect(
      matchingRules({ ingredients: ["magnesium oxide"] }, "myasthenia-gravis", [reviewed]),
    ).toHaveLength(1);
    expect(
      matchingRules({ ingredients: [], supplementId: "magnesium" }, "epilepsy", [reviewed]),
    ).toEqual([]);
  });

  it("needs a reviewer, a valid date, a statement and a citation", () => {
    expect(isPublished({ ...reviewed, reviewedBy: "  " })).toBe(false);
    expect(isPublished({ ...reviewed, reviewedAt: "yesterday" })).toBe(false);
    expect(isPublished({ ...reviewed, statement: null })).toBe(false);
    expect(isPublished({ ...reviewed, citations: [] })).toBe(false);
    // The tetracycline draft has no supporting source, so signing it alone doesn't publish it.
    const tetracyclines = RULES.find((r) => r.id === "tetracyclines-myasthenia-gravis")!;
    expect(isPublished({ ...tetracyclines, reviewedBy: "X", reviewedAt: "2026-11-22" })).toBe(
      false,
    );
  });
});
