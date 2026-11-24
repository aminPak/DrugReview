# Roadmap

The first launch is in **Vancouver, Canada** (see [product.md](product.md#launch-market-vancouver-canada)).

## v1: interaction checker (this version)

- **My list on mobile**, stored on the device: add medicines (RxNorm search) and supplements (curated list), remove them.
- **Interaction check** on mobile and web: every pair checked against official US FDA label text for the same active ingredient. Each finding shows its section, the quoted sentence and a link to the label. Pairs that couldn't be checked are listed separately. Two products with the same active ingredient are flagged.
- **Public website:** landing page and a no-account checker.
- **First-run notice** explaining what the app is and isn't.
- Shared wording in one place, ready for translation.

**Not in v1:** Canadian product search, accounts, server-side storage, AI, lab results, allergies, per-item dose and frequency, food checks, reminders, barcode/photo scanning, payments. The profile holds conditions only (life stages are conditions); where each missing piece of profile data lands is in [product.md](product.md#profile-data-what-it-holds-and-when).

**Context-aware checks (added to v1):** a health profile on the device, every item checked against the person's conditions and life stage, results grouped by condition. Design and next layers: [safety-checks.md](safety-checks.md).

## v1.1: Canadian data and journey fixes (before the Vancouver launch)

**Canadian data**

- Search Canadian products by brand name or DIN with Health Canada's **Drug Product Database**, mapping each product's active ingredients to RxNorm. Keep each product's strengths; v1.2 and v2 use them.
- Search licensed supplements by name or NPN with the **Licensed Natural Health Products Database**, mapping medicinal ingredients to the supplement list.
- French wording.

**Journey fixes** (details and reasons in [user-journey.md](user-journey.md#gaps-and-when-they-are-fixed))

- Web: show the key caveats on `/check` with an accept-once step, as mobile does.
- Undo after removing an item, on both platforms.
- Keep the add screen open for several items, with a **Done** button.
- Plain "couldn't find that medicine" wording that suggests the generic name, until DPD search ships.
- Prompt for the health profile in the empty state; add a "what was checked" summary line to the results.
- Run a short usability test (5 to 8 people, including a caregiver and someone on 5+ medicines) before the launch checklist is signed off.

## v1.2: richer list and profile (on the device)

No accounts and no new data sources. Everything stays on the device, optional, and is only collected if a check uses it or the person shows it to a pharmacist. Full field list and rules: [product.md](product.md#profile-data-what-it-holds-and-when).

- **Details for each item** (all optional): dose and strength, how often, what it's for, start date, notes. The check does not use dose to decide anything yet; it appears on the summary for the pharmacist.
- **Allergies and past reactions** by drug class (for example penicillins) or by specific medicine, with a free-text reaction. New check: item × allergy. Moved up from v2 because it needs no new data source beyond drug classes.
- **About me:** age band (or birth year), sex at birth, and pregnancy and breastfeeding as status fields. Replaces the "Age 65 or older" and life-stage conditions in the condition list and keeps checking those label phrases.
- **Share or print a summary** (list with details, conditions, allergies, findings with sources, date) to take to a pharmacist.
- Profile storage moves to a versioned shape with a migration from `drugreview.list.v1` and `drugreview.profile.v1`, so the new fields don't break saved data on mobile or web.

## v2: accounts and explanations

- Supabase in the Canada Central region: sign-in (email code, Sign in with Apple/Google), the list and profile synced across devices and between mobile and web. Consent is recorded server-side (BC PIPA), with export and delete.
- Claude API: plain-language, personal explanations of each finding ("because you have…"), grounded in the quoted label text, in the user's language; turning free-text conditions into profile conditions for the person to confirm.
- **Food and lifestyle** in the profile (grapefruit, alcohol, vitamin K intake, tyramine-rich food, caffeine, smoking) and the matching checks.
- **Total daily amount** of a shared ingredient, using the per-item dose and frequency from v1.2 and the DPD strengths from v1.1, shown next to what the label says. Display only, for the pharmacist; needs regulatory review first because it is dose-related.
- Barcode and photo scanning of labels (Canadian DIN/NPN barcodes) that fills in the item and its strength.
- Cache the last result with its time instead of re-running the check on every open.
- Public interaction pages on the website (`/interactions/warfarin-and-ginkgo`) for search traffic.
- More languages: Mandarin, Cantonese, Punjabi, Tagalog, Farsi.

## v3: lab results and everyday use

**Lab results** (the largest piece of profile data; needs the regulatory advice in the launch checklist first)

- **Capture:** a photo or PDF from a portal. Extraction (OCR plus a model) proposes values; the person confirms or corrects every value before it is saved. Nothing unconfirmed reaches a check.
- **Data model:** each value has a LOINC code, a number, a unit, the lab's reference range, the collection date and where it came from. Canada reports in SI units (mmol/L), so store SI and convert for display; reject or ask about ambiguous units (mg/dL vs mmol/L).
- **Trends** per test over time, and "questions to ask your doctor" for out-of-range values.
- **"Seek care now"** wording for a short, clinician-reviewed list of dangerous values, never a diagnosis.
- **Feeding the check:** confirmed values set profile conditions through reviewed thresholds (for example eGFR under 30 → severe kidney impairment, high potassium), each showing "from your lab result of <date>". This is layer 4 in [safety-checks.md](safety-checks.md#making-it-more-intelligent-the-layers).
- Stored on the device until accounts exist; encrypted in the database after that. Photos of lab reports are deleted after extraction unless the person asks to keep them.

**Everyday use**

- Reminders, caregiver/family mode (several people, each with their own list and profile), doctor-visit summary PDF (builds on the v1.2 summary).
- Apple Health and Android Health Connect (weight, height, blood pressure and similar).
- Subscriptions (RevenueCat), priced in CAD.
- Pilot with BC pharmacies.

## Before the Vancouver launch

- [ ] License a graded interaction knowledge base that covers Canadian products and natural health products, including drug–disease and supplement–disease modules.
- [ ] Pharmacist-written, cited rules for gaps that matter in practice (for example oral magnesium in myasthenia gravis).
- [ ] Clinical review of the condition list and its label phrases; map conditions to SNOMED CT CA / ICD-10-CA.
- [ ] Advice on Health Canada's software-as-a-medical-device guidance and how features are framed.
- [ ] Privacy policy and consent flows under BC PIPA and PIPEDA; data deletion; Canadian hosting.
- [ ] Clinical review (for example by BC pharmacists) of all wording and how results are presented.
- [ ] English and French.
- [ ] Usability test of the v1.1 journey with real users ([user-journey.md](user-journey.md)).
- [ ] Regulatory view on dose-related features (per-item dose, total daily amount) and on lab-driven checks, before v2 and v3 build them.
- [ ] Security review; app store bundle IDs on a domain we own.
- [ ] CI pipeline.

## Open decisions

| Decision                  | Current answer                                    |
| ------------------------- | ------------------------------------------------- |
| Launch market             | **Decided:** Vancouver, Canada                    |
| Product name              | "DrugReview" (working title)                      |
| Licensed interaction data | None yet; v1 uses US label mentions               |
| Mobile styling library    | React Native styles; NativeWind once v5 is stable |
