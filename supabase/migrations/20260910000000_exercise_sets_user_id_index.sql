-- exercise_sets only had an index leading with exercise_id, but
-- getAllExerciseSets(userId) (Overview, Statistics) filters directly by
-- user_id — add the matching index so that stays an index scan instead
-- of a sequential one as the table grows.
create index exercise_sets_user_id_idx on public.exercise_sets (user_id);
