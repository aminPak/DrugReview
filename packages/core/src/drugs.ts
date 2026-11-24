import { z } from "zod";

export const DrugSearchResponse = z.object({
  results: z.array(z.string()),
});
export type DrugSearchResponse = z.infer<typeof DrugSearchResponse>;

export const Ingredient = z.object({ rxcui: z.string(), name: z.string() });
export type Ingredient = z.infer<typeof Ingredient>;

export const ResolvedDrug = z.object({
  rxcui: z.string(),
  name: z.string(),
  ingredients: z.array(Ingredient),
});
export type ResolvedDrug = z.infer<typeof ResolvedDrug>;

/** A Drug Identification Number: the 8-digit code on every drug licensed in Canada. */
export const Din = z.string().regex(/^\d{8}$/);

/** One active ingredient of a Canadian product, with its strength as Health Canada lists it. */
export const ProductIngredient = z.object({
  name: z.string(),
  /** For example "400 MG". Empty when Health Canada doesn't list one. */
  strength: z.string(),
});
export type ProductIngredient = z.infer<typeof ProductIngredient>;

/** A product from Health Canada's Drug Product Database, as shown in search results. */
export const ProductSearchResult = z.object({
  din: Din,
  name: z.string(),
  company: z.string(),
  ingredients: z.array(ProductIngredient),
});
export type ProductSearchResult = z.infer<typeof ProductSearchResult>;

export const ProductSearchResponse = z.object({ results: z.array(ProductSearchResult) });
export type ProductSearchResponse = z.infer<typeof ProductSearchResponse>;

/**
 * A Canadian product with its active ingredients matched to RxNorm, which the label check uses.
 * `unmatched` lists ingredients RxNorm didn't recognise: they are not checked, and the apps say so.
 */
export const ResolvedProduct = z.object({
  din: Din,
  name: z.string(),
  ingredients: z.array(Ingredient),
  unmatched: z.array(z.string()),
});
export type ResolvedProduct = z.infer<typeof ResolvedProduct>;

/** "ADVIL CAPLETS" → "Advil Caplets". Health Canada writes brand names in capitals. */
export function titleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /(^|[\s(/-])([a-z])/g,
      (_, before: string, letter: string) => before + letter.toUpperCase(),
    );
}
