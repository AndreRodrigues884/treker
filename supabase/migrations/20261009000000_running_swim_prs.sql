-- Personal records for Running and Swimming — same append-only
-- convention as exercise_prs (see 20260918000000_achievements.sql): no
-- update policy on purpose, detected and inserted by logRunAction /
-- logSwimTimeAction alongside the run/time itself.

create table public.running_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  distance_value text not null,
  session_date date not null,
  distance_km numeric(6, 2) not null,
  duration_seconds integer not null,
  created_at timestamptz not null default now()
);

create index running_prs_user_id_idx on public.running_prs (user_id);

alter table public.running_prs enable row level security;

create policy "Users can view their own running PRs"
  on public.running_prs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own running PRs"
  on public.running_prs for insert
  with check (auth.uid() = user_id);

create table public.swim_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stroke public.swim_stroke not null,
  distance_m integer not null,
  session_date date not null,
  time_seconds numeric(7, 2) not null,
  created_at timestamptz not null default now()
);

create index swim_prs_user_id_idx on public.swim_prs (user_id);

alter table public.swim_prs enable row level security;

create policy "Users can view their own swim PRs"
  on public.swim_prs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own swim PRs"
  on public.swim_prs for insert
  with check (auth.uid() = user_id);
