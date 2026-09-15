-- Some exercises are timed (a plank, a dead hang) rather than counted —
-- `reps` stays the one numeric target/logged column (renaming it would
-- touch exercise_sets too, for no real benefit); `unit` just says how to
-- read it.
create type public.exercise_unit as enum ('reps', 'seconds');

alter table public.exercises
  add column unit public.exercise_unit not null default 'reps';
