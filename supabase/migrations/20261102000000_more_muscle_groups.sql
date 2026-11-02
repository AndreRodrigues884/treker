-- More granular muscle groups, for users who split a broad group (most
-- commonly legs) across several training days — e.g. a quad-focused
-- day, a hamstring/posterior-chain day, and a glute day, instead of one
-- single "Legs" day. Added as NEW enum values alongside the existing
-- ones (never removed/renamed), so every existing exercise/routine
-- already tagged "legs" or "back" keeps working unchanged — this is
-- purely an opt-in, more granular option going forward.
alter type public.muscle_group add value 'quads';
alter type public.muscle_group add value 'hamstrings';
alter type public.muscle_group add value 'glutes';
alter type public.muscle_group add value 'lats';
alter type public.muscle_group add value 'traps';
