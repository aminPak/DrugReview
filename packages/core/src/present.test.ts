import { describe, expect, it } from "vitest";

import {
  type CabinetItem,
  type Finding,
  findingTitle,
  getMessages,
  isSupplementName,
  quietPairs,
  sortFindings,
} from "./index";

const mention: Finding = {
  type: "label_mention",
  between: [0, 1],
  labelOf: 0,
  section: "drug_interactions",
  excerpt: "",
  source: { name: "", url: "https://example.org" },
};

describe("presentation helpers", () => {
  it("lists checked pairs with nothing found", () => {
    expect(
      quietPairs(
        3,
        [{ type: "same_ingredient", between: [0, 1], ingredient: "x" }],
        [{ between: [1, 2], reason: "no_label_source" }],
      ),
    ).toEqual([{ between: [0, 2] }]);
  });

  it("puts same-ingredient findings before label mentions", () => {
    const same: Finding = { type: "same_ingredient", between: [0, 1], ingredient: "x" };
    expect(sortFindings([mention, same])[0]).toBe(same);
  });

  it("names the label and the other item", () => {
    const items: CabinetItem[] = [
      { kind: "medicine", name: "warfarin", rxcui: "1" },
      { kind: "supplement", name: "Ginkgo biloba", supplementId: "ginkgo" },
    ];
    expect(findingTitle(mention, items, getMessages())).toBe(
      "The Warfarin label mentions Ginkgo biloba",
    );
  });

  it("recognises supplements listed in RxNorm, but not real medicines", () => {
    expect(isSupplementName("ginkgo biloba extract")).toBe(true);
    expect(isSupplementName("Ginkgo biloba")).toBe(true);
    expect(isSupplementName("iron dextran")).toBe(false);
    expect(isSupplementName("potassium chloride 20 MEQ Extended Release Oral Tablet")).toBe(false);
    expect(isSupplementName("warfarin")).toBe(false);
  });
});
