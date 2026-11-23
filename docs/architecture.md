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

- **Why US labels for a Canadian launch:** Canadian product monographs are PDFs with no free structured API, while the active ingredients are the same. v1.1 adds Canadian product search (Health Canada's Drug Product Database and Natural Health Products Database) and maps each product to its ingredients, which then use this same check.
- **Matching is plain text search**, not AI: the other item's ingredient name, or a supplement's known names (for example "St. John's wort", "Hypericum"). It's deterministic and every finding quotes the sentence it came from.
- **Supplements** come from a curated list of common supplement ingredients and their alternative names (`packages/core/src/supplements.ts`). A supplement–supplement pair has no FDA label, so it's reported as "couldn't check".
- **If a source can't be reached**, the API returns `unavailable` instead of a partial answer.
- **Caching:** labels and ingredient lookups are cached in memory for 24 hours. The RxNorm name list used for autocomplete is downloaded once and cached.
- **Privacy:** the API doesn't store or log item names. The list lives on the user's device (mobile) or in the browser (web).

## Configuration

| Variable              | App    | Purpose                                                                                   |
| --------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `PORT`                | api    | Port to listen on (default 8787)                                                          |
| `WEB_ORIGINS`         | api    | Browser origins allowed to call the API (default: the website and the mobile web preview) |
| `OPENFDA_API_KEY`     | api    | Optional. Raises openFDA's limit from 1,000 to 120,000 requests a day                     |
| `NEXT_PUBLIC_API_URL` | web    | API address (default `http://localhost:8787`)                                             |
| `EXPO_PUBLIC_API_URL` | mobile | API address. In development it defaults to the computer running Expo                      |
