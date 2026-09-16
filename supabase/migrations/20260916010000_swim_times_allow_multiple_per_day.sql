-- Multiple attempts of the same event on the same day are a normal
-- training pattern (e.g. 3x 50m freestyle repeats in one session) — each
-- logged time is now its own row/attempt instead of one value per day
-- per event.
alter table public.swim_times
  drop constraint swim_times_user_id_stroke_distance_m_session_date_key;
