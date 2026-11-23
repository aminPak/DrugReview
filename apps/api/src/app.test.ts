import { InteractionCheckResult } from "@drugreview/core";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";

const app = createApp({ allowedOrigins: ["http://localhost:3000"] });

const postCheck = (body: unknown) =>
  app.request("/v1/interactions/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("API", () => {
  it("reports health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("rejects an invalid interaction check", async () => {
    const res = await postCheck({ items: [{ name: "Warfarin", kind: "prescription" }] });
    expect(res.status).toBe(400);
  });

  it("says the check is unavailable instead of reporting no interactions", async () => {
    const res = await postCheck({
      items: [
        { name: "Warfarin", kind: "prescription" },
        { name: "Ginkgo biloba", kind: "supplement" },
      ],
    });
    expect(res.status).toBe(503);
    const result = InteractionCheckResult.parse(await res.json());
    expect(result.status).toBe("unavailable");
  });

  it("allows the web app's origin", async () => {
    const res = await app.request("/v1/interactions/check", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:3000", "Access-Control-Request-Method": "POST" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
  });
});
