-- Two more granular muscle groups, added alongside the existing ones
-- the same way quads/hamstrings/glutes/lats/traps were (see
-- 20261102000000_more_muscle_groups.sql) — never a replacement for
-- biceps/triceps/legs, just a finer option for anyone who trains
-- forearms or calves as their own day.
alter type public.muscle_group add value 'forearms';
alter type public.muscle_group add value 'calves';
