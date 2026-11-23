import type { CabinetItem } from "./cabinet";
import { DrugSearchResponse, ResolvedDrug } from "./drugs";
import { InteractionCheckResult } from "./interactions";

/** The API couldn't be reached or answered with something unexpected. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Typed calls to the DrugReview API, shared by the website and the mobile app. */
export function createApiClient(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, "");

  async function request(path: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(`${base}${path}`, init);
    } catch {
      throw new ApiError("network");
    }
  }

  return {
    async searchDrugs(query: string, signal?: AbortSignal): Promise<string[]> {
      const res = await request(`/v1/drugs/search?q=${encodeURIComponent(query)}`, { signal });
      if (!res.ok) throw new ApiError(`search failed: ${res.status}`);
      return DrugSearchResponse.parse(await res.json()).results;
    },

    /** The RxNorm concept for a name picked from search, or null if it can't be found. */
    async resolveDrug(name: string): Promise<ResolvedDrug | null> {
      const res = await request(`/v1/drugs/resolve?name=${encodeURIComponent(name)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new ApiError(`resolve failed: ${res.status}`);
      return ResolvedDrug.parse(await res.json());
    },

    /** Never throws for a check that couldn't run: that comes back as status "unavailable". */
    async checkInteractions(items: readonly CabinetItem[]): Promise<InteractionCheckResult> {
      let res: Response;
      try {
        res = await request("/v1/interactions/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
      } catch {
        return { status: "unavailable", reason: "network" };
      }
      if (res.status !== 200 && res.status !== 503) {
        return { status: "unavailable", reason: `HTTP ${res.status}` };
      }
      const parsed = InteractionCheckResult.safeParse(await res.json().catch(() => null));
      return parsed.success ? parsed.data : { status: "unavailable", reason: "invalid response" };
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** "warfarin sodium" → "Warfarin sodium". RxNorm names are mostly lower case. */
export function displayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
