import type { Priority, Source } from "./interactions";

/**
 * Layer 3 of the safety check: clinically reviewed rules (see docs/safety-checks.md).
 *
 * A small, versioned set of item × condition rules for risks that no US FDA label states. A rule
 * is shown to people only once a named reviewer has signed it off and it has a statement and at
 * least one published citation (`isPublished`). Drafts stay in this file for review and are never
 * returned by `matchingRules`.
 *
 * Bump `version` whenever the match, statement, priority or citations change, and review again.
 */
export interface ClinicalRule {
  /** Stable id, e.g. "magnesium-myasthenia-gravis". */
  id: string;
  version: number;
  /** What the rule covers, as shown to people, e.g. "Oral magnesium". */
  appliesTo: string;
  match: {
    /** Lower-case RxNorm ingredient names (for a class, list its members). */
    ingredients?: readonly string[];
    /** Supplement ids from `supplements.ts`. */
    supplementIds?: readonly string[];
  };
  /** Condition id from `conditions.ts`. */
  condition: string;
  priority: Priority;
  /** Plain-language text shown to people. Written or approved by the reviewer; null in drafts. */
  statement: string | null;
  /** Published sources the statement rests on, shown with the finding. */
  citations: readonly Source[];
  reviewedBy: string | null;
  /** ISO date (YYYY-MM-DD). */
  reviewedAt: string | null;
  /** For the reviewer only, never shown: open questions and what candidate sources say. */
  reviewNotes?: string;
}

/** A rule that has passed review and may be shown to people. */
export type PublishedRule = ClinicalRule & {
  statement: string;
  reviewedBy: string;
  reviewedAt: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True only for a rule with a reviewer, a review date, a statement and at least one citation. */
export function isPublished(rule: ClinicalRule): rule is PublishedRule {
  return (
    !!rule.reviewedBy?.trim() &&
    !!rule.reviewedAt &&
    ISO_DATE.test(rule.reviewedAt) &&
    !Number.isNaN(Date.parse(rule.reviewedAt)) &&
    !!rule.statement?.trim() &&
    rule.citations.length > 0
  );
}

const SHEIKH_2021: Source = {
  name: "Sheikh S, Alvi U, Soliven B, Rezania K. Drugs That Induce or Cause Deterioration of Myasthenia Gravis: An Update. J Clin Med. 2021;10(7):1537",
  url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8038781/",
};

const MGFA_CAUTIONARY: Source = {
  name: "Myasthenia Gravis Foundation of America: Cautionary Drugs",
  url: "https://myasthenia.org/living-with-mg/mg-emergency-preparedness/cautionary-drugs/",
};

/**
 * The rule set. Every entry below is an UNREVIEWED DRAFT for a pharmacist to confirm, correct or
 * delete. Sources were opened on 2026-11-22; the notes say what they do and don't support.
 */
export const RULES: readonly ClinicalRule[] = [
  {
    id: "magnesium-myasthenia-gravis",
    version: 1,
    appliesTo: "Oral magnesium",
    match: {
      supplementIds: ["magnesium"],
      ingredients: ["magnesium oxide", "magnesium hydroxide", "magnesium citrate"],
    },
    condition: "myasthenia-gravis",
    priority: "caution",
    statement:
      "Magnesium can weaken the signal from nerves to muscles. A 2021 review of medicines that can worsen myasthenia gravis advises great caution with magnesium supplements, especially by injection, and the Myasthenia Gravis Foundation of America lists intravenous magnesium as potentially dangerous.",
    citations: [SHEIKH_2021, MGFA_CAUTIONARY],
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes:
      "Both sources emphasise injected (IV/parenteral) magnesium; neither addresses oral supplements specifically. Sheikh 2021 (section 3.4, Table 2) rates magnesium a 'definite' cause and advises caution with supplementation; MGFA lists IV magnesium only. Confirm whether the rule should cover oral supplements and laxative/antacid salts, and the priority.",
  },
  {
    id: "tetracyclines-myasthenia-gravis",
    version: 1,
    appliesTo: "Tetracycline antibiotics",
    match: { ingredients: ["doxycycline", "minocycline", "tetracycline", "demeclocycline"] },
    condition: "myasthenia-gravis",
    priority: "caution",
    // No statement or citation yet: the sources checked so far don't support a caution.
    statement: null,
    citations: [],
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes:
      "Raised because no US doxycycline label mentions myasthenia gravis. Sources checked do NOT support a caution: the MGFA Cautionary Drugs list does not include tetracyclines, and Sheikh 2021 (section 3.1E) found no clinical reports of worsening MG after tetracyclines. Keep only if a reviewer finds a published source that supports it; otherwise delete. Also confirm class members (omadacycline, sarecycline, eravacycline, tigecycline?).",
  },
];

/** What an item is, for matching rules: RxNorm ingredient names (medicines) or a supplement id. */
export interface RuleTarget {
  ingredients: readonly string[];
  supplementId?: string;
}

/** Published rules that apply to an item and a condition id. Drafts are never returned. */
export function matchingRules(
  target: RuleTarget,
  conditionId: string,
  rules: readonly ClinicalRule[] = RULES,
): PublishedRule[] {
  const names = new Set(target.ingredients.map((n) => n.toLowerCase()));
  return rules
    .filter(isPublished)
    .filter(
      (rule) =>
        rule.condition === conditionId &&
        ((rule.match.ingredients ?? []).some((n) => names.has(n)) ||
          (!!target.supplementId &&
            (rule.match.supplementIds ?? []).includes(target.supplementId))),
    );
}
