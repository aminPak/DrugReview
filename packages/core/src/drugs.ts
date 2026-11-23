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
