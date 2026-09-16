-- Swimming: unlike Gym, there's no user-created "exercise" step — a
-- stroke + distance combo (e.g. "100m Freestyle") is already a valid
-- event to log a time against, out of a small fixed matrix. One row per
-- (user, stroke, distance, day): re-logging the same event same day
-- upserts, same convention as exercise_sets.

create type public.swim_stroke as enum (
  'freestyle',
  'backstroke',
  'breaststroke',
  'butterfly'
);

create table public.swim_times (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stroke public.swim_stroke not null,
  distance_m integer not null check (distance_m > 0),
  time_seconds numeric(7, 2) not null check (time_seconds > 0),
  session_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stroke, distance_m, session_date)
);

create index swim_times_user_id_idx on public.swim_times (user_id);

alter table public.swim_times enable row level security;

create policy "Users can view their own swim times"
  on public.swim_times for select
  using (auth.uid() = user_id);

create policy "Users can insert their own swim times"
  on public.swim_times for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own swim times"
  on public.swim_times for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own swim times"
  on public.swim_times for delete
  using (auth.uid() = user_id);

-- Reuses the trigger function already defined in the profiles migration.
create trigger swim_times_set_updated_at
  before update on public.swim_times
  for each row
  execute function public.set_updated_at();
