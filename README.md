# Treker

A full-stack training tracker for autonomous athletes — log workouts, swim times, and runs across **Gym**, **Swimming**, and **Running**, and watch real progress charts, personal records, and goal projections build up over time.

**Live:** [treker-beta.vercel.app](https://treker-beta.vercel.app)

## Features

- **Gym** — routines and exercises grouped by muscle group, per-session set logging, drag-to-reorder, automatic 1RM/deload/volume tracking
- **Swimming** — log times per stroke/distance, set a goal time and get a linear pace projection for when you'll hit it
- **Running** — free-form distance + duration logging, automatic pace-progression charts per standard distance (5K/10K/15K/20K/half/marathon), weekly mileage
- **Statistics** — per-modality dashboards (Total Strength, 1RM, deload analysis, muscle-group volume, pace, swim times), filterable when you track more than one sport
- **Achievements** — Gym personal records and lifetime volume milestones, detected automatically at save time, never invented
- **Bodyweight tracking** — daily log with a progress chart
- **Auth** — email/password and Google OAuth, with rate limiting on every auth entry point
- Every table is scoped by Postgres Row Level Security — a user can only ever read or write their own data

## Tech stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Supabase (Postgres, Auth, RLS) · Tailwind CSS v4 · Zod · Upstash Redis (rate limiting) · Vitest + Testing Library · Vercel

## Prerequisites

- Node.js 20.19+ or 22.13+ (repo was scaffolded on Node 23; older Node 20/22 minor versions will hit an `EBADENGINE` warning from a lint dependency — harmless, but prefer a supported version if you can)
- Docker Desktop running (for local Supabase and Redis)

## First-time setup

```bash
npm install
cp .env.local.example .env.local
npm run db:start        # starts local Supabase via the Supabase CLI (needs Docker)
npm run services:up     # starts local Redis + REST proxy (needs Docker)
```

`npm run db:start` prints local API URL / anon key / service role key on
first run — copy them into `.env.local`. Re-print anytime with
`npm run db:status`.

Then:

```bash
npm run dev
```

## Everyday scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (single run) |
| `npm run test:watch` | Vitest (watch mode) |
| `npm run test:coverage` | Vitest with coverage |
| `npm run db:start` / `db:stop` / `db:status` | Local Supabase stack (Docker, managed by the Supabase CLI) |
| `npm run db:types` | Regenerate `src/types/database.types.ts` from the local DB schema |
| `npm run services:up` / `services:down` | Local Redis + Upstash-compatible REST proxy |

## Project layout

```
src/
  app/
    dashboard/            Gym, Swimming, Running, Statistics, Achievements, Settings
    login/, signup/, onboarding/, auth/callback/   Auth + onboarding flow
  components/              One folder per module (gym/, swimming/, running/, statistics/, ...)
  lib/
    actions/               Server Actions (one file per module)
    <module>/derive.ts     Pure functions: raw rows -> chart points, PRs, stats — unit tested
    <module>/queries.ts    cache()-wrapped Supabase reads
    validation/            Zod schemas for form input
    supabase/
      client.ts            Browser client (Client Components)
      server.ts            Server client (Server Components, Route Handlers, Server Actions)
      middleware.ts        Session refresh, wired into src/proxy.ts (Next 16's renamed middleware)
    rate-limit.ts          Upstash-backed rate limiters, fail open if Redis is unreachable
    redis.ts               Upstash Redis client
  types/                   Row types per module + generated database.types.ts
supabase/
  config.toml              Local Supabase CLI config
  migrations/              SQL migrations — every table has RLS enabled with explicit policies
docker-compose.yml         Dev-only: local Redis + REST proxy (Supabase itself runs via its own CLI/Docker)
```

## Notes

- **RLS**: every table exposed via the Supabase API has Row Level Security enabled with explicit per-user policies — see any migration under `supabase/migrations/` for the pattern.
- **Deploy target**: Vercel for the app; hosted Supabase and Upstash for data/cache. Docker here is dev-only — production never runs these containers.
- **Env vars**: add new ones to `.env.local.example`, and to Vercel's project settings before deploying.
