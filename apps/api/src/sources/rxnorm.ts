import type { Ingredient, ResolvedDrug } from "@drugreview/core";

import { DAY_MS, getJson, TtlCache } from "./http";

const BASE = "https://rxnav.nlm.nih.gov/REST";
const SOURCE = "RxNorm";

interface DisplayNames {
  displayTermsList?: { term?: string[] };
}
interface IdGroup {
  idGroup?: { rxnormId?: string[] };
}
interface Properties {
  properties?: { rxcui: string; name: string; tty: string };
}
interface Related {
  relatedGroup?: {
    conceptGroup?: { tty: string; conceptProperties?: { rxcui: string; name: string }[] }[];
  };
}

/** Drug names, autocomplete and ingredients from the US National Library of Medicine's RxNorm. */
export class RxNorm {
  private names: Promise<string[]> | null = null;
  private readonly resolved = new TtlCache<ResolvedDrug | null>(DAY_MS);
  private readonly ingredientCache = new TtlCache<Ingredient[]>(DAY_MS);

  /** The full list of RxNorm display names (about 40,000), downloaded once. */
  private displayNames(): Promise<string[]> {
    this.names ??= getJson<DisplayNames>(SOURCE, `${BASE}/displaynames.json`).then((data) =>
      (data?.displayTermsList?.term ?? []).filter((t) => t.length <= 60),
    );
    this.names.catch(() => (this.names = null));
    return this.names;
  }

  async searchNames(query: string, limit: number): Promise<string[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const names = await this.displayNames();
    const starts: string[] = [];
    const wordStarts: string[] = [];
    for (const name of names) {
      const lower = name.toLowerCase();
      if (lower.startsWith(q)) starts.push(name);
      else if (lower.includes(` ${q}`) || lower.includes(`-${q}`) || lower.includes(`/${q}`))
        wordStarts.push(name);
    }
    const byLength = (a: string, b: string) => a.length - b.length || a.localeCompare(b);
    return [...starts.sort(byLength), ...wordStarts.sort(byLength)].slice(0, limit);
  }

  resolve(name: string): Promise<ResolvedDrug | null> {
    return this.resolved.get(name.toLowerCase(), async () => {
      const ids = await getJson<IdGroup>(
        SOURCE,
        `${BASE}/rxcui.json?name=${encodeURIComponent(name)}&search=2`,
      );
      const rxcui = ids?.idGroup?.rxnormId?.[0];
      if (!rxcui) return null;
      const props = await getJson<Properties>(SOURCE, `${BASE}/rxcui/${rxcui}/properties.json`);
      return {
        rxcui,
        name: props?.properties?.name ?? name,
        ingredients: await this.ingredients(rxcui),
      };
    });
  }

  ingredients(rxcui: string): Promise<Ingredient[]> {
    return this.ingredientCache.get(rxcui, async () => {
      const props = await getJson<Properties>(SOURCE, `${BASE}/rxcui/${rxcui}/properties.json`);
      const self = props?.properties;
      if (!self) return [];
      if (self.tty === "IN") return [{ rxcui: self.rxcui, name: self.name }];
      const related = await getJson<Related>(SOURCE, `${BASE}/rxcui/${rxcui}/related.json?tty=IN`);
      const concepts =
        related?.relatedGroup?.conceptGroup?.flatMap((group) => group.conceptProperties ?? []) ??
        [];
      return concepts.map((c) => ({ rxcui: c.rxcui, name: c.name }));
    });
  }
}
