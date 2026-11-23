# Context-aware safety checks

The safety check doesn't look at medicines in isolation. It checks everything a person takes **against each other and against their health profile**: their conditions and life stage now, and later their lab results, allergies and diet.

Example: for someone with **myasthenia gravis**, it flags:

- ciprofloxacin and levofloxacin (boxed warning: "exacerbation of myasthenia gravis")
- azithromycin ("may exacerbate muscle weakness")
- gentamicin ("use with caution in … myasthenia gravis")
- magnesium, from the magnesium sulfate label ("contraindicated in patients … with myasthenia gravis")

Each finding quotes the label sentence and links to the label.

## What it checks

| Check                 | Question it answers                                                               | Since            |
| --------------------- | --------------------------------------------------------------------------------- | ---------------- |
| **Item × item**       | Does one item's official label mention another item I take?                       | v1               |
| **Same ingredient**   | Do two of my products contain the same active ingredient (risk of a double dose)? | v1               |
| **Item × condition**  | Does an item's official label warn about a condition in my profile?               | v1 (this change) |
| **Item × life stage** | Pregnancy, breastfeeding, age 65+                                                 | v1 (this change) |
| **Item × lab values** | E.g. kidney function (eGFR) or potassium from my lab results                      | v3               |
| **Item × allergy**    | Drug-class allergies (e.g. penicillins)                                           | v2               |
| **Item × food**       | Grapefruit, alcohol, vitamin K-rich foods, tyramine, dairy timing                 | v2               |

## The health profile

- About 40 **common, interaction-relevant conditions** (`packages/core/src/conditions.ts`), grouped by body system, each with the phrases labels use for it. For example, kidney disease is searched as "renal impairment", "renal failure", "kidney disease" and so on.
- **Life stages:** pregnant or planning, breastfeeding, age 65+. These are searched only in the serious sections, because nearly every label has a general pregnancy section.
- **Anything else, typed as written.** Labels are searched for exactly that phrase, so rare conditions (for example Lambert-Eaton syndrome) are still covered.
- **Stored only on the device.** It's sent to the API only to run a check, as condition IDs or the typed text, and isn't logged or kept.

Clinical review should check the phrases and map each condition to SNOMED CT Canadian Edition / ICD-10-CA codes, so a licensed knowledge base can be plugged in later.

## How the condition check works

1. For each medicine, the API reads up to three of the newest, most relevant labels for each active ingredient. Labels with identical warning text count once.
2. **Supplements** have no label of their own, so the labels of their medicine forms are used (magnesium → magnesium sulfate, oxide and hydroxide; vitamin K → phytonadione; and so on). The finding says which form the label is for.
3. For each item and each condition, the serious sections are searched, most serious first: boxed warning, contraindications, warnings and precautions, warnings, precautions, "do not use", "ask a doctor before use".
4. **If none of those labels mention the condition, the API asks openFDA for _any_ label of that ingredient that does.** Manufacturers' labels differ: only 5 of 128 magnesium sulfate labels mention myasthenia gravis, and none of them are among the newest.
5. One finding per item and condition: the most serious section, with the quoted sentence and a link to the label.
6. Items with no label are listed as "not checked against your conditions", never as safe.

Results show **"For your health conditions"** first, grouped as "Because you have: …", then findings between items, then what was checked with nothing found, then what couldn't be checked.

## Making it more intelligent: the layers

Each layer adds to the one before it. None of them removes the rule that every finding has a source and that "nothing found" is never "safe".

| Layer                            | What it adds                                                                                                                                                                                                                                                                                    | Status        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **1. Label evidence**            | What official labels say about each pair and each condition, quoted and linked                                                                                                                                                                                                                  | **Built**     |
| **2. Licensed knowledge base**   | Graded severity and management advice: First Databank or Medi-Span drug–disease contraindication modules, Natural Medicines for supplement–disease interactions. Covers what labels phrase as drug _classes_ ("NSAIDs", "QT-prolonging drugs")                                                  | Before launch |
| **3. Clinically reviewed rules** | A small set of rules written and signed off by pharmacists for gaps that matter in practice (for example oral magnesium in myasthenia gravis, potassium supplements in kidney disease). Each rule is cited, versioned and has a reviewer                                                        | Before launch |
| **4. Personal measurements**     | Lab results set conditions automatically after the person confirms them (eGFR under 30 → severe kidney impairment; high potassium). Age from date of birth. Allergies by drug class                                                                                                             | v2–v3         |
| **5. AI explanation (Claude)**   | Plain-language, personal explanations ("Because you have myasthenia gravis, the ciprofloxacin label warns…"), questions to ask the pharmacist, a short summary ranked by severity, translation. Also turns free text ("my kidneys are weak") into a profile condition for the person to confirm | v2            |
| **6. Food**                      | The same matching against labels, which already mention grapefruit juice, alcohol and vitamin K                                                                                                                                                                                                 | v2            |

**Rules for the AI layer:**

- It only explains findings from layers 1–4.
- It never adds a finding, never decides a combination is safe, and never gives a dose.
- Every explanation shows the source sentence it's based on.

## Regulatory note

Warnings personalised to a person's conditions bring the product closer to **clinical decision support**, which Health Canada may regulate as software as a medical device. The wording therefore stays "the label says …" and "discuss with your pharmacist", never "don't take this". Getting regulatory advice before launch (already on the roadmap) now matters more.

## Limits of the current version

- It finds **mentions**, not graded severity. A mention can be minor, or about a related situation.
- Labels often name drug **classes** instead of single drugs. Those are found only once the licensed knowledge base (layer 2) is in.
- Phrases can match in an unrelated sense, for example "hypertension" in "pulmonary hypertension". The quoted sentence makes that visible.
- US FDA labels, matched by active ingredient. Canadian product monographs come with Canadian data (v1.1).
- The targeted search makes more openFDA requests. Set `OPENFDA_API_KEY` (free) before real use.
