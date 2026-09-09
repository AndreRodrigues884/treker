-- Lets a user hide an exercise from the "1RM Estimado" picker in
-- Statistics without affecting anything else (Força Total still sums
-- every load-tracking exercise regardless of this flag).
alter table public.exercises add column track_1rm boolean not null default true;
