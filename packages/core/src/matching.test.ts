import { describe, expect, it } from "vitest";

import {
  findMention,
  getSupplement,
  searchSupplements,
  supplementMatchOptions,
  supplementTerms,
} from "./index";

const warfarinLabel =
  "7.3 Botanical (Herbal) Products. Some botanicals may cause bleeding events when taken alone (e.g., garlic and Ginkgo biloba) and may have anticoagulant properties. Concomitant use with St. John’s Wort may reduce effect.";

describe("findMention", () => {
  it("returns the sentence that mentions a term, case-insensitively", () => {
    expect(findMention(warfarinLabel, ["ginkgo biloba", "ginkgo"])).toBe(
      "Some botanicals may cause bleeding events when taken alone (e.g., garlic and Ginkgo biloba) and may have anticoagulant properties.",
    );
  });

  it("handles curly apostrophes in labels", () => {
    const terms = supplementTerms(getSupplement("st-johns-wort")!);
    expect(findMention(warfarinLabel, terms)).toContain("St. John's Wort");
  });

  it("matches whole words only", () => {
    expect(findMention("Monitor the environment closely.", ["iron"])).toBeNull();
    expect(findMention("Take iron 2 hours apart.", ["iron"])).toBe("Take iron 2 hours apart.");
  });

  it("skips matches followed by an ignored word", () => {
    const calcium = getSupplement("calcium")!;
    const options = { ignoreWhenFollowedBy: calcium.ignoreWhenFollowedBy ?? [] };
    expect(
      findMention(
        "Use with calcium channel blockers may lower blood pressure.",
        supplementTerms(calcium),
        options,
      ),
    ).toBeNull();
    expect(
      findMention("Calcium supplements reduce absorption.", supplementTerms(calcium), options),
    ).toBe("Calcium supplements reduce absorption.");
  });

  it("finds minerals in the group phrases labels use", () => {
    const terms = supplementTerms(getSupplement("magnesium")!);
    expect(
      findMention("Administer at least 2 hours before magnesium/aluminum antacids.", terms),
    ).not.toBeNull();
    expect(
      findMention("Decreased absorption with multivalent cation-containing products.", terms),
    ).not.toBeNull();
    expect(findMention("Serum magnesium levels were measured.", terms)).toBeNull();
  });

  it("finds a mineral named in a list of antacid ingredients", () => {
    const tetracycline =
      "Absorption of tetracyclines is impaired by antacids containing aluminum, calcium, or magnesium, and iron-containing preparations.";
    for (const id of ["magnesium", "calcium"]) {
      const supplement = getSupplement(id)!;
      expect(
        findMention(tetracycline, supplementTerms(supplement), supplementMatchOptions(supplement)),
      ).toBe(tetracycline);
    }
    const zinc = getSupplement("zinc")!;
    expect(
      findMention(
        "Avoid antacids such as products containing calcium and zinc.",
        supplementTerms(zinc),
        supplementMatchOptions(zinc),
      ),
    ).not.toBeNull();
  });

  it("doesn't treat lab values listed together as products", () => {
    const magnesium = getSupplement("magnesium")!;
    for (const text of [
      "Monitor serum calcium and magnesium during treatment.",
      "Electrolytes (potassium, calcium, magnesium) should be corrected first.",
    ]) {
      expect(
        findMention(text, supplementTerms(magnesium), supplementMatchOptions(magnesium)),
      ).toBeNull();
    }
  });

  it("ignores terms too short to search safely", () => {
    expect(findMention("It is the same as before.", ["sa"])).toBeNull();
  });
});

describe("searchSupplements", () => {
  it("puts names starting with the query first", () => {
    expect(searchSupplements("gin").map((s) => s.id)).toEqual(["ginger", "ginkgo", "ginseng"]);
  });

  it("finds supplements by alias", () => {
    expect(searchSupplements("hyperic").map((s) => s.id)).toEqual(["st-johns-wort"]);
  });

  it("never matches SAMe on the ordinary word 'same'", () => {
    expect(
      findMention("It is the same as before.", supplementTerms(getSupplement("same")!)),
    ).toBeNull();
  });
});
