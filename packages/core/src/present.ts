import { displayName } from "./api-client";
import type { CabinetItem } from "./cabinet";
import { getCondition } from "./conditions";
import {
  allPairs,
  type CheckedResult,
  type Finding,
  LABEL_SECTIONS,
  type LabelSection,
  type ProfileCondition,
  type UncheckedPair,
} from "./interactions";
import type { Messages } from "./messages";
import { SUPPLEMENTS } from "./supplements";

const sectionRank = (f: Finding) =>
  f.type === "same_ingredient" ? -1 : LABEL_SECTIONS.indexOf(f.section);

/** Same-ingredient findings first, then label mentions from the most serious section. */
export function sortFindings<T extends Finding>(findings: readonly T[]): T[] {
  return [...findings].sort((a, b) => sectionRank(a) - sectionRank(b));
}

/** The name to show for a profile condition. */
export function conditionName(condition: ProfileCondition | undefined): string {
  if (!condition) return "";
  if ("custom" in condition) return condition.custom;
  return getCondition(condition.id)?.name ?? condition.id;
}

/** The headline for a finding, e.g. "The Warfarin label mentions Ginkgo biloba". */
export function findingTitle(
  finding: Finding,
  items: readonly CabinetItem[],
  m: Messages,
  conditions: readonly ProfileCondition[] = [],
): string {
  if (finding.type === "same_ingredient") return m.results.sameIngredient(finding.ingredient);
  if (finding.type === "condition_caution") {
    return m.results.conditionCaution(
      displayName(items[finding.item]?.name ?? ""),
      conditionName(conditions[finding.condition]),
    );
  }
  const [a, b] = finding.between;
  const other = finding.labelOf === a ? b : a;
  return m.results.labelMention(
    displayName(items[finding.labelOf]?.name ?? ""),
    displayName(items[other]?.name ?? ""),
  );
}

/** For findings from a supplement's medicine form: "This is from the label for magnesium sulfate…" */
export function viaNote(
  finding: Finding,
  items: readonly CabinetItem[],
  m: Messages,
): string | null {
  if (finding.type === "same_ingredient" || !finding.viaIngredient) return null;
  const index = finding.type === "condition_caution" ? finding.item : finding.labelOf;
  return m.results.viaIngredient(finding.viaIngredient, items[index]?.name ?? "");
}

/** "Ginkgo biloba + Zinc" */
export function pairLabel(
  pair: Pick<UncheckedPair, "between">,
  items: readonly CabinetItem[],
): string {
  return pair.between.map((i) => displayName(items[i]?.name ?? "")).join(" + ");
}

/**
 * How prominently a finding is shown. This ranks by where the label says it, not by a clinical
 * severity grade: "high" is a boxed warning, a contraindication, a "do not use" instruction or a
 * possible double dose; everything else in the label is "caution".
 */
export type Priority = "high" | "caution";
export const PRIORITIES: readonly Priority[] = ["high", "caution"];

const HIGH_PRIORITY_SECTIONS: ReadonlySet<LabelSection> = new Set([
  "boxed_warning",
  "contraindications",
  "do_not_use",
]);

export function findingPriority(finding: Finding): Priority {
  if (finding.type === "same_ingredient") return "high";
  return HIGH_PRIORITY_SECTIONS.has(finding.section) ? "high" : "caution";
}

/**
 * Findings grouped by priority, most important group first and most serious section first within
 * each group. At the same section, findings about the person's conditions come first.
 */
export function rankFindings(findings: readonly Finding[]) {
  const ordered = sortFindings([
    ...findings.filter((f) => f.type === "condition_caution"),
    ...findings.filter((f) => f.type !== "condition_caution"),
  ]);
  return PRIORITIES.map((priority) => ({
    priority,
    findings: ordered.filter((f) => findingPriority(f) === priority),
  })).filter((group) => group.findings.length > 0);
}

/** Pairs that were checked but had nothing found, so the app can say so instead of staying silent. */
export function quietPairs(
  itemCount: number,
  findings: readonly Finding[],
  unchecked: readonly UncheckedPair[],
): { between: [number, number] }[] {
  const seen = new Set(
    [...findings.filter((f) => f.type !== "condition_caution"), ...unchecked].map((x) =>
      (x as { between: number[] }).between.join("-"),
    ),
  );
  return allPairs(itemCount)
    .filter((pair) => !seen.has(pair.join("-")))
    .map((between) => ({ between }));
}

/** Profile conditions that were checked against at least one label with nothing found. */
export function quietConditions(
  result: CheckedResult,
  itemCount: number,
  conditionCount: number,
): number[] {
  if (result.uncheckedForConditions.length >= itemCount) return [];
  const flagged = new Set(
    result.findings.filter((f) => f.type === "condition_caution").map((f) => f.condition),
  );
  return Array.from({ length: conditionCount }, (_, i) => i).filter((i) => !flagged.has(i));
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
