-- Testes à função save_gym_session.
-- Corre tudo dentro de uma transação e faz ROLLBACK no fim:
-- não deixa nenhum dado na base de dados.
-- Se um teste falhar, pára com "ASSERT failed: <descrição>".

begin;

-- ---------- Dados de teste (como admin, ignora RLS) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'andre@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'outro@test.local');

insert into public.profiles (id, bodyweight_kg) values
  ('00000000-0000-0000-0000-00000000000a', 80),
  ('00000000-0000-0000-0000-00000000000b', 70);

insert into public.routines (id, user_id, muscle_group, name) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'chest', 'Peito A'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'back',  'Costas A'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'chest', 'Peito B');

insert into public.exercises
  (id, user_id, routine_id, muscle_group, name, sets, reps, tracks_load, unit, adds_bodyweight)
values
  -- do André, peito
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-0000000000a1', 'chest', 'Supino', 3, 8, true, 'reps', false),
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-0000000000a1', 'chest', 'Dips com peso', 3, 8, true, 'reps', true),
  -- do André, costas (grupo muscular diferente)
  ('00000000-0000-0000-0000-0000000e0003', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-0000000000a2', 'back', 'Remada', 3, 8, true, 'reps', false),
  -- de outro utilizador
  ('00000000-0000-0000-0000-0000000e0009', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-0000000000b1', 'chest', 'Supino do outro', 3, 8, true, 'reps', false);

-- ---------- A partir daqui, age como o André (com RLS) ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

do $$
declare
  r jsonb;
  n int;
begin
  -- 1. Primeira sessão: supino 100kg x 5 -> é PR (não havia histórico)
  r := save_gym_session('chest', '2026-11-01', '[
    {"exercise_id":"00000000-0000-0000-0000-0000000e0001","set_number":1,"weight_kg":100,"reps":5,"execution_type":"straight","difficulty":"hard"},
    {"exercise_id":"00000000-0000-0000-0000-0000000e0001","set_number":2,"weight_kg":90,"reps":8,"execution_type":"straight","difficulty":"medium"}
  ]');
  assert (r->>'saved_count')::int = 2, '1: devia gravar 2 séries';
  assert jsonb_array_length(r->'prs') = 1, '1: devia haver 1 PR';
  -- 100x5 -> 1RM 116.67 ; 90x8 -> 1RM 114.00 ; o melhor é 116.67
  assert (r->'prs'->0->>'one_rep_max')::numeric = 116.67, '1: PR devia ser 116.67 (100kg x 5)';

  -- 2. Gravar a MESMA sessão outra vez -> não cria PR repetido
  r := save_gym_session('chest', '2026-11-01', '[
    {"exercise_id":"00000000-0000-0000-0000-0000000e0001","set_number":1,"weight_kg":100,"reps":5,"execution_type":"straight","difficulty":"hard"},
    {"exercise_id":"00000000-0000-0000-0000-0000000e0001","set_number":2,"weight_kg":90,"reps":8,"execution_type":"straight","difficulty":"medium"}
  ]');
  assert jsonb_array_length(r->'prs') = 0, '2: re-gravar não deve criar PR';
  select count(*) into n from exercise_sets;
  assert n = 2, '2: re-gravar deve substituir, não duplicar séries';
  select count(*) into n from exercise_prs;
  assert n = 1, '2: só deve existir 1 PR na tabela';

  -- 3. Série de outro utilizador e de outro grupo muscular -> ignoradas (stale)
  r := save_gym_session('chest', '2026-11-02', '[
    {"exercise_id":"00000000-0000-0000-0000-0000000e0009","set_number":1,"weight_kg":200,"reps":5,"execution_type":"straight","difficulty":"hard"},
    {"exercise_id":"00000000-0000-0000-0000-0000000e0003","set_number":1,"weight_kg":80,"reps":8,"execution_type":"straight","difficulty":"hard"},
    {"exercise_id":"00000000-0000-0000-0000-0000000e0001","set_number":1,"weight_kg":95,"reps":5,"execution_type":"straight","difficulty":"hard"}
  ]');
  assert (r->>'saved_count')::int = 1, '3: só a série do supino do André deve gravar';
  assert (r->>'stale_count')::int = 2, '3: as outras 2 devem contar como stale';
  assert jsonb_array_length(r->'prs') = 0, '3: 95x5 não bate 100x5';

  -- 4. Peso corporal: dips +20kg x 5 com 80kg de peso corporal
  --    1RM = (20+80)*(1+5/30) - 80 = 36.67
  r := save_gym_session('chest', '2026-11-03', '[
    {"exercise_id":"00000000-0000-0000-0000-0000000e0002","set_number":1,"weight_kg":20,"reps":5,"execution_type":"straight","difficulty":"hard"}
  ]');
  assert (r->'prs'->0->>'one_rep_max')::numeric = 36.67, '4: 1RM com peso corporal devia ser 36.67';

  -- 5. Marco de volume: volume atual = 500+720+475+100 = 1795 kg.
  --    Uma série de 100kg x 100 reps (10000) passa os 10 000 kg.
  r := save_gym_session('chest', '2026-11-04', '[
    {"exercise_id":"00000000-0000-0000-0000-0000000e0001","set_number":1,"weight_kg":100,"reps":100,"execution_type":"straight","difficulty":"hard"}
  ]');
  assert r->'milestones_kg' = '[10000]'::jsonb, '5: devia desbloquear o marco de 10000 kg';

  -- 6. Volume a dobrar: volume atual = 11 795 kg. Corrigir a série de hoje
  --    para 100kg x 200 (20 000) dá 11 795 - 10 000 + 20 000 = 21 795,
  --    abaixo dos 25 000. O código antigo somava 11 795 + 20 000 = 31 795
  --    e desbloqueava os 25 000 por engano.
  r := save_gym_session('chest', '2026-11-04', '[
    {"exercise_id":"00000000-0000-0000-0000-0000000e0001","set_number":1,"weight_kg":100,"reps":200,"execution_type":"straight","difficulty":"hard"}
  ]');
  assert r->'milestones_kg' = '[]'::jsonb, '6: não devia desbloquear os 25 000 kg';
  select count(*) into n from volume_milestones;
  assert n = 1, '6: só deve existir 1 marco';

  -- 7. Só séries de outros -> saved_count 0, nada gravado
  r := save_gym_session('chest', '2026-11-05', '[
    {"exercise_id":"00000000-0000-0000-0000-0000000e0009","set_number":1,"weight_kg":50,"reps":5,"execution_type":"straight","difficulty":"hard"}
  ]');
  assert (r->>'saved_count')::int = 0, '7: nada deve gravar';

  raise notice 'TODOS OS TESTES PASSARAM';
end;
$$;

-- 8. Sem sessão (anon) -> não pode chamar a função
reset role;
set local role anon;
do $$
begin
  perform save_gym_session('chest', '2026-11-06', '[]');
  raise exception '8: anon não devia conseguir chamar a função';
exception
  when insufficient_privilege then
    raise notice '8: anon bloqueado (OK)';
end;
$$;

rollback;