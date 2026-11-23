import { describe, expect, it } from "vitest";

import { InteractionCheckRequest, InteractionCheckResult } from "./index";

describe("InteractionCheckRequest", () => {
  it("accepts two items and trims names", () => {
    const parsed = InteractionCheckRequest.parse({
      items: [
        { name: "  Warfarin ", kind: "prescription", rxcui: "11289" },
        { name: "Ginkgo biloba", kind: "supplement" },
      ],
    });
    expect(parsed.items[0]?.name).toBe("Warfarin");
  });

  it("needs at least two items to compare", () => {
    const result = InteractionCheckRequest.safeParse({
      items: [{ name: "Warfarin", kind: "prescription" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown product kinds and empty names", () => {
    const result = InteractionCheckRequest.safeParse({
      items: [
        { name: "", kind: "prescription" },
        { name: "Vitamin K", kind: "food" },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("InteractionCheckResult", () => {
  it("keeps 'unavailable' separate from 'no interactions found'", () => {
    const unavailable = InteractionCheckResult.parse({
      status: "unavailable",
      reason: "No knowledge base connected",
    });
    expect(unavailable.status).toBe("unavailable");
    expect("interactions" in unavailable).toBe(false);
  });

  it("requires at least one source for every interaction", () => {
    const result = InteractionCheckResult.safeParse({
      status: "checked",
      interactions: [{ between: [0, 1], severity: "major", summary: "Bleeding risk", sources: [] }],
      knowledgeBase: { name: "test", version: "1" },
      checkedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
