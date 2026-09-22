-- One weight log per (user, day) — a body-weight reading is a single
-- daily measurement, not a repeatable attempt like a set or a swim
-- time, so re-logging the same day upserts (replaces), same convention
-- as swim_goals rather than swim_times.

create table public.bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(5, 2) not null check (weight_kg > 0),
  logged_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_at)
);

create index bodyweight_logs_user_id_idx on public.bodyweight_logs (user_id);

alter table public.bodyweight_logs enable row level security;

create policy "Users can view their own bodyweight logs"
  on public.bodyweight_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bodyweight logs"
  on public.bodyweight_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bodyweight logs"
  on public.bodyweight_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bodyweight logs"
  on public.bodyweight_logs for delete
  using (auth.uid() = user_id);

create trigger bodyweight_logs_set_updated_at
  before update on public.bodyweight_logs
  for each row
  execute function public.set_updated_at();
