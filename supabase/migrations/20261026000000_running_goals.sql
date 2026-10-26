-- One target time per (user, standard distance) — mirrors swim_goals
-- exactly (a single current value, replaced via upsert, not an
-- append-only log). Keyed by distance_value (e.g. "half_marathon"),
-- the same key running_prs already uses for standard distances.

create table public.running_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  distance_value text not null,
  target_seconds numeric(7, 2) not null check (target_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, distance_value)
);

create index running_goals_user_id_idx on public.running_goals (user_id);

alter table public.running_goals enable row level security;

create policy "Users can view their own running goals"
  on public.running_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own running goals"
  on public.running_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own running goals"
  on public.running_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own running goals"
  on public.running_goals for delete
  using (auth.uid() = user_id);

create trigger running_goals_set_updated_at
  before update on public.running_goals
  for each row
  execute function public.set_updated_at();
