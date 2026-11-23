/**
 * All user-facing wording, shared by the website and the mobile app.
 * To add a language, copy this file, translate the values and register it in `./index.ts`.
 */
export const en = {
  appName: "DrugReview",
  tagline: "Check your medicines and supplements against each other, with the official sources.",
  disclaimer:
    "DrugReview gives general information. It is not medical advice and does not replace a doctor or pharmacist. Don't start, stop or change anything without talking to one.",

  home: {
    heroTitle: "Is it safe to take this with what I already take?",
    heroBody:
      "List your medicines and supplements. We check every pair against official drug labels and show you exactly what they say, with a link to the source.",
    cta: "Check my medicines",
    stepsTitle: "How it works",
    steps: [
      {
        title: "List what you take",
        body: "Prescriptions, over-the-counter medicines and supplements.",
      },
      {
        title: "We check every pair",
        body: "Against the official label for each active ingredient.",
      },
      {
        title: "Read what the label says",
        body: "The exact sentence, its section and a link to the label.",
      },
    ],
    honestyTitle: "What this version does and doesn't do",
    honesty: [
      "It finds where official labels mention your other items. It doesn't grade how serious an interaction is.",
      "Labels don't list every interaction, and supplements have no official label. Nothing found doesn't mean safe.",
      "This early version uses US FDA labels, matched by active ingredient. Canadian product names and monographs are coming.",
      "Your list stays on your device. We don't store it.",
    ],
  },

  list: {
    title: "My list",
    emptyTitle: "Your list is empty",
    emptyBody: "Add the medicines and supplements you take, then check them against each other.",
    add: "Add medicine or supplement",
    remove: "Remove",
    removeConfirm: (name: string) => `Remove ${name} from your list?`,
    check: "Check interactions",
    needTwo: "Add at least two items to check them against each other.",
    medicine: "Medicine",
    supplement: "Supplement",
    alreadyAdded: "Already in your list",
  },

  search: {
    title: "Add to my list",
    placeholder: "Search, e.g. warfarin or ginkgo",
    medicines: "Medicines",
    supplements: "Supplements",
    noResults: "Nothing found. Check the spelling, or try the generic name.",
    typeMore: "Type at least 2 letters.",
    couldNotAdd: "We couldn't find that medicine in RxNorm. Try another name.",
    offline: "We couldn't reach the server. Check your connection and try again.",
  },

  results: {
    title: "Interaction check",
    checking: "Checking official labels…",
    foundTitle: (count: number) =>
      count === 1
        ? "1 thing to discuss with your pharmacist"
        : `${count} things to discuss with your pharmacist`,
    noneFoundTitle: "No mentions found in the labels we checked",
    noneFoundBody:
      'This does not mean these items are safe together. Labels don\'t list every interaction, and often name drug groups (like "NSAIDs") instead of each medicine. Ask a pharmacist.',
    labelMention: (labelOf: string, other: string) => `The ${labelOf} label mentions ${other}`,
    sameIngredient: (ingredient: string) => `Both contain ${ingredient}`,
    sameIngredientBody:
      "Taking two products with the same active ingredient can add up to too much. Check the total daily amount with a pharmacist.",
    inSection: (section: string) => `In "${section}"`,
    openLabel: "Open the official label",
    quietTitle: "Checked, no mention found",
    quietBody:
      "The labels we checked don't mention these pairs. That doesn't mean they're safe together.",
    uncheckedTitle: "Not checked",
    uncheckedBody: "We couldn't check these pairs. That doesn't mean they're safe together.",
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
      "Before you change anything, talk to your doctor or pharmacist. Show them this list.",
  },

  sections: {
    boxed_warning: "Boxed warning",
    contraindications: "Contraindications",
    warnings_and_cautions: "Warnings and precautions",
    warnings: "Warnings",
    precautions: "Precautions",
    drug_interactions: "Drug interactions",
    do_not_use: "Do not use",
    ask_doctor_or_pharmacist: "Ask a doctor or pharmacist before use",
  },

  notice: {
    title: "Before you start",
    points: [
      "DrugReview shows what official drug labels say about the items in your list. It doesn't grade how serious an interaction is.",
      "This early version uses US FDA labels for each active ingredient. Canadian brand names may not appear yet; search the generic name instead.",
      "If nothing is found, that doesn't mean it's safe. Labels don't cover everything, and supplements have no official label.",
      "Your list is stored only on this device.",
      "This is not medical advice. Talk to a doctor or pharmacist before changing anything.",
    ],
    accept: "I understand",
  },
};

export type Messages = typeof en;
