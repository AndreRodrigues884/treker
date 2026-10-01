-- Tracks when a user says "I did the deload session" for a plateaued
-- exercise, so Statistics can hide it from Deload Analysis — one row
-- per (user, exercise), bumped (not inserted again) on re-acknowledge.
-- The exercise reappears automatically once a *new* set is logged after
-- this timestamp and the plateau condition still holds — there's no
-- "unacknowledge" action needed, that comparison lives in derive.ts.

create table public.deload_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create index deload_acknowledgements_user_id_idx on public.deload_acknowledgements (user_id);

alter table public.deload_acknowledgements enable row level security;

create policy "Users can view their own deload acknowledgements"
  on public.deload_acknowledgements for select
  using (auth.uid() = user_id);

create policy "Users can insert their own deload acknowledgements"
  on public.deload_acknowledgements for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own deload acknowledgements"
  on public.deload_acknowledgements for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
