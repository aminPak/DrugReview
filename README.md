# DrugReview (working title)

A personal medication and supplement safety companion. Keep one list of everything you take, check it for interactions, and understand your lab results in plain language, in your own language.

> **Status:** v1, an interaction checker for development and testing (November 2026). First launch planned in **Vancouver, Canada**. Not for real medical use yet: see [docs/roadmap.md](docs/roadmap.md#before-the-vancouver-launch).

## Documents

- [Product brief](docs/product.md): positioning, features, safety principles, business model, the Vancouver launch, data sources, privacy.
- [Architecture](docs/architecture.md): mobile + web strategy, stack, how an interaction check works, configuration.
- [Roadmap](docs/roadmap.md): v1, what comes next, and what's needed before launch.

## What v1 does

- **My list:** add medicines (RxNorm names) and supplements (a curated list), stored only on the device or in the browser.
- **Interaction check:** every pair is checked against official US FDA label text for the same active ingredient. Each finding quotes the sentence, names the label section and links to the label. Two products with the same active ingredient are flagged. Pairs that couldn't be checked, or had nothing found, are listed, never shown as "safe".
- **Mobile app:** first-run notice, my list, search and add, results.
- **Website:** landing page and a public checker at `/check`.

## Repository layout

| Path            | What it is                                                                        | Stack                                       |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| `apps/mobile`   | iOS and Android app, the main product                                             | Expo SDK 58 (React Native), Expo Router     |
| `apps/web`      | Public pages (search traffic) and the checker                                     | Next.js 16, Tailwind CSS 4, shadcn/ui style |
| `apps/api`      | Drug search and interaction checks (RxNorm + openFDA)                             | Hono on Node.js, Zod, bundled by tsup       |
| `packages/core` | Shared schemas, supplement list, text matching, API client, all wording (English) | TypeScript, Zod                             |
| `packages/ui`   | Design tokens shared by web and mobile                                            | TypeScript                                  |

Tooling: pnpm workspaces with a shared version catalog (`pnpm-workspace.yaml`), Turborepo, TypeScript 6, ESLint, Prettier, Vitest.

Planned, not set up yet: Canadian product data (Health Canada), Supabase (accounts and sync), the Claude API (explanations), lab results.

## Getting started

You need Node.js 22.18 or newer and pnpm 12. Install pnpm once:

```bash
npm install -g pnpm@12
```

Install dependencies from the repository root:

```bash
pnpm install
```

Run one app at a time (each in its own terminal):

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

```bash
pnpm dev:mobile
```

The API listens on http://localhost:8787 (copy `apps/api/.env.example` to `apps/api/.env` to change it). The web app runs on http://localhost:3000. For the mobile app, scan the QR code with the Expo Go app on a phone on the same Wi-Fi (it finds the API on your computer automatically), or press `w` for a browser preview.

On Windows, stop the dev servers before installing packages; Metro locks files and the install fails.

## Checks

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `pnpm check`        | Type-check, lint and test every package |
| `pnpm build`        | Build the API bundle and the web app    |
| `pnpm format`       | Format everything with Prettier         |
| `pnpm format:check` | Fail if any file isn't formatted        |

## Safety rule for interaction checks

An interaction check returns `checked` or `unavailable`. `checked` lists findings, pairs with nothing found and pairs that couldn't be checked; none of these mean "safe". Apps must show `unavailable` as "we couldn't check this", never as "no interactions found". Full principles: [docs/product.md](docs/product.md#safety-principles).

## Disclaimer

This software gives general information. It is not medical advice and does not replace a clinician.

## License

MIT. See [LICENSE](LICENSE). The Expo starter code in `apps/mobile` is also MIT-licensed by Expo (see `apps/mobile/LICENSE`).
