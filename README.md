# DrugReview (working title)

A personal medication and supplement safety companion. Keep one list of everything you take, check it for interactions, and understand your lab results in plain language, in your own language.

> **Status:** early scaffold (November 2026). The first prototype (ASP.NET Core MVC + Razor + Bootstrap) is kept in git history at commit `c1e429c`.

## Product direction

- **My cabinet:** one list of prescriptions, OTC drugs and supplements, added by search, barcode or a photo of the label.
- **Interaction checks:** results come from a licensed clinical knowledge base. AI explains the result in plain language and cites its sources. It never decides whether a combination is safe.
- **Lab results:** upload a photo or PDF, get structured values, trends over time and questions to ask your doctor.
- **Everyday use:** reminders, a caregiver mode for managing a family member's meds, and a summary to take to a doctor's visit.
- **Trust first:** recommendations are never tied to selling products.

## Repository layout

| Path            | What it is                                                     | Stack                                   |
| --------------- | -------------------------------------------------------------- | --------------------------------------- |
| `apps/mobile`   | iOS and Android app, the main product                          | Expo SDK 58 (React Native), Expo Router |
| `apps/web`      | Public pages (search traffic) and the signed-in web app        | Next.js 16 (App Router), Tailwind CSS 4 |
| `apps/api`      | Backend API; interaction checks run here                       | Hono on Node.js, Zod, bundled by tsup   |
| `packages/core` | Shared types, validation schemas and wording used by every app | TypeScript, Zod                         |

Tooling: pnpm workspaces with a shared version catalog (`pnpm-workspace.yaml`), Turborepo, TypeScript 6, ESLint, Prettier, Vitest.

Planned, not set up yet: PostgreSQL + pgvector on Supabase (data, auth, file storage), a licensed interaction knowledge base, and the Claude API for reading labels and lab reports and for explanations.

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

The API listens on http://localhost:8787 (copy `apps/api/.env.example` to `apps/api/.env` to change it). The web app runs on http://localhost:3000. For the mobile app, scan the QR code with the Expo Go app or press `a` / `i` for an emulator.

## Checks

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `pnpm check`        | Type-check, lint and test every package |
| `pnpm build`        | Build the API bundle and the web app    |
| `pnpm format`       | Format everything with Prettier         |
| `pnpm format:check` | Fail if any file isn't formatted        |

## Safety rule for interaction checks

An interaction check returns either `checked` (with a list, possibly empty) or `unavailable`. Apps must show `unavailable` as "we couldn't check this", never as "no interactions found". Until a knowledge base is connected, the API always answers `unavailable`.

## Disclaimer

This software gives general information. It is not medical advice and does not replace a clinician.

## License

MIT. See [LICENSE](LICENSE). The Expo starter code in `apps/mobile` is also MIT-licensed by Expo (see `apps/mobile/LICENSE`).
