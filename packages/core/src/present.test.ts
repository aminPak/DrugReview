import { describe, expect, it } from "vitest";

import {
  type CabinetItem,
  type CheckedResult,
  type Finding,
  findingPriority,
  findingTitle,
  getMessages,
  isSupplementName,
  itemConditionLabel,
  quietConditions,
  quietPairs,
  rankFindings,
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

const magnesium: CabinetItem = {
  kind: "supplement",
  name: "Magnesium",
  supplementId: "magnesium",
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

  it("ranks boxed warnings, contraindications, do-not-use and double doses as high priority", () => {
    const same: Finding = { type: "same_ingredient", between: [0, 1], ingredient: "x" };
    const boxed: Finding = { ...mention, section: "boxed_warning" };
    const doNotUse: Finding = { ...mention, section: "do_not_use" };
    expect(findingPriority(same)).toBe("high");
    expect(findingPriority(boxed)).toBe("high");
    expect(findingPriority(doNotUse)).toBe("high");
    expect(findingPriority(mention)).toBe("caution");
    expect(findingPriority({ ...mention, section: "warnings" })).toBe("caution");
  });

  it("groups findings by priority, high first, the person's conditions first in each group", () => {
    const condition: Finding = {
      type: "condition_caution",
      item: 0,
      condition: 0,
      section: "contraindications",
      excerpt: "",
      source: mention.source,
    };
    const contra: Finding = { ...mention, section: "contraindications" };
    const boxed: Finding = { ...mention, section: "boxed_warning" };
    const groups = rankFindings([mention, contra, condition, boxed]);
    expect(groups.map((g) => g.priority)).toEqual(["high", "caution"]);
    expect(groups[0]?.findings).toEqual([condition, boxed, contra]);
    expect(groups[1]?.findings).toEqual([mention]);
    expect(rankFindings([mention]).map((g) => g.priority)).toEqual(["caution"]);
  });

  it("doesn't bury a condition caution under drug-pair mentions from earlier sections", () => {
    // Azithromycin "may exacerbate muscle weakness in persons with myasthenia gravis" is in
    // Warnings and precautions, which comes after Drug interactions in label order.
    const condition: Finding = {
      type: "condition_caution",
      item: 1,
      condition: 0,
      section: "warnings_and_cautions",
      excerpt: "",
      source: mention.source,
    };
    const [cautions] = rankFindings([mention, { ...mention, between: [0, 2] }, condition]);
    expect(cautions?.findings[0]).toBe(condition);
  });

  it("ranks a reviewed rule by its own priority, with the person's conditions, after label evidence", () => {
    const rule: Finding = {
      type: "reviewed_rule",
      item: 1,
      condition: 0,
      rule: { id: "r", version: 1 },
      appliesTo: "Oral magnesium",
      priority: "caution",
      statement: "s",
      citations: [mention.source],
      reviewedBy: "Reviewer",
      reviewedAt: "2026-11-22",
    };
    const labelCondition: Finding = {
      type: "condition_caution",
      item: 0,
      condition: 0,
      section: "warnings",
      excerpt: "",
      source: mention.source,
    };
    expect(findingPriority(rule)).toBe("caution");
    expect(findingPriority({ ...rule, priority: "high" })).toBe("high");
    const [cautions] = rankFindings([mention, rule, labelCondition]);
    expect(cautions?.findings).toEqual([labelCondition, rule, mention]);
    expect(
      findingTitle(rule, [{ kind: "medicine", name: "x", rxcui: "1" }, magnesium], getMessages(), [
        { id: "myasthenia-gravis" },
      ]),
    ).toBe("A reviewed rule covers Magnesium with myasthenia gravis");

    const result: CheckedResult = {
      status: "checked",
      findings: [rule],
      unchecked: [],
      uncheckedForConditions: [],
      checkedPairs: 1,
      sources: [],
      checkedAt: new Date(0).toISOString(),
    };
    // The rule counts as a finding for that item and condition, and isn't a pair finding.
    expect(quietConditions(result, 2, 1)).toEqual([{ item: 0, condition: 0 }]);
    expect(quietPairs(2, [rule], [])).toEqual([{ between: [0, 1] }]);
  });

  it("lists each item and condition checked with nothing found", () => {
    const result: CheckedResult = {
      status: "checked",
      findings: [
        {
          type: "condition_caution",
          item: 0,
          condition: 0,
          section: "boxed_warning",
          excerpt: "",
          source: mention.source,
        },
      ],
      unchecked: [],
      uncheckedForConditions: [2],
      checkedPairs: 3,
      sources: [],
      checkedAt: new Date(0).toISOString(),
    };
    expect(quietConditions(result, 3, 1)).toEqual([{ item: 1, condition: 0 }]);
    const items: CabinetItem[] = [
      { kind: "medicine", name: "ciprofloxacin", rxcui: "1" },
      { kind: "medicine", name: "doxycycline", rxcui: "2" },
    ];
    expect(
      itemConditionLabel({ item: 1, condition: 0 }, items, [{ id: "myasthenia-gravis" }]),
    ).toBe("Doxycycline + Myasthenia gravis");
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
