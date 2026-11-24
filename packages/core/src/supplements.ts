import type { MatchOptions } from "./matching";

/**
 * Common supplement ingredients and the other names they appear under in drug labels.
 *
 * This is a vocabulary, not clinical content: it only says what a supplement is called, so the
 * API can find where official labels mention it. Add names here when a label uses a spelling we
 * miss. `ignoreWhenFollowedBy` stops matches like "calcium channel blockers" for calcium.
 */
export interface Supplement {
  id: string;
  name: string;
  aliases: readonly string[];
  /**
   * Use only these phrases when searching labels. For minerals like calcium or iron, the bare
   * word appears everywhere (lab values, disease names), so only supplement-specific phrases count.
   */
  searchTerms?: readonly string[];
  /** Regular expression sources for wording a fixed phrase can't cover (see `MatchOptions`). */
  searchPatterns?: readonly string[];
  ignoreWhenFollowedBy?: readonly string[];
}

export const SUPPLEMENTS: readonly Supplement[] = [
  { id: "ashwagandha", name: "Ashwagandha", aliases: ["withania somnifera"] },
  { id: "berberine", name: "Berberine", aliases: [] },
  { id: "biotin", name: "Biotin", aliases: ["vitamin b7"] },
  { id: "black-cohosh", name: "Black cohosh", aliases: ["cimicifuga", "actaea racemosa"] },
  { id: "caffeine", name: "Caffeine", aliases: [] },
  {
    id: "calcium",
    name: "Calcium",
    aliases: ["calcium carbonate", "calcium citrate"],
    searchPatterns: [mineralInList("calcium")],
    searchTerms: mineral("calcium", ["calcium carbonate", "calcium citrate"]),
  },
  { id: "cbd", name: "CBD (cannabidiol)", aliases: ["cannabidiol"] },
  { id: "coq10", name: "Coenzyme Q10", aliases: ["coq10", "ubiquinone", "ubidecarenone"] },
  { id: "cranberry", name: "Cranberry", aliases: [] },
  { id: "dhea", name: "DHEA", aliases: ["dehydroepiandrosterone"] },
  { id: "echinacea", name: "Echinacea", aliases: [] },
  {
    id: "fish-oil",
    name: "Fish oil (omega-3)",
    aliases: ["fish oil", "omega-3", "omega 3", "epa", "dha"],
  },
  { id: "folic-acid", name: "Folic acid", aliases: ["folate", "vitamin b9"] },
  { id: "garlic", name: "Garlic", aliases: ["allium sativum"] },
  { id: "ginger", name: "Ginger", aliases: [] },
  { id: "ginkgo", name: "Ginkgo biloba", aliases: ["ginkgo"] },
  { id: "ginseng", name: "Ginseng", aliases: ["panax"] },
  { id: "glucosamine", name: "Glucosamine", aliases: [] },
  { id: "goldenseal", name: "Goldenseal", aliases: ["hydrastis"] },
  { id: "green-tea", name: "Green tea extract", aliases: ["green tea", "egcg"] },
  {
    id: "iron",
    name: "Iron",
    aliases: ["ferrous sulfate", "ferrous fumarate", "ferrous gluconate"],
    searchPatterns: [mineralInList("iron")],
    searchTerms: mineral("iron", [
      "ferrous sulfate",
      "ferrous fumarate",
      "ferrous gluconate",
      "ferrous salts",
    ]),
  },
  { id: "kava", name: "Kava", aliases: ["piper methysticum"] },
  { id: "licorice", name: "Licorice root", aliases: ["licorice", "liquorice", "glycyrrhiza"] },
  {
    id: "magnesium",
    name: "Magnesium",
    aliases: [],
    searchPatterns: [mineralInList("magnesium")],
    searchTerms: mineral("magnesium", [
      "magnesium hydroxide",
      "magnesium oxide",
      "magnesium citrate",
    ]),
  },
  { id: "melatonin", name: "Melatonin", aliases: [] },
  { id: "milk-thistle", name: "Milk thistle", aliases: ["silymarin", "silybum"] },
  {
    id: "niacin",
    name: "Niacin (vitamin B3)",
    aliases: ["niacin", "nicotinic acid", "vitamin b3"],
  },
  {
    id: "potassium",
    name: "Potassium",
    aliases: ["potassium chloride"],
    searchTerms: mineral("potassium", [
      "potassium chloride",
      "potassium citrate",
      "salt substitutes",
    ]),
  },
  {
    id: "probiotics",
    name: "Probiotics",
    aliases: ["probiotic", "lactobacillus", "bifidobacterium"],
  },
  { id: "red-yeast-rice", name: "Red yeast rice", aliases: ["monascus purpureus"] },
  // The display name includes the full name: "same" on its own would match the ordinary word.
  {
    id: "same",
    name: "SAMe (S-adenosylmethionine)",
    aliases: ["s-adenosylmethionine", "s-adenosyl methionine"],
  },
  { id: "saw-palmetto", name: "Saw palmetto", aliases: ["serenoa repens"] },
  {
    id: "st-johns-wort",
    name: "St. John's wort",
    aliases: ["st john's wort", "st. johns wort", "saint john's wort", "hypericum"],
  },
  { id: "turmeric", name: "Turmeric (curcumin)", aliases: ["turmeric", "curcumin"] },
  { id: "tryptophan", name: "L-tryptophan", aliases: ["tryptophan"] },
  { id: "5-htp", name: "5-HTP", aliases: ["5-hydroxytryptophan"] },
  { id: "valerian", name: "Valerian", aliases: ["valeriana"] },
  { id: "vitamin-a", name: "Vitamin A", aliases: ["retinol"] },
  { id: "vitamin-b6", name: "Vitamin B6", aliases: ["pyridoxine"] },
  { id: "vitamin-b12", name: "Vitamin B12", aliases: ["cyanocobalamin", "methylcobalamin"] },
  { id: "vitamin-c", name: "Vitamin C", aliases: ["ascorbic acid"] },
  {
    id: "vitamin-d",
    name: "Vitamin D",
    aliases: ["cholecalciferol", "ergocalciferol", "vitamin d3"],
  },
  { id: "vitamin-e", name: "Vitamin E", aliases: ["tocopherol"] },
  { id: "vitamin-k", name: "Vitamin K", aliases: ["phytonadione", "menaquinone"] },
  { id: "yohimbine", name: "Yohimbe", aliases: ["yohimbine"] },
  {
    id: "zinc",
    name: "Zinc",
    aliases: [],
    searchPatterns: [mineralInList("zinc")],
    searchTerms: mineral("zinc", ["zinc sulfate", "zinc gluconate"]),
  },
];

/** Supplement-specific phrases for a mineral whose bare name is too common in labels. */
function mineral(word: string, salts: string[]): string[] {
  return [
    ...salts,
    `${word} supplement`,
    `${word} supplements`,
    `${word}-containing`,
    `${word} containing`,
    `containing ${word}`,
    `${word} salts`,
    `${word} products`,
    `oral ${word}`,
    `${word}/aluminum`,
    `aluminum/${word}`,
    // Labels often group minerals together, e.g. ciprofloxacin's "multivalent cation-containing
    // products". These phrases apply to calcium, iron, magnesium and zinc alike.
    // (Declared inside the function: SUPPLEMENTS above calls this while the module loads.)
    ...(["calcium", "iron", "magnesium", "zinc"].includes(word)
      ? [
          "multivalent cation",
          "multivalent cations",
          "multivalent cation-containing",
          "polyvalent cation",
          "polyvalent cations",
          "divalent cation",
          "divalent cations",
          "di- and trivalent cations",
          "metal cations",
        ]
      : []),
  ];
}

/**
 * A mineral anywhere in a list of minerals that follows "containing" or "antacid(s)", e.g.
 * "antacids containing aluminum, calcium, or magnesium" (tetracycline labels). Lists elsewhere,
 * such as "serum calcium and magnesium", are lab values and don't count.
 */
function mineralInList(word: string): string {
  // (Declared inside the function: SUPPLEMENTS above calls this while the module loads.)
  const minerals = "aluminum|aluminium|bismuth|calcium|iron|magnesium|zinc";
  const listed = `(?:${minerals})(?:-containing)?(?:\\s*,\\s*|\\s+)(?:(?:and|or|and/or)\\s+)?`;
  return `(?:containing|antacids?)\\s+(?:${listed})*${word}`;
}

/** How to match a supplement's terms in label text. */
export function supplementMatchOptions(supplement: Supplement | undefined): MatchOptions {
  return {
    ignoreWhenFollowedBy: supplement?.ignoreWhenFollowedBy ?? [],
    patterns: supplement?.searchPatterns ?? [],
  };
}

/**
 * Supplements have no label of their own, but many of their ingredients are also sold as
 * medicines with an official label (for example magnesium sulfate, or phytonadione for vitamin K).
 * Those labels are searched for this supplement, and findings say which form the label is for.
 */
const LABEL_INGREDIENTS: Readonly<Record<string, readonly string[]>> = {
  caffeine: ["caffeine"],
  calcium: ["calcium carbonate"],
  cbd: ["cannabidiol"],
  "fish-oil": ["omega-3-acid ethyl esters"],
  "folic-acid": ["folic acid"],
  iron: ["ferrous sulfate"],
  magnesium: ["magnesium sulfate", "magnesium hydroxide", "magnesium oxide"],
  melatonin: [],
  niacin: ["niacin"],
  potassium: ["potassium chloride"],
  "vitamin-b12": ["cyanocobalamin"],
  "vitamin-d": ["ergocalciferol", "cholecalciferol"],
  "vitamin-k": ["phytonadione"],
  zinc: ["zinc sulfate"],
};

/** Medicine forms of a supplement whose official labels can be searched. */
export function supplementLabelIngredients(supplement: Supplement): readonly string[] {
  return LABEL_INGREDIENTS[supplement.id] ?? [];
}

const byId = new Map(SUPPLEMENTS.map((s) => [s.id, s]));

export function getSupplement(id: string): Supplement | undefined {
  return byId.get(id);
}

/** The phrases to look for in labels, in lower case. */
export function supplementTerms(supplement: Supplement): string[] {
  const terms = supplement.searchTerms ?? [supplement.name, ...supplement.aliases];
  return terms.map((term) => term.toLowerCase());
}

/** Every name a supplement is known by, for search boxes. */
function displayTerms(supplement: Supplement): string[] {
  return [supplement.name, ...supplement.aliases].map((term) => term.toLowerCase());
}

/** Supplements whose name or alias contains the query, best matches first. */
export function searchSupplements(query: string, limit = 8): Supplement[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const scored: { supplement: Supplement; score: number }[] = [];
  for (const supplement of SUPPLEMENTS) {
    const terms = displayTerms(supplement);
    if (terms.some((t) => t.startsWith(q))) scored.push({ supplement, score: 0 });
    else if (terms.some((t) => t.split(/[\s(-]+/).some((word) => word.startsWith(q))))
      scored.push({ supplement, score: 1 });
    else if (terms.some((t) => t.includes(q))) scored.push({ supplement, score: 2 });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.supplement.name.localeCompare(b.supplement.name))
    .slice(0, limit)
    .map((s) => s.supplement);
}
