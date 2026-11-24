# User journey

How a person moves through the v1 apps today, what works, and which version fixes each gap. Reviewed 2026-11-23 from the code (mobile `apps/mobile/src/app`, web `apps/web/src`); not yet a usability test with real users. Plan the test before the v1.1 work is final (see [roadmap.md](roadmap.md#v11-canadian-data-and-journey-fixes-before-the-vancouver-launch)).

## Mobile

1. **First-run notice** ("Before you start", five points) and **I understand**. Acceptance is saved on the device.
2. **My list.** A health-profile card at the top, then the items, with **Add** and **Run safety check** pinned at the bottom. The check button is disabled until a check can run (two items, or one item and a condition), and the reason is shown next to it.
3. **Add** (modal). Search by name. Medicines come from RxNorm, supplements from the curated list. Tapping a result adds it and closes the modal.
4. **Health profile.** Search the curated conditions (life stages included) or type one "as written".
5. **Results.** A red banner for serious warnings, then Serious and Caution groups. Each finding shows the label quote (or a reviewed rule), its section, "Because you have: …", and a source link. Then "Not checked", "Checked, no mention found", a pharmacist reminder and the disclaimer. If a data source fails, the screen says nothing was checked and offers a retry; it never shows an all-clear.

The list, profile and notice acceptance are all saved on the device (`apps/mobile/src/lib/cabinet.tsx`).

## Web

1. **Landing page:** hero, three-step explainer, and a "what this version does and doesn't do" box.
2. **/check:** profile, add, list and results on one page, no account. The list and profile are saved in the browser's `localStorage`.

## What works well

- Results lead with the most serious findings and tie each one to the condition that triggered it.
- "Nothing found" is never presented as safe, and what couldn't be checked is listed.
- The disabled check button explains itself.
- Failures show "We couldn't run the check" with a retry.

## Gaps and when they are fixed

| #   | Gap                                                                                                                                                                         | Fix                                                                                                                                            | Version       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | **No first-run notice on web.** Mobile makes people accept it; `/check` doesn't, and the caveats live on the landing page that search visitors may skip.                    | Show the key caveats (US labels, "nothing found is not safe", stored on this device) on `/check`, with an accept-once step that is remembered. | v1.1          |
| 2   | **Removing an item is instant, with no undo,** on both platforms. The `removeConfirm` wording exists but nothing uses it.                                                   | An undo message after removing (preferred over a confirm dialog on a long list). Use or delete `removeConfirm`.                                | v1.1          |
| 3   | **The add modal closes after every item,** so building a six-item list means opening it six times.                                                                          | Keep it open after adding, show what was added, and finish with a **Done** button.                                                             | v1.1          |
| 4   | **Canadian users hit dead ends.** Search is RxNorm (US names). The "couldn't find that medicine in RxNorm" message is jargon and doesn't suggest the generic name.          | Now: plain wording that suggests the generic name. Then: Health Canada DPD search by brand name or DIN.                                        | v1.1          |
| 5   | **The health profile is easy to miss,** and conditions are a large part of the value. It is a card above the list, and nothing connects it to the check except small print. | Prompt for it in the empty state and on the check button's hint; mention conditions in the results summary.                                    | v1.1          |
| 6   | **Results give no summary of what was checked,** so a long result is hard to trust or skim.                                                                                 | One line at the top: "6 items, 2 conditions, 15 pairs checked, 3 couldn't be checked".                                                         | v1.1          |
| 7   | **Supplement-heavy lists mostly come back "Not checked"** because supplements have no label.                                                                                | Reviewed rules and the licensed knowledge base (see [safety-checks.md](safety-checks.md)); meanwhile group these clearly and explain why.      | Before launch |
| 8   | **Nothing to hand to a pharmacist.** The screen says to show the list and conditions to one, but there is no way to share or print it.                                      | Share or print a plain results summary (list, conditions, findings with sources, date).                                                        | v1.2          |
| 9   | **Results re-run on every list change** and show the spinner again on a slow connection.                                                                                    | Keep the last result with its time until the list changes.                                                                                     | v2            |
| 10  | **The web list and the mobile list are separate.**                                                                                                                          | Accounts and sync.                                                                                                                             | v2            |
| 11  | **The list is only names.** No dose, frequency or reason, so it doesn't feel like a medication list and the check can't reason about amounts.                               | Optional per-item details. See [the profile plan](product.md#profile-data-what-it-holds-and-when).                                             | v1.2          |

## Tracking

Each row above becomes an issue when its version starts. When a row is fixed, change its version cell to "Done" and note the date.
