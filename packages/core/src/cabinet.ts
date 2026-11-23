import { z } from "zod";

/** What kind of product an item in a person's list is. */
export const ProductKind = z.enum(["prescription", "otc", "supplement"]);
export type ProductKind = z.infer<typeof ProductKind>;

/**
 * One item in a person's list of medications and supplements.
 * The codes link the item to a clinical knowledge base; the name alone is never enough
 * to run an interaction check.
 */
export const CabinetItem = z.object({
  name: z.string().trim().min(1).max(200),
  kind: ProductKind,
  /** RxNorm concept ID (US drugs). */
  rxcui: z.string().regex(/^\d+$/).optional(),
  /** NIH Dietary Supplement Label Database ID. */
  dsldId: z.string().regex(/^\d+$/).optional(),
  /** WHO ATC code, used to match drugs across countries. */
  atcCode: z
    .string()
    .regex(/^[A-Z]\d{2}[A-Z]{0,2}\d{0,2}$/)
    .optional(),
});
export type CabinetItem = z.infer<typeof CabinetItem>;
