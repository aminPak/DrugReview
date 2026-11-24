/**
 * All user-facing wording, shared by the website and the mobile app.
 * To add a language, copy this file, translate the values and register it in `./index.ts`.
 */
export const en = {
  appName: "DrugReview",
  tagline:
    "Check your medicines and supplements against each other and against your health conditions, with the official sources.",
  disclaimer:
    "DrugReview gives general information. It is not medical advice and does not replace a doctor or pharmacist. Don't start, stop or change anything without talking to one.",

  home: {
    heroTitle: "Is it safe to take this, with what I already take and the conditions I have?",
    heroBody:
      "List your medicines, supplements and health conditions. We check them against official drug labels and show you exactly what the labels say, with a link to the source.",
    cta: "Check my medicines",
    stepsTitle: "How it works",
    steps: [
      {
        title: "List what you take and your conditions",
        body: "Prescriptions, over-the-counter medicines, supplements, and conditions like kidney disease or myasthenia gravis.",
      },
      {
        title: "We check everything together",
        body: "Every pair of items, and every item against your conditions, using the official label for each active ingredient.",
      },
      {
        title: "Read what the label says",
        body: "The exact sentence, its section and a link to the label, to discuss with your pharmacist.",
      },
    ],
    honestyTitle: "What this version does and doesn't do",
    honesty: [
      "It finds where official labels mention your other items or your conditions, and puts boxed warnings and contraindications first. It doesn't grade clinical severity.",
      "Labels don't list everything, and supplements have no label of their own. Nothing found doesn't mean safe.",
      "This early version uses US FDA labels, matched by active ingredient. Canadian product names and monographs are coming.",
      "Your list and health profile stay on your device. We don't store them.",
    ],
  },

  list: {
    title: "My list",
    emptyTitle: "Your list is empty",
    emptyBody: "Add the medicines and supplements you take, then check them.",
    add: "Add medicine or supplement",
    remove: "Remove",
    removeConfirm: (name: string) => `Remove ${name} from your list?`,
    check: "Run safety check",
    needMore: "Add two items, or one item and a health condition, to run a check.",
    medicine: "Medicine",
    supplement: "Supplement",
    alreadyAdded: "Already added",
  },

  profile: {
    title: "My health profile",
    intro:
      "Add your health conditions so every medicine and supplement is also checked against them. Stored only on this device.",
    emptyTitle: "No conditions added",
    emptyBody: "Add conditions like kidney disease, asthma, pregnancy or myasthenia gravis.",
    add: "Add condition",
    searchTitle: "Add a condition",
    placeholder: "Search, e.g. kidney disease or myasthenia",
    addCustom: (text: string) => `Add "${text}" as written`,
    customHint: "Not in the list? We'll search labels for exactly what you type.",
    custom: "Added as written",
    edit: "Edit",
    count: (n: number) => (n === 1 ? "1 condition" : `${n} conditions`),
  },

  search: {
    title: "Add to my list",
    placeholder: "Search, e.g. warfarin or ginkgo",
    medicines: "Medicines",
    supplements: "Supplements",
    conditions: "Conditions",
    noResults: "Nothing found. Check the spelling, or try the generic name.",
    typeMore: "Type at least 2 letters.",
    couldNotAdd: "We couldn't find that medicine in RxNorm. Try another name.",
    offline: "We couldn't reach the server. Check your connection and try again.",
  },

  results: {
    title: "Safety check",
    checking: "Checking official labels…",
    foundTitle: (count: number) =>
      count === 1
        ? "1 thing to discuss with your pharmacist"
        : `${count} things to discuss with your pharmacist`,
    noneFoundTitle: "No mentions found in the labels we checked",
    noneFoundBody:
      "This does not mean it's safe. Labels don't list everything, and often name drug groups (like \"NSAIDs\") instead of each medicine. Ask a pharmacist.",
    priority: {
      high: {
        title: "Serious warnings",
        tag: "Serious",
        body: 'In a boxed warning, a contraindication or a "do not use" instruction, a possible double dose, or rated serious by a reviewed rule.',
      },
      caution: {
        title: "Cautions",
        tag: "Caution",
        body: "In the label's warnings, precautions or interactions, or from a reviewed rule.",
      },
    },
    highAlertTitle: (count: number) =>
      count === 1 ? "1 serious warning" : `${count} serious warnings`,
    highAlertBody:
      "Talk to a pharmacist or doctor before you take these. Don't stop a prescribed medicine on your own.",
    cautionCount: (count: number) => (count === 1 ? "1 caution" : `${count} cautions`),
    rankingNote:
      "Ordered by the label section each finding is in, most serious first, with your conditions first. This is not a clinical severity grade.",
    noticesTitle: "Good to know",
    becauseYouHave: (condition: string) => `Because you have: ${condition}`,
    conditionCaution: (item: string, condition: string) =>
      `The ${item} label warns about ${condition.toLowerCase()}`,
    labelMention: (labelOf: string, other: string) => `The ${labelOf} label mentions ${other}`,
    reviewedRuleTag: "From a reviewed rule",
    reviewedRuleTitle: (item: string, condition: string) =>
      `A reviewed rule covers ${item} with ${condition.toLowerCase()}`,
    reviewedRuleBody:
      "This isn't from a drug label. It's a rule checked by a clinical reviewer, based on the published sources below.",
    ruleAppliesTo: (what: string) => `Applies to: ${what}`,
    ruleReviewed: (by: string, date: string, id: string, version: number) =>
      `Reviewed by ${by} on ${date} · rule ${id}, version ${version}`,
    ruleSourcesTitle: "Sources for this rule",
    viaIngredient: (ingredient: string, item: string) =>
      `This is from the label for ${ingredient}, a medicine form of ${item}.`,
    sameIngredient: (ingredient: string) => `Both contain ${ingredient}`,
    sameIngredientBody:
      "Taking two products with the same active ingredient can add up to too much. Check the total daily amount with a pharmacist.",
    inSection: (section: string) => `In "${section}"`,
    openLabel: "Open the official label",
    quietConditionsTitle: "Checked against your conditions, nothing found",
    quietConditionsBody:
      "Neither the labels we checked nor our reviewed rules mention these. That doesn't mean they're safe.",
    quietTitle: "Checked, no mention found",
    quietBody:
      "The labels we checked don't mention these. That doesn't mean they're safe together.",
    uncheckedTitle: "Not checked",
    uncheckedBody: "We couldn't check these. That doesn't mean they're safe.",
    uncheckedForConditions: (item: string) =>
      `${item}: no official label to check against your conditions.`,
    unchecked: {
      no_label_source: "Supplements have no official label to check against.",
      label_not_found: "We couldn't find an official label for this medicine.",
    },
    unavailableTitle: "We couldn't run the check",
    unavailableBody:
      "A data source didn't respond. Nothing was checked. Please try again in a moment.",
    retry: "Try again",
    sourcesTitle: "Sources",
    checkedAt: (when: string) => `Checked ${when}`,
    talkToPharmacist:
      "Before you change anything, talk to your doctor or pharmacist. Show them this list and your conditions.",
  },

  sections: {
    boxed_warning: "Boxed warning",
    contraindications: "Contraindications",
    warnings_and_cautions: "Warnings and precautions",
    warnings: "Warnings",
    precautions: "Precautions",
    drug_interactions: "Drug interactions",
    do_not_use: "Do not use",
    ask_doctor: "Ask a doctor before use",
    ask_doctor_or_pharmacist: "Ask a doctor or pharmacist before use",
    pregnancy_or_breast_feeding: "Pregnancy or breastfeeding",
  },

  notice: {
    title: "Before you start",
    points: [
      "DrugReview shows what official drug labels say about your medicines, supplements and health conditions. Boxed warnings and contraindications come first, but it doesn't grade clinical severity.",
      "This early version uses US FDA labels for each active ingredient. Canadian brand names may not appear yet; search the generic name instead.",
      "If nothing is found, that doesn't mean it's safe. Labels don't cover everything, and supplements have no label of their own.",
      "Your list and health profile are stored only on this device, and sent to our server only to run a check. We don't keep them.",
      "This is not medical advice. Talk to a doctor or pharmacist before changing anything.",
    ],
    accept: "I understand",
  },
};

export type Messages = typeof en;
