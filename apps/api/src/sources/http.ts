import { UpstreamError } from "./types";

const TIMEOUT_MS = 10_000;

/** GET a JSON document. Returns null on 404; throws UpstreamError on anything else that fails. */
export async function getJson<T>(source: string, url: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new UpstreamError(source, error instanceof Error ? error.message : "request failed");
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new UpstreamError(source, `HTTP ${res.status}`);
  try {
    return (await res.json()) as T;
  } catch {
    throw new UpstreamError(source, "invalid JSON");
  }
}

/**
 * Caches promises for a fixed time, so concurrent callers share one request.
 * Failed lookups are dropped right away so the next call retries.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: Promise<V>; expires: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 5_000,
  ) {}

  get(key: string, load: () => Promise<V>): Promise<V> {
    const now = Date.now();
    const hit = this.entries.get(key);
    if (hit && hit.expires > now) return hit.value;

    const value = load();
    this.entries.set(key, { value, expires: now + this.ttlMs });
    value.catch(() => this.entries.delete(key));
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    return value;
  }
}

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Run `fn` over `items` with at most `limit` running at once, keeping order. */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
