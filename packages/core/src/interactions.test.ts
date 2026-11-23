import { describe, expect, it } from "vitest";

import { allPairs, InteractionCheckRequest, InteractionCheckResult, itemKey } from "./index";

const warfarin = { kind: "medicine", name: "Warfarin", rxcui: "11289" } as const;
const ginkgo = { kind: "supplement", name: "Ginkgo biloba", supplementId: "ginkgo" } as const;

describe("InteractionCheckRequest", () => {
  it("accepts a medicine and a supplement and trims names", () => {
    const parsed = InteractionCheckRequest.parse({
      items: [{ ...warfarin, name: " Warfarin " }, ginkgo],
    });
    expect(parsed.items[0]?.name).toBe("Warfarin");
  });

  it("needs at least two items to compare", () => {
    expect(InteractionCheckRequest.safeParse({ items: [warfarin] }).success).toBe(false);
  });

  it("needs an RxNorm ID for medicines and a known ID format for supplements", () => {
    expect(
      InteractionCheckRequest.safeParse({ items: [{ kind: "medicine", name: "Warfarin" }, ginkgo] })
        .success,
    ).toBe(false);
    expect(
      InteractionCheckRequest.safeParse({
        items: [warfarin, { kind: "supplement", name: "X", supplementId: "Not Valid" }],
      }).success,
    ).toBe(false);
  });
});

describe("InteractionCheckResult", () => {
  it("keeps 'unavailable' separate from 'nothing found'", () => {
    const unavailable = InteractionCheckResult.parse({ status: "unavailable", reason: "timeout" });
    expect("findings" in unavailable).toBe(false);
  });

  it("requires every label mention to carry a source link", () => {
    const result = InteractionCheckResult.safeParse({
      status: "checked",
      findings: [
        {
          type: "label_mention",
          between: [0, 1],
          labelOf: 0,
          section: "drug_interactions",
          excerpt: "…",
          source: { name: "label" },
        },
      ],
      unchecked: [],
      checkedPairs: 1,
      sources: [],
      checkedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe("helpers", () => {
  it("lists every unordered pair once", () => {
    expect(allPairs(3)).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
    ]);
  });

  it("gives medicines and supplements distinct keys", () => {
    expect(itemKey(warfarin)).toBe("medicine:11289");
    expect(itemKey(ginkgo)).toBe("supplement:ginkgo");
  });
});
