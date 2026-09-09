-- Gym module: exercises (grouped by a fixed, pre-defined muscle group —
-- not free text) and the individual logged sets that back both the
-- "last time" comparison and the progression charts.

create type public.muscle_group as enum (
  'back',
  'chest',
  'legs',
  'shoulders',
  'biceps',
  'triceps',
  'core'
);

create type public.execution_type as enum ('straight', 'mini_pause', 'rest_pause');

create type public.set_difficulty as enum ('easy', 'medium', 'hard');

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  muscle_group public.muscle_group not null,
  name text not null,
  sets int not null check (sets > 0),
  reps int not null check (reps > 0),
  tracks_load boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_user_muscle_group_idx
  on public.exercises (user_id, muscle_group);

alter table public.exercises enable row level security;

create policy "Users can view their own exercises"
  on public.exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert their own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exercises"
  on public.exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row
  execute function public.set_updated_at();

-- One row per completed set. session_date groups sets logged in the same
-- visit; (exercise_id, session_date, set_number) is unique so re-saving a
-- set (the "OK" button) is an upsert, not a growing duplicate log.
create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  session_date date not null default current_date,
  set_number int not null check (set_number > 0),
  weight_kg numeric(6, 2),
  reps int not null check (reps >= 0),
  execution_type public.execution_type not null default 'straight',
  difficulty public.set_difficulty not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exercise_id, session_date, set_number)
);

create index exercise_sets_exercise_session_idx
  on public.exercise_sets (exercise_id, session_date);

alter table public.exercise_sets enable row level security;

create policy "Users can view their own exercise sets"
  on public.exercise_sets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own exercise sets"
  on public.exercise_sets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exercise sets"
  on public.exercise_sets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own exercise sets"
  on public.exercise_sets for delete
  using (auth.uid() = user_id);

create trigger exercise_sets_set_updated_at
  before update on public.exercise_sets
  for each row
  execute function public.set_updated_at();
