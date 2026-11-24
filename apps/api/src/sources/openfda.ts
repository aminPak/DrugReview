import { LABEL_SECTIONS, type LabelSection } from "@drugreview/core";

import { DAY_MS, getJson, TtlCache } from "./http";
import type { DrugLabel } from "./types";

const SOURCE = "openFDA";

type LabelRecord = Partial<Record<LabelSection, string[]>> & {
  set_id?: string;
  openfda?: { generic_name?: string[]; brand_name?: string[]; product_type?: string[] };
};

interface LabelResponse {
  results?: LabelRecord[];
}

/** True for a label of one active ingredient, not a combination product or multivitamin. */
function isSingleIngredient(record: LabelRecord): boolean {
  const generic = record.openfda?.generic_name?.[0] ?? "";
  return !/ AND |,|\//i.test(generic);
}

/**
 * Combination products (bowel preps, multivitamins) carry warnings about their other ingredients,
 * so use them only when no single-ingredient label exists.
 */
function preferSingleIngredient(records: readonly LabelRecord[]): LabelRecord[] {
  const singles = records.filter(isSingleIngredient);
  return singles.length > 0 ? singles : [...records];
}

/** Prefer prescription labels that have a drug interactions section. */
function score(record: LabelRecord): number {
  const isPrescription =
    record.openfda?.product_type?.some((t) => t.includes("PRESCRIPTION")) ?? false;
  return (isPrescription ? 2 : 0) + (record.drug_interactions ? 1 : 0);
}

/** How many different labels to read per ingredient. Manufacturers' labels differ in detail. */
const LABELS_PER_INGREDIENT = 3;

function toLabel(record: LabelRecord, fallbackTitle: string): DrugLabel | null {
  if (!record.set_id) return null;
  const sections: DrugLabel["sections"] = {};
  for (const section of LABEL_SECTIONS) {
    const text = record[section];
    if (text?.length) sections[section] = text.join(" ");
  }
  const title =
    record.openfda?.brand_name?.[0] ?? record.openfda?.generic_name?.[0] ?? fallbackTitle;
  return { setId: record.set_id, title, sections };
}

/** Labels with the same warnings text add nothing; keep only labels that say something different. */
function fingerprint(label: DrugLabel): string {
  const s = label.sections;
  return [s.boxed_warning, s.contraindications, s.warnings_and_cautions, s.warnings]
    .map((t) => (t ?? "").slice(0, 300))
    .join("|");
}

/** Official US drug labels (the same text as DailyMed), from the FDA's openFDA API. */
export class OpenFda {
  private readonly cache = new TtlCache<DrugLabel[]>(DAY_MS);

  constructor(private readonly apiKey?: string) {}

  /** Up to three different labels for an ingredient, best first (single-ingredient, prescription, newest). */
  labels(ingredientName: string): Promise<DrugLabel[]> {
    const name = ingredientName.trim().toLowerCase();
    return this.cache.get(name, async () => {
      const search = encodeURIComponent(`openfda.generic_name:"${name.replace(/"/g, "")}"`);
      const key = this.apiKey ? `&api_key=${encodeURIComponent(this.apiKey)}` : "";
      const data = await getJson<LabelResponse>(
        SOURCE,
        `https://api.fda.gov/drug/label.json?search=${search}&sort=effective_time:desc&limit=20${key}`,
      );
      // Stable sort keeps the newest label first among equally good ones.
      const ranked = preferSingleIngredient(data?.results ?? []).sort(
        (a, b) => score(b) - score(a),
      );
      const chosen: DrugLabel[] = [];
      const seen = new Set<string>();
      for (const record of ranked) {
        const label = toLabel(record, ingredientName);
        if (!label) continue;
        const key = fingerprint(label);
        if (seen.has(key)) continue;
        seen.add(key);
        chosen.push(label);
        if (chosen.length === LABELS_PER_INGREDIENT) break;
      }
      return chosen;
    });
  }
}

/**
 * Labels for an ingredient whose given sections mention any of the terms, newest first.
 * Used for health conditions: different manufacturers' labels vary, and a warning about a
 * condition that appears on any official label for the ingredient is worth showing.
 */
export class OpenFdaSearch {
  private readonly cache = new TtlCache<DrugLabel[]>(DAY_MS);

  constructor(private readonly apiKey?: string) {}

  labelsMentioning(
    ingredientName: string,
    terms: readonly string[],
    sections: readonly LabelSection[],
  ): Promise<DrugLabel[]> {
    const name = ingredientName.trim().toLowerCase();
    const phrases = terms.map((t) => t.replace(/["\\]/g, "").trim()).filter(Boolean);
    const cacheKey = JSON.stringify([name, phrases, sections]);
    return this.cache.get(cacheKey, async () => {
      if (phrases.length === 0 || sections.length === 0) return [];
      const anyMention = sections
        .flatMap((section) => phrases.map((phrase) => `${section}:"${phrase}"`))
        .join(" ");
      const search = encodeURIComponent(
        `openfda.generic_name:"${name.replace(/"/g, "")}" AND (${anyMention})`,
      );
      const key = this.apiKey ? `&api_key=${encodeURIComponent(this.apiKey)}` : "";
      const data = await getJson<LabelResponse>(
        SOURCE,
        `https://api.fda.gov/drug/label.json?search=${search}&sort=effective_time:desc&limit=10${key}`,
      );
      return preferSingleIngredient(data?.results ?? [])
        .map((record) => toLabel(record, ingredientName))
        .filter((label): label is DrugLabel => label != null);
    });
  }
}

export function dailyMedUrl(setId: string): string {
  return `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${encodeURIComponent(setId)}`;
}
