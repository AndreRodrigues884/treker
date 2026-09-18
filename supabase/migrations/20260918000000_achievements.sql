-- Achievements: real, earned records rather than invented game
-- mechanics — a personal record the moment it happens, and a lifetime
-- cumulative-volume milestone the moment it's crossed. Both are
-- append-only historical facts (no update policy on purpose: once
-- logged, a PR/milestone is never edited, only ever added to), detected
-- and inserted by saveSessionAction alongside the sets themselves.

create table public.exercise_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  session_date date not null,
  weight_kg numeric(6, 2) not null,
  reps integer not null,
  one_rep_max numeric(7, 2) not null,
  created_at timestamptz not null default now()
);

create index exercise_prs_user_id_idx on public.exercise_prs (user_id);

alter table public.exercise_prs enable row level security;

create policy "Users can view their own PRs"
  on public.exercise_prs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own PRs"
  on public.exercise_prs for insert
  with check (auth.uid() = user_id);

create table public.volume_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  threshold_kg bigint not null,
  achieved_at date not null,
  created_at timestamptz not null default now(),
  unique (user_id, threshold_kg)
);

create index volume_milestones_user_id_idx on public.volume_milestones (user_id);

alter table public.volume_milestones enable row level security;

create policy "Users can view their own volume milestones"
  on public.volume_milestones for select
  using (auth.uid() = user_id);

create policy "Users can insert their own volume milestones"
  on public.volume_milestones for insert
  with check (auth.uid() = user_id);
