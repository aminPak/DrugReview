import { displayName } from "./api-client";
import type { CabinetItem } from "./cabinet";
import { allPairs, type Finding, LABEL_SECTIONS, type UncheckedPair } from "./interactions";
import type { Messages } from "./messages";
import { SUPPLEMENTS } from "./supplements";

/** Same-ingredient findings first, then label mentions from the most serious section. */
export function sortFindings(findings: readonly Finding[]): Finding[] {
  const rank = (f: Finding) =>
    f.type === "same_ingredient" ? -1 : LABEL_SECTIONS.indexOf(f.section);
  return [...findings].sort((a, b) => rank(a) - rank(b));
}

/** The headline for a finding, e.g. "The Warfarin label mentions Ginkgo biloba". */
export function findingTitle(finding: Finding, items: readonly CabinetItem[], m: Messages): string {
  if (finding.type === "same_ingredient") return m.results.sameIngredient(finding.ingredient);
  const [a, b] = finding.between;
  const other = finding.labelOf === a ? b : a;
  return m.results.labelMention(
    displayName(items[finding.labelOf]?.name ?? ""),
    displayName(items[other]?.name ?? ""),
  );
}

/** "Ginkgo biloba + Zinc" */
export function pairLabel(
  pair: Pick<UncheckedPair, "between">,
  items: readonly CabinetItem[],
): string {
  return pair.between.map((i) => displayName(items[i]?.name ?? "")).join(" + ");
}

/** Pairs that were checked but had nothing found, so the app can say so instead of staying silent. */
export function quietPairs(
  itemCount: number,
  findings: readonly Finding[],
  unchecked: readonly UncheckedPair[],
): { between: [number, number] }[] {
  const seen = new Set([...findings, ...unchecked].map((x) => x.between.join("-")));
  return allPairs(itemCount)
    .filter((pair) => !seen.has(pair.join("-")))
    .map((between) => ({ between }));
}

const PLANT_PART = /\b(extract|leaf|root|seed|whole|powder|oil|flower)\b/;

/**
 * RxNorm also lists supplements (e.g. "ginkgo biloba extract"). Those should be added from the
 * supplement list, whose names match how labels mention them, so hide them from medicine results.
 */
export function isSupplementName(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPPLEMENTS.some((s) =>
    [s.name, ...s.aliases].some((term) => {
      const t = term.toLowerCase();
      return lower === t || (lower.startsWith(`${t} `) && PLANT_PART.test(lower.slice(t.length)));
    }),
  );
}
