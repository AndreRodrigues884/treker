-- Grava uma sessão de ginásio inteira numa só transação:
-- séries, PRs e marcos de volume.

create or replace function public.save_gym_session(
  p_muscle_group public.muscle_group,
  p_session_date date,
  p_sets jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bodyweight numeric;
  v_input_count int;
  v_saved_count int;
  v_prior_volume numeric;
  v_new_volume numeric;
  v_prs jsonb;
  v_milestones jsonb;
  -- Manter igual a VOLUME_MILESTONES_KG em src/lib/constants/gym.ts
  v_thresholds bigint[] := array[10000, 25000, 50000, 100000, 250000, 500000, 1000000];
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Uma gravação de cada vez por utilizador (liberta-se no fim da transação)
  perform pg_advisory_xact_lock(hashtext('save_gym_session:' || v_user_id::text));

  select bodyweight_kg into v_bodyweight
  from profiles where id = v_user_id;

  -- Só passam as séries cujo exercício é deste utilizador e deste grupo muscular
  drop table if exists _incoming;
  create temporary table _incoming on commit drop as
  select
    s.exercise_id,
    s.set_number,
    s.weight_kg,
    s.reps,
    s.execution_type,
    s.difficulty,
    (e.tracks_load and e.unit = 'reps') as pr_eligible,
    case when e.adds_bodyweight then coalesce(v_bodyweight, 0) else 0 end as extra_bw,
    e.name as exercise_name
  from jsonb_to_recordset(p_sets) as s(
    exercise_id uuid,
    set_number int,
    weight_kg numeric,
    reps int,
    execution_type public.execution_type,
    difficulty public.set_difficulty
  )
  join exercises e
    on e.id = s.exercise_id
   and e.user_id = v_user_id
   and e.muscle_group = p_muscle_group;

  v_input_count := jsonb_array_length(p_sets);
  select count(*) into v_saved_count from _incoming;

  if v_saved_count = 0 then
    return jsonb_build_object(
      'saved_count', 0,
      'stale_count', v_input_count,
      'prs', '[]'::jsonb,
      'milestones_kg', '[]'::jsonb
    );
  end if;

  -- Volume total até agora, SEM as séries que esta gravação vai substituir
  select coalesce(sum(es.weight_kg * es.reps), 0) into v_prior_volume
  from exercise_sets es
  join exercises e on e.id = es.exercise_id
  where es.user_id = v_user_id
    and e.tracks_load and e.unit = 'reps'
    and es.weight_kg is not null
    and not exists (
      select 1 from _incoming i
      where i.exercise_id = es.exercise_id
        and i.set_number = es.set_number
        and es.session_date = p_session_date
    );

  select coalesce(sum(weight_kg * reps), 0) into v_new_volume
  from _incoming
  where pr_eligible and weight_kg is not null;

  -- PRs: melhor série nova vs. melhor de sempre (fórmula de Epley com peso corporal)
  with new_best as (
    select distinct on (exercise_id)
      exercise_id, exercise_name, weight_kg, reps,
      (weight_kg + extra_bw) * (1 + reps / 30.0) - extra_bw as one_rm
    from _incoming
    where pr_eligible and weight_kg is not null and reps > 0
    order by exercise_id,
      (weight_kg + extra_bw) * (1 + reps / 30.0) - extra_bw desc
  ),
  prior_best as (
    select es.exercise_id,
      max((es.weight_kg + i.extra_bw) * (1 + es.reps / 30.0) - i.extra_bw) as one_rm
    from exercise_sets es
    join (select distinct exercise_id, extra_bw from _incoming) i
      on i.exercise_id = es.exercise_id
    where es.weight_kg is not null and es.reps > 0
    group by es.exercise_id
  ),
  inserted as (
    insert into exercise_prs (user_id, exercise_id, session_date, weight_kg, reps, one_rep_max)
    select v_user_id, n.exercise_id, p_session_date, n.weight_kg, n.reps, round(n.one_rm, 2)
    from new_best n
    left join prior_best p on p.exercise_id = n.exercise_id
    where n.one_rm > coalesce(p.one_rm, 0)
    returning exercise_id, weight_kg, reps, one_rep_max
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'exercise_name', n.exercise_name,
    'weight_kg', ins.weight_kg,
    'reps', ins.reps,
    'one_rep_max', ins.one_rep_max
  )), '[]'::jsonb)
  into v_prs
  from inserted ins
  join new_best n on n.exercise_id = ins.exercise_id;

  -- Grava as séries (substitui se já existirem no mesmo dia)
  insert into exercise_sets (
    user_id, exercise_id, session_date, set_number,
    weight_kg, reps, execution_type, difficulty
  )
  select v_user_id, exercise_id, p_session_date, set_number,
         weight_kg, reps, execution_type, difficulty
  from _incoming
  on conflict (exercise_id, session_date, set_number) do update set
    weight_kg = excluded.weight_kg,
    reps = excluded.reps,
    execution_type = excluded.execution_type,
    difficulty = excluded.difficulty;

  -- Marcos de volume ultrapassados nesta gravação
  with crossed as (
    select t as threshold
    from unnest(v_thresholds) as t
    where v_prior_volume < t and v_prior_volume + v_new_volume >= t
  ),
  inserted as (
    insert into volume_milestones (user_id, threshold_kg, achieved_at)
    select v_user_id, threshold, p_session_date from crossed
    on conflict (user_id, threshold_kg) do nothing
    returning threshold_kg
  )
  select coalesce(jsonb_agg(threshold_kg order by threshold_kg), '[]'::jsonb)
  into v_milestones
  from inserted;

  return jsonb_build_object(
    'saved_count', v_saved_count,
    'stale_count', v_input_count - v_saved_count,
    'prs', v_prs,
    'milestones_kg', v_milestones
  );
end;
$$;

revoke all on function public.save_gym_session(public.muscle_group, date, jsonb) from public, anon;
grant execute on function public.save_gym_session(public.muscle_group, date, jsonb) to authenticated;