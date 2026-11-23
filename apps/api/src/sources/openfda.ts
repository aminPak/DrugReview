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

/** Prefer prescription, single-ingredient labels that have a drug interactions section. */
function score(record: LabelRecord): number {
  const generic = record.openfda?.generic_name?.[0] ?? "";
  const isPrescription =
    record.openfda?.product_type?.some((t) => t.includes("PRESCRIPTION")) ?? false;
  const isSingle = !/ AND |,/i.test(generic);
  return (isPrescription ? 4 : 0) + (isSingle ? 2 : 0) + (record.drug_interactions ? 1 : 0);
}

/** Official US drug labels (the same text as DailyMed), from the FDA's openFDA API. */
export class OpenFda {
  private readonly cache = new TtlCache<DrugLabel | null>(DAY_MS);

  constructor(private readonly apiKey?: string) {}

  label(ingredientName: string): Promise<DrugLabel | null> {
    const name = ingredientName.trim().toLowerCase();
    return this.cache.get(name, async () => {
      const search = encodeURIComponent(`openfda.generic_name:"${name.replace(/"/g, "")}"`);
      const key = this.apiKey ? `&api_key=${encodeURIComponent(this.apiKey)}` : "";
      const data = await getJson<LabelResponse>(
        SOURCE,
        `https://api.fda.gov/drug/label.json?search=${search}&sort=effective_time:desc&limit=20${key}`,
      );
      const records = data?.results ?? [];
      if (records.length === 0) return null;

      // Stable sort keeps the newest label first among equally good ones.
      const best = [...records].sort((a, b) => score(b) - score(a))[0]!;
      if (!best.set_id) return null;

      const sections: DrugLabel["sections"] = {};
      for (const section of LABEL_SECTIONS) {
        const text = best[section];
        if (text?.length) sections[section] = text.join(" ");
      }
      const title =
        best.openfda?.brand_name?.[0] ?? best.openfda?.generic_name?.[0] ?? ingredientName;
      return { setId: best.set_id, title, sections };
    });
  }
}

export function dailyMedUrl(setId: string): string {
  return `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${encodeURIComponent(setId)}`;
}
