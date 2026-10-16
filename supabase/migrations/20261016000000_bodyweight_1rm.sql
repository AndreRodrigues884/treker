-- Body metrics: a single current value per user, not a history/log (the
-- earlier bodyweight-tracking feature was removed) — used only so the
-- 1RM calculation can be correct for exercises whose true resistance is
-- bodyweight + an added load, not the logged weight alone. Nullable:
-- most exercises don't need it, and there's no reason to force every
-- user to fill it in up front.
alter table public.profiles
  add column bodyweight_kg numeric(5, 2),
  add column height_cm numeric(5, 1);

-- Marks an exercise where the logged weight is only PART of the real
-- resistance — weighted pull-ups/dips, where the lifter's own
-- bodyweight is in the chain too. Only meaningful alongside
-- tracks_load + unit = 'reps', the same scope the 1RM/PR calculations
-- already restrict themselves to.
alter table public.exercises
  add column adds_bodyweight boolean not null default false;
