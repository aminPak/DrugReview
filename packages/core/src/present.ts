import { displayName } from "./api-client";
import type { CabinetItem } from "./cabinet";
import { getCondition } from "./conditions";
import {
  allPairs,
  type CheckedResult,
  type ConditionFinding,
  type Finding,
  LABEL_SECTIONS,
  type LabelSection,
  type PairFinding,
  Priority,
  type ProfileCondition,
  type UncheckedPair,
} from "./interactions";
import type { Messages } from "./messages";
import { SUPPLEMENTS } from "./supplements";

const sectionRank = (f: Finding) => {
  if (f.type === "same_ingredient") return -1;
  // Reviewed rules have no label section; they come after label evidence of the same priority.
  if (f.type === "reviewed_rule") return LABEL_SECTIONS.length;
  return LABEL_SECTIONS.indexOf(f.section);
};

const isConditionFinding = (f: Finding): f is ConditionFinding =>
  f.type === "condition_caution" || f.type === "reviewed_rule";
const isPairFinding = (f: Finding): f is PairFinding =>
  f.type === "label_mention" || f.type === "same_ingredient";

/**
 * Same-ingredient findings first, then label findings from the most serious section, then
 * reviewed rules.
 */
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
  if (finding.type === "reviewed_rule") {
    return m.results.reviewedRuleTitle(
      displayName(items[finding.item]?.name ?? ""),
      conditionName(conditions[finding.condition]),
    );
  }
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
  if (finding.type === "same_ingredient" || finding.type === "reviewed_rule") return null;
  if (!finding.viaIngredient) return null;
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

/** "Reviewed by … on … · rule …, version …" for a reviewed-rule finding. */
export function ruleReviewLine(
  finding: Extract<Finding, { type: "reviewed_rule" }>,
  m: Messages,
): string {
  return m.results.ruleReviewed(
    finding.reviewedBy,
    finding.reviewedAt,
    finding.rule.id,
    finding.rule.version,
  );
}

/**
 * How prominently a finding is shown. For label findings this comes from where the label says it,
 * not from a clinical severity grade: "high" is a boxed warning, a contraindication, a "do not use"
 * instruction or a possible double dose; everything else in the label is "caution". A reviewed rule
 * carries the priority its reviewer set.
 */
export const PRIORITIES: readonly Priority[] = Priority.options;

const HIGH_PRIORITY_SECTIONS: ReadonlySet<LabelSection> = new Set([
  "boxed_warning",
  "contraindications",
  "do_not_use",
]);

export function findingPriority(finding: Finding): Priority {
  if (finding.type === "same_ingredient") return "high";
  if (finding.type === "reviewed_rule") return finding.priority;
  return HIGH_PRIORITY_SECTIONS.has(finding.section) ? "high" : "caution";
}

/**
 * Findings grouped by priority, most important group first. Within each group, findings about the
 * person's own conditions come first (label evidence, then reviewed rules), so they aren't buried
 * under a list of drug-pair mentions; then the rest, most serious section first.
 */
export function rankFindings(findings: readonly Finding[]) {
  const ordered = [
    ...sortFindings(findings.filter(isConditionFinding)),
    ...sortFindings(findings.filter((f) => !isConditionFinding(f))),
  ];
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
    [...findings.filter(isPairFinding), ...unchecked].map((x) => x.between.join("-")),
  );
  return allPairs(itemCount)
    .filter((pair) => !seen.has(pair.join("-")))
    .map((between) => ({ between }));
}

/**
 * Each item and profile condition checked with nothing found (no label warning and no reviewed
 * rule), so a medicine that isn't flagged for a condition is listed by name instead of silently
 * left out.
 */
export function quietConditions(
  result: CheckedResult,
  itemCount: number,
  conditionCount: number,
): { item: number; condition: number }[] {
  const unchecked = new Set(result.uncheckedForConditions);
  const flagged = new Set(
    result.findings.filter(isConditionFinding).map((f) => `${f.item}-${f.condition}`),
  );
  const quiet: { item: number; condition: number }[] = [];
  for (let condition = 0; condition < conditionCount; condition++) {
    for (let item = 0; item < itemCount; item++) {
      if (!unchecked.has(item) && !flagged.has(`${item}-${condition}`)) {
        quiet.push({ item, condition });
      }
    }
  }
  return quiet;
}

/** "Doxycycline + Myasthenia gravis" */
export function itemConditionLabel(
  pair: { item: number; condition: number },
  items: readonly CabinetItem[],
  conditions: readonly ProfileCondition[],
): string {
  return `${displayName(items[pair.item]?.name ?? "")} + ${conditionName(conditions[pair.condition])}`;
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
