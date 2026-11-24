import type { Ingredient, LabelSection, ResolvedDrug } from "@drugreview/core";

/** An official drug label, reduced to the sections we search. */
export interface DrugLabel {
  setId: string;
  /** Brand or generic name shown on the label. */
  title: string;
  sections: Partial<Record<LabelSection, string>>;
}

/** Everything the API needs from outside data sources. Swapped for fakes in tests. */
export interface DrugData {
  /** Drug names starting with or containing the query, for autocomplete. */
  searchNames(query: string, limit: number): Promise<string[]>;
  /** RxNorm concept for an exact name, or null if RxNorm doesn't know it. */
  resolve(name: string): Promise<ResolvedDrug | null>;
  /** Active ingredients of an RxNorm concept (empty if unknown). */
  ingredients(rxcui: string): Promise<Ingredient[]>;
  /** Official labels for an ingredient, best first (empty if there are none). */
  labels(ingredientName: string): Promise<DrugLabel[]>;
  /** Labels for an ingredient whose given sections mention any of the terms (empty if none). */
  labelsMentioning(
    ingredientName: string,
    terms: readonly string[],
    sections: readonly LabelSection[],
  ): Promise<DrugLabel[]>;
}

/** A data source failed or didn't respond. Callers must not treat this as "nothing found". */
export class UpstreamError extends Error {
  constructor(source: string, detail: string) {
    super(`${source}: ${detail}`);
    this.name = "UpstreamError";
  }
}
