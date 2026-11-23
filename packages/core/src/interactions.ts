import { z } from "zod";

import { CabinetItem } from "./cabinet";

export const InteractionSeverity = z.enum(["contraindicated", "major", "moderate", "minor"]);
export type InteractionSeverity = z.infer<typeof InteractionSeverity>;

export const InteractionCheckRequest = z.object({
  items: z.array(CabinetItem).min(2).max(50),
});
export type InteractionCheckRequest = z.infer<typeof InteractionCheckRequest>;

export const Source = z.object({
  name: z.string(),
  url: z.url().optional(),
});
export type Source = z.infer<typeof Source>;

export const Interaction = z.object({
  /** Indexes into the request's `items`. */
  between: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
  severity: InteractionSeverity,
  /** Plain-language summary. Written or reviewed by a clinician, or generated from cited sources. */
  summary: z.string(),
  sources: z.array(Source).min(1),
});
export type Interaction = z.infer<typeof Interaction>;

/**
 * Result of an interaction check.
 *
 * "unavailable" means the check could not run (for example, no knowledge base is connected or an
 * item could not be matched). Apps must show it as "we couldn't check this", never as "no
 * interactions found". Only a "checked" result with an empty list means nothing was found.
 */
export const InteractionCheckResult = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("checked"),
    interactions: z.array(Interaction),
    knowledgeBase: z.object({ name: z.string(), version: z.string() }),
    checkedAt: z.iso.datetime(),
  }),
  z.object({
    status: z.literal("unavailable"),
    reason: z.string(),
  }),
]);
export type InteractionCheckResult = z.infer<typeof InteractionCheckResult>;
