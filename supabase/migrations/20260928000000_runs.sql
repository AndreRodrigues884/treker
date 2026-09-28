-- Running: unlike Gym/Swimming, there's no fixed matrix of events to log
-- against — a run is just (distance, duration) on a given day, with
-- distance free-form (km) rather than a closed list, since real training
-- runs are rarely a round number. Standard race distances (5K, 10K,
-- half, marathon) aren't stored separately — they're detected at read
-- time from distance_km (see lib/running/derive.ts), the same
-- derive-don't-store approach already used for e.g. swim event grouping.
--
-- One row per run, not one per day — repeating a route twice in a day
-- (e.g. an easy run + intervals) is normal, same reasoning as
-- swim_times allowing multiple entries per day.

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  distance_km numeric(6, 2) not null check (distance_km > 0),
  duration_seconds integer not null check (duration_seconds > 0),
  session_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index runs_user_id_idx on public.runs (user_id);

alter table public.runs enable row level security;

create policy "Users can view their own runs"
  on public.runs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own runs"
  on public.runs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own runs"
  on public.runs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own runs"
  on public.runs for delete
  using (auth.uid() = user_id);

create trigger runs_set_updated_at
  before update on public.runs
  for each row
  execute function public.set_updated_at();
