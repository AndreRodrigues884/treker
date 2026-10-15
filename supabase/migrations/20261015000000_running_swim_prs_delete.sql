-- running_prs/swim_prs are append-only in general (see
-- 20261009000000_running_swim_prs.sql) — a genuine PR is never edited.
-- But deleteLastRunAction/deleteLastSwimTimeAction need to remove a PR
-- that only exists because the underlying run/time was a data-entry
-- mistake (e.g. minutes and seconds mixed up), as part of their "undo
-- my last entry" safety feature. Without a delete policy here, that
-- cleanup silently matches 0 rows under RLS, leaving the bogus PR
-- behind even after the mistaken run/time itself is deleted.
--
-- This narrow escape hatch is scoped to running/swimming only, since
-- that's where the single-entry undo action exists; exercise_prs and
-- volume_milestones (Gym) have no equivalent action and stay
-- append-only with no delete policy at all.

create policy "Users can delete their own running PRs"
  on public.running_prs for delete
  using (auth.uid() = user_id);

create policy "Users can delete their own swim PRs"
  on public.swim_prs for delete
  using (auth.uid() = user_id);
