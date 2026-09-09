-- Manual drag-to-reorder needs an explicit sort order — created_at was a
-- stand-in until now.
alter table public.exercises add column position integer not null default 0;

-- Backfill: preserve current (created_at) order as the initial position
-- per routine, so existing lists don't visually jump on first load.
with ordered as (
  select id, row_number() over (partition by routine_id order by created_at) - 1 as rn
  from public.exercises
)
update public.exercises e
set position = ordered.rn
from ordered
where e.id = ordered.id;
