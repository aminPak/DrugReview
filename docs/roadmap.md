# Roadmap

The first launch is in **Vancouver, Canada** (see [product.md](product.md#launch-market-vancouver-canada)).

## v1: interaction checker (this version)

- **My list on mobile**, stored on the device: add medicines (RxNorm search) and supplements (curated list), remove them.
- **Interaction check** on mobile and web: every pair checked against official US FDA label text for the same active ingredient. Each finding shows its section, the quoted sentence and a link to the label. Pairs that couldn't be checked are listed separately. Two products with the same active ingredient are flagged.
- **Public website:** landing page and a no-account checker.
- **First-run notice** explaining what the app is and isn't.
- Shared wording in one place, ready for translation.

**Not in v1:** Canadian product search, accounts, server-side storage, AI, lab results, reminders, barcode/photo scanning, payments.

## v1.1: Canadian data (before the Vancouver launch)

- Search Canadian products by brand name or DIN with Health Canada's **Drug Product Database**, mapping each product's active ingredients to RxNorm.
- Search licensed supplements by name or NPN with the **Licensed Natural Health Products Database**, mapping medicinal ingredients to the supplement list.
- French wording.

## v2: accounts and explanations

- Supabase in the Canada Central region: sign-in (email code, Sign in with Apple/Google), the list synced across devices.
- Claude API: plain-language explanations of each finding, grounded in the quoted label text, in the user's language.
- Barcode and photo scanning of labels (Canadian DIN/NPN barcodes).
- Public interaction pages on the website (`/interactions/warfarin-and-ginkgo`) for search traffic.
- More languages: Mandarin, Cantonese, Punjabi, Tagalog, Farsi.

## v3: lab results and everyday use

- Lab results from a photo or PDF in SI units, confirmed by the user, with trends and questions for the doctor.
- Reminders, caregiver/family mode, doctor-visit summary PDF.
- Apple Health and Android Health Connect.
- Subscriptions (RevenueCat), priced in CAD.
- Pilot with BC pharmacies.

## Before the Vancouver launch

- [ ] License a graded interaction knowledge base that covers Canadian products and natural health products.
- [ ] Advice on Health Canada's software-as-a-medical-device guidance and how features are framed.
- [ ] Privacy policy and consent flows under BC PIPA and PIPEDA; data deletion; Canadian hosting.
- [ ] Clinical review (for example by BC pharmacists) of all wording and how results are presented.
- [ ] English and French.
- [ ] Security review; app store bundle IDs on a domain we own.
- [ ] CI pipeline.

## Open decisions

| Decision                  | Current answer                                    |
| ------------------------- | ------------------------------------------------- |
| Launch market             | **Decided:** Vancouver, Canada                    |
| Product name              | "DrugReview" (working title)                      |
| Licensed interaction data | None yet; v1 uses US label mentions               |
| Mobile styling library    | React Native styles; NativeWind once v5 is stable |
