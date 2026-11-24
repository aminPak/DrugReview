import type {
  Ingredient,
  ProductIngredient,
  ProductSearchResult,
  ResolvedProduct,
} from "@drugreview/core";

import { DAY_MS, getJson, mapLimit, TtlCache } from "./http";
import type { RxNorm } from "./rxnorm";

const BASE = "https://health-products.canada.ca/api/drug";
const SOURCE = "Health Canada DPD";
/** Candidates whose status is looked up per search. Cancelled products are common and filtered out. */
const MAX_CANDIDATES = 30;
const CONCURRENCY = 8;

interface DpdProduct {
  drug_code: number;
  class_name: string;
  drug_identification_number: string;
  brand_name: string;
  company_name: string;
}
interface DpdIngredient {
  ingredient_name: string;
  strength: string;
  strength_unit: string;
}
interface DpdStatus {
  status: string;
}

const MARKETED = "Marketed";

/**
 * Canadian products from Health Canada's Drug Product Database (DPD), by brand name or DIN, with
 * their active ingredients matched to RxNorm so the label check can use them.
 *
 * The DPD API has no name-prefix search and lists cancelled products too, so a search reads the
 * matching products, keeps human medicines that are marketed, and looks up their ingredients.
 */
export class Dpd {
  private readonly byDin = new TtlCache<DpdProduct | null>(DAY_MS);
  private readonly ingredientCache = new TtlCache<ProductIngredient[]>(DAY_MS);
  private readonly statusCache = new TtlCache<string>(DAY_MS);
  private readonly resolved = new TtlCache<ResolvedProduct | null>(DAY_MS);

  constructor(private readonly rxnorm: Pick<RxNorm, "resolve">) {}

  async searchProducts(query: string, limit: number): Promise<ProductSearchResult[]> {
    const q = query.trim();
    if (/^\d{5,8}$/.test(q)) {
      // A DIN is exact, and is accepted whatever its status: an old bottle may still be in use.
      const product = await this.product(q.padStart(8, "0"));
      return product ? [await this.toResult(product)] : [];
    }
    if (q.length < 3) return [];

    const found =
      (await getJson<DpdProduct[]>(
        SOURCE,
        `${BASE}/drugproduct/?lang=en&type=json&brandname=${encodeURIComponent(q)}`,
      )) ?? [];
    const lower = q.toLowerCase();
    const candidates = found
      .filter((p) => p.class_name === "Human")
      .sort(
        (a, b) =>
          rank(a.brand_name, lower) - rank(b.brand_name, lower) ||
          a.brand_name.length - b.brand_name.length,
      )
      .slice(0, MAX_CANDIDATES);

    const statuses = await mapLimit(candidates, CONCURRENCY, (p) => this.status(p.drug_code));
    const marketed = candidates.filter((_, i) => statuses[i] === MARKETED);

    // Same brand, same ingredients and strengths: only the DIN differs. Show it once.
    const seen = new Set<string>();
    const results: ProductSearchResult[] = [];
    const withIngredients = await mapLimit(marketed, CONCURRENCY, (p) => this.toResult(p));
    for (const result of withIngredients) {
      const signature = `${result.name}|${result.ingredients.map((i) => `${i.name} ${i.strength}`).join(",")}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      results.push(result);
      if (results.length >= limit) break;
    }
    return results;
  }

  /** A product with its active ingredients matched to RxNorm. Null if the DIN isn't in the DPD. */
  resolveProduct(din: string): Promise<ResolvedProduct | null> {
    return this.resolved.get(din, async () => {
      const product = await this.product(din);
      if (!product) return null;
      const listed = await this.ingredients(product.drug_code);

      const matched = new Map<string, Ingredient>();
      const unmatched: string[] = [];
      for (const { name } of listed) {
        const drug = await this.rxnorm.resolve(name);
        if (!drug || drug.ingredients.length === 0) unmatched.push(name.toLowerCase());
        else drug.ingredients.forEach((i) => matched.set(i.rxcui, i));
      }
      return {
        din,
        name: product.brand_name,
        ingredients: [...matched.values()],
        unmatched,
      };
    });
  }

  private product(din: string): Promise<DpdProduct | null> {
    return this.byDin.get(din, async () => {
      const list = await getJson<DpdProduct[]>(
        SOURCE,
        `${BASE}/drugproduct/?lang=en&type=json&din=${din}`,
      );
      return list?.[0] ?? null;
    });
  }

  private ingredients(drugCode: number): Promise<ProductIngredient[]> {
    return this.ingredientCache.get(String(drugCode), async () => {
      const list =
        (await getJson<DpdIngredient[]>(
          SOURCE,
          `${BASE}/activeingredient/?lang=en&type=json&id=${drugCode}`,
        )) ?? [];
      return list.map((i) => ({
        name: i.ingredient_name.toLowerCase(),
        strength: [i.strength, i.strength_unit].filter(Boolean).join(" "),
      }));
    });
  }

  private status(drugCode: number): Promise<string> {
    return this.statusCache.get(String(drugCode), async () => {
      const status = await getJson<DpdStatus>(
        SOURCE,
        `${BASE}/status/?lang=en&type=json&id=${drugCode}`,
      );
      return status?.status ?? "";
    });
  }

  private async toResult(product: DpdProduct): Promise<ProductSearchResult> {
    return {
      din: product.drug_identification_number,
      name: product.brand_name,
      company: product.company_name,
      ingredients: await this.ingredients(product.drug_code),
    };
  }
}

/** Brands starting with the query first, then brands where a word starts with it, then the rest. */
function rank(brand: string, query: string): number {
  const name = brand.toLowerCase();
  if (name.startsWith(query)) return 0;
  return name.includes(` ${query}`) || name.includes(`-${query}`) ? 1 : 2;
}
