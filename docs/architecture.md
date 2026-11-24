# Architecture

## Platforms: mobile app first, website alongside

| Platform                       | Role                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile app (iOS + Android)** | The main product. It needs the camera (labels, lab reports), push notifications (reminders, new interaction alerts), Apple Health / Health Connect, and offline access to the list.          |
| **Website**                    | Brings users in. Most people search "X and Y interaction"; public, server-rendered pages are this category's main free acquisition channel. Also serves caregivers and clinicians at a desk. |

Mobile-only would give up search traffic. Web-only would give up the features people use daily (a web app can't do camera, push and health data well on iPhone).

## Stack

One language, TypeScript, everywhere, so mobile, web and API share types, validation and wording.

| Layer  | Choice                                                                   | Why                                                                                                       | Status               |
| ------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------- |
| Repo   | pnpm workspaces + Turborepo                                              | Shared code, one place to build and test                                                                  | In place             |
| Mobile | Expo (React Native) + Expo Router + EAS                                  | One codebase for iOS and Android; native camera, push, health data; over-the-air fixes                    | In place (EAS later) |
| Web    | Next.js (App Router)                                                     | Server-rendered pages for search and multiple languages, plus the signed-in web app                       | In place             |
| UI     | Shared design tokens (`packages/ui`); shadcn/ui + Tailwind on web        | One design system across platforms                                                                        | In place, see note   |
| API    | Hono + Zod                                                               | Small, fast, runs on many hosts; interaction logic lives on the server, versioned                         | In place             |
| Data   | PostgreSQL + pgvector on Supabase (Auth, Storage, per-user access rules) | Canada Central region for the Vancouver launch, EU and US regions later; can move to plain Postgres later | Planned (v2)         |
| AI     | Claude API, default model `claude-opus-5-5`                              | Reading labels and lab reports into structured data, explanations with citations, translation             | Planned (v2)         |
| Other  | Expo Notifications, RevenueCat, Sentry, a job queue (pg-boss or Inngest) | Standard, proven choices                                                                                  | Planned              |

**Note on mobile styling:** the plan was NativeWind on mobile. NativeWind's stable release (4.x) only supports Tailwind 3, and the version for Tailwind 4 (5.0) is still a release candidate, while the website uses Tailwind 4. Until NativeWind 5 is stable, the mobile app uses React Native styles built from the same design tokens as the website, so switching later is mechanical.

### AI layer rules

- AI explains, extracts and translates. It never decides whether a combination is safe.
- Every AI explanation is grounded in a source text and cites it.
- Never send health data to analytics tools.
- Pin where AI processing runs with the API's `inference_geo` setting, to meet data-residency rules.
- Ask Anthropic about zero data retention and a HIPAA agreement before handling US patient data.
- Cheaper models (Sonnet 5.5, Haiku 5.5) can be evaluated for high-volume extraction once there is a test set to measure quality.

## Repository layout

```
apps/
  api/      Hono API: drug search and interaction checks
  mobile/   Expo app: my list, search, interaction check
  web/      Next.js site: landing page and public checker
packages/
  core/     Shared schemas (Zod), supplement vocabulary, matching logic, wording
  ui/       Shared design tokens (colors, spacing, radii, type)
docs/       Product brief, architecture, roadmap
```

## How an interaction check works (v1)

```
App                     API                                  Public data
───                     ───                                  ───────────
user's list  ──POST /v1/interactions/check──▶
                        1. Resolve each drug to its RxNorm ingredient ──▶ RxNav
                        2. Fetch the newest label for each ingredient  ──▶ openFDA
                        3. For every pair, search the label's Boxed warning,
                           Contraindications, Warnings and Drug interactions
                           sections for the other item's names
             ◀── findings (section + quoted sentence + DailyMed link)
                 + pairs that couldn't be checked
```

- **Why US labels for a Canadian launch:** Canadian product monographs are PDFs with no free structured API, while the active ingredients are the same. v1.1 adds Canadian product search from Health Canada's Drug Product Database ([below](#canadian-products-v11)), which maps each product to its ingredients, and these then use this same check. Natural health products follow.
- **Health conditions** are checked the same way, against the label sections that matter (boxed warning, contraindications, warnings…). If the labels already read don't mention a condition, the API asks openFDA for any label of that ingredient that does. Details: [safety-checks.md](safety-checks.md).
- **Matching is plain text search**, not AI: the other item's ingredient name, or a supplement's known names (for example "St. John's wort", "Hypericum"). It's deterministic and every finding quotes the sentence it came from.
- **Supplements** come from a curated list of common supplement ingredients and their alternative names (`packages/core/src/supplements.ts`). A supplement–supplement pair has no FDA label, so it's reported as "couldn't check".
- **If a source can't be reached**, the API returns `unavailable` instead of a partial answer.
- **Caching:** labels and ingredient lookups are cached in memory for 24 hours. The RxNorm name list used for autocomplete is downloaded once and cached.
- **Privacy:** the API doesn't store or log item names. The list lives on the user's device (mobile) or in the browser (web).

## Canadian products (v1.1)

`apps/api/src/sources/dpd.ts` reads Health Canada's **Drug Product Database** API (no key needed). A search by brand name or DIN lists matching products, keeps human medicines whose status is "Marketed" (the API also returns cancelled products, and a status needs one lookup each), and adds each product's active ingredients and strengths. An 8-digit DIN is looked up exactly, whatever its status. Each ingredient is then matched to an RxNorm ingredient, so the label check is the same as for a generic name.

- A list item from the DPD stores only the name and DIN. The API re-reads the product at each check, so the device never decides which ingredients are checked. A DIN the database no longer knows has no ingredients, so its pairs are listed as "not checked".
- Ingredients RxNorm can't match are returned as `unmatched` when the item is added, and the apps say they aren't checked.
- Results are cached for 24 hours. The DPD is cited as a source on any result that uses it.
- The natural health products database (LNHPD) has no name search in its API, so supplements keep the curated list until an offline index is built (see [roadmap.md](roadmap.md)).

## Admin area and AI provider settings

The website's `/admin` page (not indexed) has an **AI assistant** tab where an admin picks a provider (Anthropic, OpenAI, or any OpenAI-compatible service with its own address), the model and a key, and can test the connection. It records the connection for the v2 explanation layer; nothing calls the provider yet.

- **Access:** one secret, `ADMIN_TOKEN`, sent as a bearer token. Shorter than 24 characters or unset, the whole `/admin` API answers 404, so it doesn't exist. The page keeps the token in the browser tab's session only. There is no rate limiting yet, so use a long random token and keep the API behind your host's protections.
- **The key is write-only.** The API never returns it, only where it comes from (`saved` or `env`) and its last four characters. A saved key is encrypted (AES-256-GCM, key derived from `ADMIN_TOKEN`) in `DATA_DIR/ai-settings.json`, which isn't committed. If `ADMIN_TOKEN` changes, the saved key can't be read and must be entered again. A key from `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is used when none is saved, and is the better choice in production.
- **Test connection** sends one tiny request (8 tokens, no health data) to check the key, model and address. Another provider's address must be https, or http on localhost.
- Changing the provider drops the saved key, since it belongs to the old one.
- Code: `apps/api/src/admin/` (store, test, routes) and `apps/web/src/components/admin/`. Shared types are in `packages/core/src/admin.ts`.

## Configuration

| Variable              | App    | Purpose                                                                                   |
| --------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `PORT`                | api    | Port to listen on (default 8787)                                                          |
| `WEB_ORIGINS`         | api    | Browser origins allowed to call the API (default: the website and the mobile web preview) |
| `OPENFDA_API_KEY`     | api    | Optional. Raises openFDA's limit from 1,000 to 120,000 requests a day                     |
| `ADMIN_TOKEN`         | api    | Optional. Turns on the admin area; at least 24 characters. Unset, `/admin` doesn't exist  |
| `DATA_DIR`            | api    | Where admin settings are saved (default `./data`, not committed)                          |
| `ANTHROPIC_API_KEY`   | api    | Optional. AI key used when none is saved on the admin page (also `OPENAI_API_KEY`)        |
| `NEXT_PUBLIC_API_URL` | web    | API address (default `http://localhost:8787`)                                             |
| `EXPO_PUBLIC_API_URL` | mobile | API address. In development it defaults to the computer running Expo                      |
