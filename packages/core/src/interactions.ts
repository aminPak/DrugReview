import { z } from "zod";

import { CabinetItem } from "./cabinet";

export const MAX_ITEMS = 30;

export const InteractionCheckRequest = z.object({
  items: z.array(CabinetItem).min(2).max(MAX_ITEMS),
});
export type InteractionCheckRequest = z.infer<typeof InteractionCheckRequest>;

/**
 * Label sections, in the order they're searched. The first section that mentions the other item
 * is the one reported. "Drug interactions" comes before the general warnings because warnings
 * also mention substances incidentally (for example calcium as a lab value).
 * Names follow openFDA's label fields.
 */
export const LabelSection = z.enum([
  "boxed_warning",
  "contraindications",
  "drug_interactions",
  "warnings_and_cautions",
  "warnings",
  "precautions",
  "do_not_use",
  "ask_doctor_or_pharmacist",
]);
export type LabelSection = z.infer<typeof LabelSection>;
export const LABEL_SECTIONS = LabelSection.options;

export const Source = z.object({
  name: z.string(),
  url: z.url(),
});
export type Source = z.infer<typeof Source>;

const Pair = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]);

/** The official label of one item mentions the other item. */
export const LabelMention = z.object({
  type: z.literal("label_mention"),
  /** Indexes into the request's `items`. */
  between: Pair,
  /** Index of the item whose label contains the mention. */
  labelOf: z.number().int().nonnegative(),
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

export const Finding = z.discriminatedUnion("type", [LabelMention, SameIngredient]);
export type Finding = z.infer<typeof Finding>;

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
 * Result of an interaction check.
 *
 * "checked" lists what the sources say and which pairs couldn't be checked. An empty `findings`
 * list means "nothing found in the sources we checked", never "safe".
 * "unavailable" means the check could not run (for example, a source didn't respond). Apps must
 * show it as "we couldn't check this", never as "no interactions found".
 */
export const InteractionCheckResult = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("checked"),
    findings: z.array(Finding),
    unchecked: z.array(UncheckedPair),
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

/** Every unordered pair of indexes for a list of `n` items. */
export function allPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  return pairs;
}
