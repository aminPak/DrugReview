# Product brief

## Positioning

DrugReview is a **medication and supplement safety companion**. It answers one question people actually have: _"Is it safe to take this with what I already take?"_

It replaces the first prototype's idea of "AI drug review + supplement shop". That combination had three problems:

1. **Conflict of interest.** An app that finds a "deficiency" and then sells the supplement for it is exactly what users and regulators distrust. Trust is the product.
2. **AI can't be the one that decides.** Language models make up drug interactions. Safety answers must come from curated clinical sources. AI extracts, explains and translates.
3. **Medical-device risk.** Turning lab results into "take X at dose Y" can make the software a regulated medical device (Health Canada and FDA software-as-a-medical-device rules, EU MDR Rule 11). Education plus "questions to ask your doctor" keeps the product in much safer territory. Get a regulatory consultation before launch.

## Who it's for

- **People taking several medicines and supplements** (over half of US adults take supplements, many alongside prescriptions).
- **Caregivers** managing a parent's or child's medicines, often 10+ items.
- **Later:** pharmacies, clinics and employers who want to offer this to their patients or staff.

## Why now

- Drug–supplement interactions are common and often missed: St John's wort with SSRIs or birth control, warfarin with vitamin K or ginkgo, levothyroxine with calcium or iron.
- Patients get lab results directly through online portals and want them explained.
- General AI chatbots answer health questions, so "an AI explains things" isn't an advantage on its own. Trusted data, convenience and the user's own history together are.

**Competitors:** Drugs.com and Medscape (interaction checkers), Medisafe and MyTherapy (reminders), InsideTracker and Function Health (lab analysis), general AI assistants.

## Core features

| Feature                         | What it does                                                                                                                                                                           | Version |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **My list**                     | One list of prescriptions, OTC medicines and supplements. Add by search; later by barcode or a photo of the label. v1.2 adds dose, frequency and what each is for.                     | v1      |
| **Health profile**              | v1: conditions, life stage (pregnancy, breastfeeding, 65+) and anything typed as written, on the device. Later: allergies (v1.2), food and lifestyle (v2), lab values (v3). See below. | v1      |
| **Safety check**                | Checks every pair of items, and every item against the health profile, against official sources, and shows what they say with a link. See [safety-checks.md](safety-checks.md).        | v1      |
| **Public checker (web)**        | The same check on the website, no account needed. Brings people in from search.                                                                                                        | v1      |
| **Plain-language explanations** | AI rewrites the official text in plain language, in the user's language, citing the source sentence.                                                                                   | v2      |
| **Lab results**                 | A photo or PDF becomes structured values the user confirms. Trends, questions for the doctor, "seek care now" for dangerous values. Units (mg/dL vs mmol/L) and LOINC.                 | v3      |
| **Everyday use**                | Reminders, caregiver/family mode, a summary PDF for doctor visits, Apple Health and Android Health Connect sync.                                                                       | v3+     |

## Profile data: what it holds and when

What a person can record today, and where each missing piece is planned. Version details are in [roadmap.md](roadmap.md); how each piece feeds the check is in [safety-checks.md](safety-checks.md).

| Data                                                               | Used for                                                       | Version          |
| ------------------------------------------------------------------ | -------------------------------------------------------------- | ---------------- |
| Medicines and supplements (name and type)                          | Item × item, same ingredient                                   | **v1 (built)**   |
| Conditions (curated list or typed as written), life stages         | Item × condition, item × life stage                            | **v1 (built)**   |
| Dose and strength, how often, what it's for, start date, notes     | Shown on the summary for the pharmacist                        | v1.2             |
| Allergies and past reactions (drug class or specific medicine)     | Item × allergy                                                 | v1.2             |
| Age band or birth year, sex at birth, pregnancy and breastfeeding  | Age and life-stage checks (replaces the life-stage conditions) | v1.2             |
| Shareable summary of list, profile and findings                    | Taking it to a pharmacist or doctor                            | v1.2             |
| Food and lifestyle: grapefruit, alcohol, vitamin K, tyramine       | Item × food                                                    | v2               |
| Total daily amount of a shared ingredient                          | Showing the sum next to the label's wording (display only)     | v2, after review |
| Same profile on every device                                       | Mobile and web in step                                         | v2 (accounts)    |
| Lab results (LOINC code, value, SI unit, range, date)              | Item × lab value; conditions set from confirmed values; trends | v3               |
| Weight, height, blood pressure from Apple Health or Health Connect | Context for the pharmacist; later checks                       | v3+              |
| Several people (caregiver mode)                                    | One profile and list per person                                | v3               |

**Rules for profile data**

1. **Collect only what a check uses or the person shows to a professional.** BC's PIPA asks for limited collection, and an unused field is a liability.
2. **Everything is optional,** and "I don't know" is a valid answer. A missing field is listed as "not checked", never treated as "no problem".
3. **Stays on the device until accounts exist** (v2). After that, stored in Canada, exportable and deletable by the person.
4. **The person confirms every value** that came from a photo, a scan or an AI step before it is saved or used.
5. **Dose is never used to say a combination is safe** or to suggest a dose. It is shown, not judged, until a reviewed rule or licensed knowledge base says otherwise.
6. **No analytics or ad SDKs** receive any of it.

## Safety principles

These apply to every feature and every release:

1. **Every finding has a source** the user can open.
2. **AI never decides** whether a combination is safe. It may only explain or translate text from a source.
3. **"Not found" is never "safe".** The app says what it checked and what it couldn't check. An interaction check that couldn't run returns `unavailable`, never "no interactions found".
4. **Point to a professional.** Every result tells the user to talk to a doctor or pharmacist before changing anything.
5. **No selling against recommendations.** Recommendations are never tied to products we earn money from.

## Business model

- **Freemium subscription.** Free: the list and interaction check. Paid: lab results, family profiles, reports, unlimited scans.
- **Later, business customers:** pharmacies, clinics and employers (white-label or API).
- **Commerce, if ever:** separate from recommendations, only third-party-certified products (USP, NSF), never ranked by commission.

## Launch market: Vancouver, Canada

The first launch is in **Vancouver, British Columbia**, then the rest of Canada, then other countries.

| Area                 | What it means for the product                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drug names**       | People search Canadian brand names and DINs (Drug Identification Numbers). Use Health Canada's **Drug Product Database**.                                                                                                                   |
| **Supplements**      | In Canada they're licensed "natural health products" with an NPN. Use Health Canada's **Licensed Natural Health Products Database**.                                                                                                        |
| **Interaction text** | Canadian product monographs are PDFs without a free structured API. Until a licensed knowledge base is in place, the app checks the US FDA label for the same active ingredient and says so.                                                |
| **Languages**        | English first. French is needed before going national. Metro Vancouver's most common other languages are Mandarin, Cantonese, Punjabi, Tagalog and Farsi (written right to left), so they're the first candidates after English and French. |
| **Lab units**        | Canada reports lab results in SI units (mmol/L), so the lab feature starts with SI and converts to conventional units.                                                                                                                      |
| **Privacy law**      | BC's Personal Information Protection Act (PIPA) and federal PIPEDA. Host data in Canada (Supabase and most clouds have a Canada Central region); health partners such as BC health authorities often require it.                            |
| **Regulator**        | Health Canada regulates software as a medical device. Keep features educational and get advice on Health Canada's SaMD guidance before launch.                                                                                              |
| **Partners**         | BC pharmacists can do medication reviews and prescribe for minor ailments, which makes pharmacies a natural first business partner.                                                                                                         |

**Going further later:** drug names differ by country (paracetamol vs acetaminophen), and so do regulators and privacy laws (GDPR in Europe; FTC and state laws in the US). All wording lives in one place (`packages/core/src/messages`), layouts must handle right-to-left text, and WHO ATC codes match drugs across countries.

## Clinical data

| Source                                                          | Cost     | Used for                                               | Status                                                   |
| --------------------------------------------------------------- | -------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Health Canada Drug Product Database (DPD)                       | Free     | Canadian brand names, DINs, active ingredients         | Used in v1.1                                             |
| Health Canada Licensed Natural Health Products Database (LNHPD) | Free     | Canadian supplements (NPNs) and their ingredients      | Next: needs an offline index (no name search in its API) |
| RxNorm (NLM RxNav)                                              | Free     | Ingredient names and IDs, autocomplete                 | Used in v1                                               |
| openFDA drug labels (same text as DailyMed)                     | Free     | US label sections that mention other drugs/supplements | Used in v1                                               |
| NIH Dietary Supplement Label Database (DSLD)                    | Free     | US supplement products                                 | For a US launch                                          |
| DrugBank, First Databank or Medi-Span                           | Licensed | Graded drug–drug interactions with severity            | Needed before launch                                     |
| Natural Medicines (TRC)                                         | Licensed | Graded supplement interactions                         | Needed before launch                                     |
| LOINC                                                           | Free     | Coding lab results                                     | Planned (lab results)                                    |

The free NLM interaction API was shut down in January 2024, so we don't plan around it.

**v1's limits, stated honestly in the app:** it uses US FDA labels (matched by active ingredient, which is the same in Canadian products), official labels don't list every interaction, often name drug _classes_ ("NSAIDs") rather than each drug, and supplements have no FDA label. v1 finds mentions and puts boxed warnings, contraindications and "do not use" first; it doesn't grade clinical severity. A licensed knowledge base replaces this before launch.

## Privacy and compliance

- **Canada (launch):** BC's **PIPA** and federal **PIPEDA** require meaningful consent, limited collection, safeguards, breach reporting and access/deletion on request. Host user data in Canada.
- **Europe (later):** health data is special-category data under **GDPR**: explicit consent, data minimization, EU hosting for EU users.
- **US (later):** the **FTC Health Breach Notification Rule** and **Washington's My Health My Data Act** apply to consumer health apps; HIPAA applies once we work with providers or insurers.
- **Never put advertising pixels or analytics SDKs that receive health data in the product.** The FTC fined GoodRx and BetterHelp for exactly that.
- **v1 stores the user's list only on their device.** Nothing is saved on our servers; the API sees item names only while running a check and doesn't log them.
- Before launch: privacy policy, terms, consent flows, data deletion, a security review, and a regulatory consultation.
