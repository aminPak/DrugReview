import {
  allPairs,
  type CabinetItem,
  type Finding,
  findMention,
  getSupplement,
  type Ingredient,
  type InteractionCheckResult,
  LABEL_SECTIONS,
  type MatchOptions,
  type Source,
  supplementTerms,
  type UncheckedPair,
} from "@drugreview/core";

import { mapLimit } from "./sources/http";
import { dailyMedUrl } from "./sources/openfda";
import { type DrugData, type DrugLabel, UpstreamError } from "./sources/types";

/** Combination products rarely have more; this caps label lookups per item. */
const MAX_INGREDIENTS_PER_ITEM = 4;
const CONCURRENCY = 6;

const RXNORM_SOURCE: Source = {
  name: "RxNorm, US National Library of Medicine",
  url: "https://www.nlm.nih.gov/research/umls/rxnorm/",
};

interface Prepared {
  item: CabinetItem;
  ingredients: Ingredient[];
  labels: DrugLabel[];
  /** Names other labels are searched for. */
  terms: string[];
  matchOptions: MatchOptions;
}

/**
 * Compare every pair of items against the official labels of the medicines involved.
 * Deterministic text matching only: no AI, no guessing. If a source fails, the whole check is
 * reported as unavailable rather than returning a partial answer that could look reassuring.
 */
export async function checkInteractions(
  items: readonly CabinetItem[],
  data: DrugData,
): Promise<InteractionCheckResult> {
  try {
    return await runCheck(items, data);
  } catch (error) {
    if (error instanceof UpstreamError) {
      return { status: "unavailable", reason: "A data source didn't respond." };
    }
    throw error;
  }
}

async function runCheck(
  items: readonly CabinetItem[],
  data: DrugData,
): Promise<InteractionCheckResult> {
  const ingredientLists = await mapLimit(items, CONCURRENCY, async (item) =>
    item.kind === "medicine"
      ? (await data.ingredients(item.rxcui)).slice(0, MAX_INGREDIENTS_PER_ITEM)
      : [],
  );

  const ingredientNames = [...new Set(ingredientLists.flat().map((i) => i.name.toLowerCase()))];
  const labelList = await mapLimit(ingredientNames, CONCURRENCY, (name) => data.label(name));
  const labelsByIngredient = new Map(
    ingredientNames.map((name, i) => [name, labelList[i] ?? null]),
  );

  const prepared: Prepared[] = items.map((item, index) => {
    const ingredients = ingredientLists[index] ?? [];
    const labels = ingredients
      .map((ingredient) => labelsByIngredient.get(ingredient.name.toLowerCase()))
      .filter((label): label is DrugLabel => label != null);
    if (item.kind === "medicine") {
      return {
        item,
        ingredients,
        labels,
        terms: ingredients.map((i) => i.name.toLowerCase()),
        matchOptions: {},
      };
    }
    const supplement = getSupplement(item.supplementId);
    return {
      item,
      ingredients,
      labels,
      terms: supplement ? supplementTerms(supplement) : [item.name.toLowerCase()],
      matchOptions: { ignoreWhenFollowedBy: supplement?.ignoreWhenFollowedBy ?? [] },
    };
  });

  const findings: Finding[] = [];
  const unchecked: UncheckedPair[] = [];
  const usedLabels = new Map<string, DrugLabel>();
  let checkedPairs = 0;

  for (const [i, j] of allPairs(items.length)) {
    const a = prepared[i]!;
    const b = prepared[j]!;

    const shared = a.ingredients.filter((x) => b.ingredients.some((y) => y.rxcui === x.rxcui));
    for (const ingredient of shared) {
      findings.push({ type: "same_ingredient", between: [i, j], ingredient: ingredient.name });
    }

    if (a.labels.length === 0 && b.labels.length === 0) {
      const bothSupplements = a.item.kind === "supplement" && b.item.kind === "supplement";
      unchecked.push({
        between: [i, j],
        reason: bothSupplements ? "no_label_source" : "label_not_found",
      });
      continue;
    }
    checkedPairs++;

    for (const [ownerIndex, owner, other] of [
      [i, a, b],
      [j, b, a],
    ] as const) {
      // Don't report a label mentioning its own ingredient; that's covered by same_ingredient.
      const ownNames = new Set(owner.ingredients.map((x) => x.name.toLowerCase()));
      const terms = other.terms.filter((term) => !ownNames.has(term));
      for (const label of owner.labels) {
        for (const section of LABEL_SECTIONS) {
          const text = label.sections[section];
          if (!text) continue;
          const excerpt = findMention(text, terms, other.matchOptions);
          if (!excerpt) continue;
          usedLabels.set(label.setId, label);
          findings.push({
            type: "label_mention",
            between: [i, j],
            labelOf: ownerIndex,
            section,
            excerpt,
            source: { name: `${label.title} label (DailyMed)`, url: dailyMedUrl(label.setId) },
          });
          break; // Report only the most serious section per label.
        }
      }
    }
  }

  const sources: Source[] = [
    RXNORM_SOURCE,
    ...[...usedLabels.values()].map((label) => ({
      name: `${label.title} label (DailyMed)`,
      url: dailyMedUrl(label.setId),
    })),
  ];

  return {
    status: "checked",
    findings,
    unchecked,
    checkedPairs,
    sources,
    checkedAt: new Date().toISOString(),
  };
}
