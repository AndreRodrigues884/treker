# treker

Next.js (App Router) + Supabase (Postgres/Auth/RLS) + Upstash Redis + Tailwind + TanStack Query + Zod. See [docs/stack.txt](docs/stack.txt).

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
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` from the local DB schema |
| `npm run services:up` / `services:down` | Local Redis + Upstash-compatible REST proxy |

## Project layout

```
src/
  app/                    App Router routes, layouts, providers
  lib/
    env.ts                Zod-validated environment variables — import this, not process.env
    supabase/
      client.ts           Browser client (Client Components)
      server.ts           Server client (Server Components, Route Handlers, Server Actions)
      middleware.ts        Session refresh, wired into src/middleware.ts
    redis.ts              Upstash Redis client
supabase/
  config.toml             Local Supabase CLI config
  migrations/             SQL migrations (write RLS policies here — see the placeholder migration)
docker-compose.yml         Dev-only: local Redis + REST proxy (Supabase itself runs via its own CLI/Docker)
```

## Notes

- **RLS**: every table exposed via the Supabase API needs Row Level Security enabled and explicit policies — the placeholder migration under `supabase/migrations/` has a worked example. Nothing is enforced until you write the policy.
- **Deploy target**: Vercel for the app; hosted Supabase and Upstash for data/cache. Docker here is dev-only — production never runs these containers.
- **Env vars**: add new ones to both `.env.local.example` and the Zod schema in `src/lib/env.ts`, and to Vercel's project settings before deploying.
