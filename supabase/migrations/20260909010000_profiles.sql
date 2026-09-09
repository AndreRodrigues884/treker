-- Onboarding data: which sports a user tracks and why. Both are fixed,
-- pre-defined lists (enums), not free text, so dashboards/aggregations
-- downstream stay consistent.

create type public.modality as enum ('gym', 'swimming', 'running');

create type public.training_goal as enum (
  'build_muscle',
  'lose_weight',
  'improve_endurance',
  'general_fitness',
  'performance'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  modalities public.modality[] not null default '{}',
  goals public.training_goal[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at accurate on every update, without relying on every
-- caller to remember to set it.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
