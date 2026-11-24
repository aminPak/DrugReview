import { z } from "zod";

/** What kind of product an item in a person's list is. */
export const ProductKind = z.enum(["medicine", "supplement"]);
export type ProductKind = z.infer<typeof ProductKind>;

const name = z.string().trim().min(1).max(200);

/**
 * A prescription or over-the-counter medicine. Identified by its RxNorm concept ID (a generic or
 * US name), or by its Canadian Drug Identification Number (a product from Health Canada's Drug
 * Product Database). A product with a `din` is checked through its active ingredients.
 */
export const MedicineItem = z
  .object({
    kind: z.literal("medicine"),
    name,
    rxcui: z.string().regex(/^\d+$/).optional(),
    din: z
      .string()
      .regex(/^\d{8}$/)
      .optional(),
  })
  .refine((item) => item.rxcui !== undefined || item.din !== undefined, {
    message: "A medicine needs an RxNorm ID or a DIN.",
  });
export type MedicineItem = z.infer<typeof MedicineItem>;

/** A supplement from the curated list in `supplements.ts`. */
export const SupplementItem = z.object({
  kind: z.literal("supplement"),
  name,
  supplementId: z.string().regex(/^[a-z0-9-]+$/),
});
export type SupplementItem = z.infer<typeof SupplementItem>;

/** One item in a person's list of medicines and supplements. */
export const CabinetItem = z.discriminatedUnion("kind", [MedicineItem, SupplementItem]);
export type CabinetItem = z.infer<typeof CabinetItem>;

/** A stable key for an item, used to avoid adding the same thing twice. */
export function itemKey(item: CabinetItem): string {
  if (item.kind === "supplement") return `supplement:${item.supplementId}`;
  return item.din ? `din:${item.din}` : `medicine:${item.rxcui}`;
}
