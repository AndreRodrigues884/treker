-- A "routine" groups exercises that share one progress chart — e.g. a
-- Legs day that changes exercises mid-week still gets two separate
-- charts ("Legs A", "Legs B") instead of one chart per exercise or one
-- undifferentiated chart per muscle group.

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  muscle_group public.muscle_group not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routines_user_muscle_group_idx
  on public.routines (user_id, muscle_group);

alter table public.routines enable row level security;

create policy "Users can view their own routines"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Users can insert their own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own routines"
  on public.routines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

create trigger routines_set_updated_at
  before update on public.routines
  for each row
  execute function public.set_updated_at();

-- Every exercise now belongs to a routine. Backfill: give each
-- (user, muscle_group) that already has exercises a single "Workout 1"
-- routine and assign all of them to it, before making the column
-- required.
alter table public.exercises add column routine_id uuid references public.routines (id) on delete cascade;

insert into public.routines (user_id, muscle_group, name)
select distinct user_id, muscle_group, 'Workout 1'
from public.exercises
where routine_id is null;

update public.exercises e
set routine_id = r.id
from public.routines r
where e.routine_id is null
  and e.user_id = r.user_id
  and e.muscle_group = r.muscle_group
  and r.name = 'Workout 1';

alter table public.exercises alter column routine_id set not null;

create index exercises_routine_id_idx on public.exercises (routine_id);
