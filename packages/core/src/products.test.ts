import { describe, expect, it } from "vitest";

import { CabinetItem, itemKey } from "./cabinet";
import { titleCase } from "./drugs";
import type { CheckedResult } from "./interactions";
import { en } from "./messages/en";
import { checkSummaryLine } from "./present";

describe("Canadian products in the list", () => {
  it("accepts a medicine with a DIN and no RxNorm ID", () => {
    const item = CabinetItem.parse({ kind: "medicine", name: "Advil Caplets", din: "01933531" });
    expect(itemKey(item)).toBe("din:01933531");
  });

  it("still accepts a saved v1 item with only an RxNorm ID", () => {
    const item = CabinetItem.parse({ kind: "medicine", name: "Warfarin", rxcui: "11289" });
    expect(itemKey(item)).toBe("medicine:11289");
  });

  it("rejects a medicine with neither, and a malformed DIN", () => {
    expect(CabinetItem.safeParse({ kind: "medicine", name: "Mystery" }).success).toBe(false);
    expect(CabinetItem.safeParse({ kind: "medicine", name: "X", din: "123" }).success).toBe(false);
  });

  it("title-cases Health Canada's capitals", () => {
    expect(titleCase("ADVIL CAPLETS")).toBe("Advil Caplets");
    expect(titleCase("APO-IBUPROFEN TAB 600MG")).toBe("Apo-Ibuprofen Tab 600mg");
  });
});

describe("results summary line", () => {
  const result: CheckedResult = {
    status: "checked",
    findings: [],
    unchecked: [{ between: [0, 1], reason: "no_label_source" }],
    uncheckedForConditions: [2, 3],
    checkedPairs: 15,
    sources: [],
    checkedAt: "2026-11-23T12:00:00.000Z",
  };

  it("says how much was checked and how much couldn't be", () => {
    expect(checkSummaryLine(result, 6, 2, en)).toBe(
      "6 items, 2 conditions, 15 pairs checked, 3 couldn't be checked",
    );
  });

  it("uses singular forms", () => {
    expect(
      checkSummaryLine(
        { ...result, unchecked: [], uncheckedForConditions: [0], checkedPairs: 1 },
        1,
        1,
        en,
      ),
    ).toBe("1 item, 1 condition, 1 pair checked, 1 couldn't be checked");
  });
});
