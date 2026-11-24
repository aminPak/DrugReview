import { AiSettingsView, type AiSettingsUpdate, AiTestResult } from "@drugreview/core";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

/** The admin token was refused, or the admin area is switched off on the server. */
export class AdminError extends Error {
  constructor(
    readonly kind: "unauthorized" | "disabled" | "network" | "rejected",
    message: string,
  ) {
    super(message);
    this.name = "AdminError";
  }
}

/** Calls to the API's admin area, with the admin token as a bearer token. */
export function createAdminClient(token: string) {
  async function call(path: string, init: RequestInit = {}) {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/admin${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new AdminError("network", "Couldn't reach the server.");
    }
    if (res.status === 401) throw new AdminError("unauthorized", "That admin token isn't right.");
    if (res.status === 404) {
      throw new AdminError("disabled", "The admin area is off. Set ADMIN_TOKEN on the server.");
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new AdminError(
        "rejected",
        body?.message ?? `The server answered with HTTP ${res.status}.`,
      );
    }
    return res.json();
  }

  return {
    async getAi() {
      return AiSettingsView.parse(await call("/ai"));
    },
    async saveAi(update: AiSettingsUpdate) {
      return AiSettingsView.parse(
        await call("/ai", { method: "PUT", body: JSON.stringify(update) }),
      );
    },
    async testAi() {
      return AiTestResult.parse(await call("/ai/test", { method: "POST" }));
    },
    async clearAi() {
      return AiSettingsView.parse(await call("/ai", { method: "DELETE" }));
    },
  };
}
