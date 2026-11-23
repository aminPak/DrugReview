import { z } from "zod";

import { CabinetItem } from "./cabinet";

export const MAX_ITEMS = 30;
export const MAX_CONDITIONS = 30;

/** A condition from the list in `conditions.ts`, or one the person typed themselves. */
export const ProfileCondition = z.union([
  z.object({ id: z.string().regex(/^[a-z0-9-]+$/) }),
  z.object({ custom: z.string().trim().min(3).max(80) }),
]);
export type ProfileCondition = z.infer<typeof ProfileCondition>;

/** The parts of a person's health profile the check uses. Stored on their device only. */
export const HealthProfile = z.object({
  conditions: z.array(ProfileCondition).max(MAX_CONDITIONS),
});
export type HealthProfile = z.infer<typeof HealthProfile>;

export const InteractionCheckRequest = z
  .object({
    items: z.array(CabinetItem).min(1).max(MAX_ITEMS),
    profile: HealthProfile.optional(),
  })
  .refine((r) => r.items.length >= 2 || (r.profile?.conditions.length ?? 0) > 0, {
    message: "Add at least two items, or one item and a health condition.",
  });
export type InteractionCheckRequest = z.infer<typeof InteractionCheckRequest>;

/**
 * Label sections, in the order they're searched for item-to-item mentions. The first section that
 * mentions the other item is the one reported. "Drug interactions" comes before the general
 * warnings because warnings also mention substances incidentally (for example calcium as a lab
 * value). Names follow openFDA's label fields.
 */
export const LabelSection = z.enum([
  "boxed_warning",
  "contraindications",
  "drug_interactions",
  "warnings_and_cautions",
  "warnings",
  "precautions",
  "do_not_use",
  "ask_doctor",
  "ask_doctor_or_pharmacist",
  "pregnancy_or_breast_feeding",
]);
export type LabelSection = z.infer<typeof LabelSection>;
export const LABEL_SECTIONS = LabelSection.options;

/** Sections searched for mentions of another medicine or supplement. */
export const INTERACTION_SECTIONS: readonly LabelSection[] = [
  "boxed_warning",
  "contraindications",
  "drug_interactions",
  "warnings_and_cautions",
  "warnings",
  "precautions",
  "do_not_use",
  "ask_doctor_or_pharmacist",
];

export const Source = z.object({
  name: z.string(),
  url: z.url(),
});
export type Source = z.infer<typeof Source>;

const Index = z.number().int().nonnegative();
const Pair = z.tuple([Index, Index]);

/** The official label of one item mentions the other item. */
export const LabelMention = z.object({
  type: z.literal("label_mention"),
  /** Indexes into the request's `items`. */
  between: Pair,
  /** Index of the item whose label contains the mention. */
  labelOf: Index,
  /**
   * Set when the label belongs to a form of a supplement (e.g. "magnesium sulfate" for magnesium),
   * so the app can say whose label it is.
   */
  viaIngredient: z.string().optional(),
  section: LabelSection,
  /** The sentence from the label, quoted as written. */
  excerpt: z.string(),
  source: Source,
});
export type LabelMention = z.infer<typeof LabelMention>;

/** Two items contain the same active ingredient, which can mean taking a double dose. */
export const SameIngredient = z.object({
  type: z.literal("same_ingredient"),
  between: Pair,
  ingredient: z.string(),
});
export type SameIngredient = z.infer<typeof SameIngredient>;

/** The official label of an item warns about a condition in the person's profile. */
export const ConditionCaution = z.object({
  type: z.literal("condition_caution"),
  /** Index into the request's `items`. */
  item: Index,
  /** Index into the request's `profile.conditions`. */
  condition: Index,
  viaIngredient: z.string().optional(),
  section: LabelSection,
  excerpt: z.string(),
  source: Source,
});
export type ConditionCaution = z.infer<typeof ConditionCaution>;

export const Finding = z.discriminatedUnion("type", [
  LabelMention,
  SameIngredient,
  ConditionCaution,
]);
export type Finding = z.infer<typeof Finding>;
export type PairFinding = LabelMention | SameIngredient;

export const UncheckedReason = z.enum([
  /** Both items are supplements, which have no official label to check. */
  "no_label_source",
  /** We couldn't find an official label for the medicine(s) involved. */
  "label_not_found",
]);
export type UncheckedReason = z.infer<typeof UncheckedReason>;

export const UncheckedPair = z.object({ between: Pair, reason: UncheckedReason });
export type UncheckedPair = z.infer<typeof UncheckedPair>;

/**
 * Result of a safety check.
 *
 * "checked" lists what the sources say, which pairs couldn't be checked and which items couldn't
 * be checked against the person's conditions. An empty `findings` list means "nothing found in the
 * sources we checked", never "safe".
 * "unavailable" means the check could not run (for example, a source didn't respond). Apps must
 * show it as "we couldn't check this", never as "no interactions found".
 */
export const InteractionCheckResult = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("checked"),
    findings: z.array(Finding),
    unchecked: z.array(UncheckedPair),
    /** Items with no label to check against the profile's conditions (indexes into `items`). */
    uncheckedForConditions: z.array(Index).default([]),
    /** How many pairs were compared against at least one label. */
    checkedPairs: z.number().int().nonnegative(),
    sources: z.array(Source),
    checkedAt: z.iso.datetime(),
  }),
  z.object({
    status: z.literal("unavailable"),
    reason: z.string(),
  }),
]);
export type InteractionCheckResult = z.infer<typeof InteractionCheckResult>;
export type CheckedResult = Extract<InteractionCheckResult, { status: "checked" }>;

/** A check needs two items, or one item and a condition to check it against. */
export function canRunCheck(itemCount: number, conditionCount: number): boolean {
  return itemCount >= 2 || (itemCount >= 1 && conditionCount >= 1);
}

/** Every unordered pair of indexes for a list of `n` items. */
export function allPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  return pairs;
}
