import { z } from "zod";

/** What kind of product an item in a person's list is. */
export const ProductKind = z.enum(["medicine", "supplement"]);
export type ProductKind = z.infer<typeof ProductKind>;

const name = z.string().trim().min(1).max(200);

/** A prescription or over-the-counter medicine, identified by its RxNorm concept ID. */
export const MedicineItem = z.object({
  kind: z.literal("medicine"),
  name,
  rxcui: z.string().regex(/^\d+$/),
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
  return item.kind === "medicine" ? `medicine:${item.rxcui}` : `supplement:${item.supplementId}`;
}
