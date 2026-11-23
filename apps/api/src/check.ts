import {
  allPairs,
  type CabinetItem,
  CONDITION_SECTIONS,
  type Finding,
  findMention,
  getCondition,
  getSupplement,
  type HealthProfile,
  type Ingredient,
  INTERACTION_SECTIONS,
  type InteractionCheckResult,
  type LabelSection,
  type MatchOptions,
  type ProfileCondition,
  type Source,
  supplementLabelIngredients,
  supplementTerms,
  type UncheckedPair,
} from "@drugreview/core";

import { mapLimit } from "./sources/http";
import { dailyMedUrl } from "./sources/openfda";
import { type DrugData, type DrugLabel, UpstreamError } from "./sources/types";

/** Combination products rarely have more; this caps label lookups per item. */
const MAX_INGREDIENTS_PER_ITEM = 4;
const CONCURRENCY = 6;
/** Typed-in conditions shorter than this match too much label text to be useful. */
const MIN_CUSTOM_TERM = 4;

const RXNORM_SOURCE: Source = {
  name: "RxNorm, US National Library of Medicine",
  url: "https://www.nlm.nih.gov/research/umls/rxnorm/",
};

interface ItemLabel {
  label: DrugLabel;
  /** For supplements: the medicine form the label belongs to (e.g. "magnesium sulfate"). */
  viaIngredient?: string;
}

interface Prepared {
  item: CabinetItem;
  /** Active ingredients from RxNorm (medicines only), used to spot duplicates. */
  ingredients: Ingredient[];
  /** Lower-case names of everything this item's labels are about. */
  ownNames: Set<string>;
  labels: ItemLabel[];
  /** Names other labels are searched for. */
  terms: string[];
  matchOptions: MatchOptions;
}

interface PreparedCondition {
  terms: string[];
  sections: readonly LabelSection[];
}

/**
 * Check a person's medicines and supplements against each other and against the conditions in
 * their health profile, using official label text.
 *
 * Deterministic text matching only: no AI, no guessing. If a source fails, the whole check is
 * reported as unavailable rather than returning a partial answer that could look reassuring.
 */
export async function checkInteractions(
  items: readonly CabinetItem[],
  data: DrugData,
  profile?: HealthProfile,
): Promise<InteractionCheckResult> {
  try {
    return await runCheck(items, data, profile?.conditions ?? []);
  } catch (error) {
    if (error instanceof UpstreamError) {
      return { status: "unavailable", reason: "A data source didn't respond." };
    }
    throw error;
  }
}

function sourceFor(label: DrugLabel): Source {
  return { name: `${label.title} label (DailyMed)`, url: dailyMedUrl(label.setId) };
}

function prepareCondition(condition: ProfileCondition): PreparedCondition {
  if ("custom" in condition) {
    const term = condition.custom.toLowerCase();
    return { terms: term.length >= MIN_CUSTOM_TERM ? [term] : [], sections: CONDITION_SECTIONS };
  }
  const known = getCondition(condition.id);
  return {
    terms: known ? [...known.searchTerms] : [],
    sections: known?.sections ?? CONDITION_SECTIONS,
  };
}

async function runCheck(
  items: readonly CabinetItem[],
  data: DrugData,
  conditions: readonly ProfileCondition[],
): Promise<InteractionCheckResult> {
  // 1. What each item is made of, and which labels to read for it.
  const ingredientLists = await mapLimit(items, CONCURRENCY, async (item) =>
    item.kind === "medicine"
      ? (await data.ingredients(item.rxcui)).slice(0, MAX_INGREDIENTS_PER_ITEM)
      : [],
  );
  const labelNamesPerItem = items.map((item, index) => {
    if (item.kind === "medicine") return (ingredientLists[index] ?? []).map((i) => i.name);
    const supplement = getSupplement(item.supplementId);
    return supplement ? [...supplementLabelIngredients(supplement)] : [];
  });

  // 2. Fetch each label once.
  const labelNames = [...new Set(labelNamesPerItem.flat().map((n) => n.toLowerCase()))];
  const fetched = await mapLimit(labelNames, CONCURRENCY, (name) => data.labels(name));
  const labelsByName = new Map(labelNames.map((name, i) => [name, fetched[i] ?? []]));

  const prepared: Prepared[] = items.map((item, index) => {
    const ingredients = ingredientLists[index] ?? [];
    const names = labelNamesPerItem[index] ?? [];
    const labels: ItemLabel[] = [];
    for (const name of names) {
      for (const label of labelsByName.get(name.toLowerCase()) ?? []) {
        labels.push(item.kind === "supplement" ? { label, viaIngredient: name } : { label });
      }
    }
    const ownNames = new Set(names.map((n) => n.toLowerCase()));
    if (item.kind === "medicine") {
      return {
        item,
        ingredients,
        ownNames,
        labels,
        terms: ingredients.map((i) => i.name.toLowerCase()),
        matchOptions: {},
      };
    }
    const supplement = getSupplement(item.supplementId);
    const terms = supplement ? supplementTerms(supplement) : [item.name.toLowerCase()];
    terms.forEach((t) => ownNames.add(t));
    return {
      item,
      ingredients,
      ownNames,
      labels,
      terms,
      matchOptions: { ignoreWhenFollowedBy: supplement?.ignoreWhenFollowedBy ?? [] },
    };
  });

  const findings: Finding[] = [];
  const unchecked: UncheckedPair[] = [];
  const usedLabels = new Map<string, DrugLabel>();
  let checkedPairs = 0;

  // 3. Every pair of items.
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
      const terms = other.terms.filter((term) => !owner.ownNames.has(term));
      const hit = firstMention(owner.labels, INTERACTION_SECTIONS, terms, other.matchOptions);
      if (!hit) continue;
      usedLabels.set(hit.label.setId, hit.label);
      findings.push({
        type: "label_mention",
        between: [i, j],
        labelOf: ownerIndex,
        ...(hit.viaIngredient ? { viaIngredient: hit.viaIngredient } : {}),
        section: hit.section,
        excerpt: hit.excerpt,
        source: sourceFor(hit.label),
      });
    }
  }

  // 4. Every item against every condition in the profile. First the labels already read; if
  // none of them mention the condition, ask for any label of the ingredient that does.
  const uncheckedForConditions: number[] = [];
  if (conditions.length > 0) {
    const preparedConditions = conditions.map(prepareCondition);
    const tasks: { itemIndex: number; conditionIndex: number }[] = [];
    prepared.forEach((item, itemIndex) => {
      if (item.labels.length === 0) {
        uncheckedForConditions.push(itemIndex);
        return;
      }
      preparedConditions.forEach((condition, conditionIndex) => {
        if (condition.terms.length > 0) tasks.push({ itemIndex, conditionIndex });
      });
    });

    const hits = await mapLimit(tasks, CONCURRENCY, async ({ itemIndex, conditionIndex }) => {
      const item = prepared[itemIndex]!;
      const condition = preparedConditions[conditionIndex]!;
      const local = firstMention(item.labels, condition.sections, condition.terms);
      if (local) return local;
      for (const name of labelNamesPerItem[itemIndex] ?? []) {
        const found = await data.labelsMentioning(name, condition.terms, condition.sections);
        const labels = found.map((label) =>
          item.item.kind === "supplement" ? { label, viaIngredient: name } : { label },
        );
        const hit = firstMention(labels, condition.sections, condition.terms);
        if (hit) return hit;
      }
      return null;
    });

    tasks.forEach(({ itemIndex, conditionIndex }, n) => {
      const hit = hits[n];
      if (!hit) return;
      usedLabels.set(hit.label.setId, hit.label);
      findings.push({
        type: "condition_caution",
        item: itemIndex,
        condition: conditionIndex,
        ...(hit.viaIngredient ? { viaIngredient: hit.viaIngredient } : {}),
        section: hit.section,
        excerpt: hit.excerpt,
        source: sourceFor(hit.label),
      });
    });
  }

  return {
    status: "checked",
    findings,
    unchecked,
    uncheckedForConditions,
    checkedPairs,
    sources: [RXNORM_SOURCE, ...[...usedLabels.values()].map(sourceFor)],
    checkedAt: new Date().toISOString(),
  };
}

/**
 * The most serious section, across all of an item's labels, that mentions any of the terms.
 * One finding per item and topic keeps near-identical labels from repeating the same warning.
 */
function firstMention(
  labels: readonly ItemLabel[],
  sections: readonly LabelSection[],
  terms: readonly string[],
  options?: MatchOptions,
) {
  for (const section of sections) {
    for (const { label, viaIngredient } of labels) {
      const text = label.sections[section];
      if (!text) continue;
      const excerpt = findMention(text, terms, options);
      if (excerpt) return { label, viaIngredient, section, excerpt };
    }
  }
  return null;
}
