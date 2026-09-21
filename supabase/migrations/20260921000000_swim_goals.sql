-- One target time per (user, stroke, distance) — unlike swim_times,
-- which is an append-only log of attempts, a goal is a single current
-- value that gets replaced when the user updates it (upsert), not
-- accumulated history.

create table public.swim_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stroke public.swim_stroke not null,
  distance_m integer not null check (distance_m > 0),
  target_seconds numeric(7, 2) not null check (target_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stroke, distance_m)
);

create index swim_goals_user_id_idx on public.swim_goals (user_id);

alter table public.swim_goals enable row level security;

create policy "Users can view their own swim goals"
  on public.swim_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own swim goals"
  on public.swim_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own swim goals"
  on public.swim_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own swim goals"
  on public.swim_goals for delete
  using (auth.uid() = user_id);

create trigger swim_goals_set_updated_at
  before update on public.swim_goals
  for each row
  execute function public.set_updated_at();
