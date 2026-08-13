-- Reading Adventures.
--
-- Extends the existing lesson schema rather than duplicating it: the same
-- sessions, rounds and responses carry reading work. Two things are new —
-- the teacher's phonics configuration, and mastery evidence that has to
-- outlive a single lesson.

-- ------------------------------------------------------------------
-- The eleven reading games join the allowed set.
-- ------------------------------------------------------------------

alter table public.lesson_sessions drop constraint if exists lesson_sessions_current_game_check;

alter table public.lesson_sessions add constraint lesson_sessions_current_game_check
  check (current_game is null or current_game in (
    'flash-hide','feed-monster','bond-garden','ten-frame','number-line',
    'feeling-thermometer','opposite-game','mirror-faces','scavenger-hunt',
    'rock-buddy','freeze-dance',
    'robot-translator','sound-safari','skywriter','sound-box-factory',
    'monster-lab','digraph-detectives','blend-train','magic-e-wizard',
    'tricky-treasure','word-ladder','story-quest'));

-- ------------------------------------------------------------------
-- "Sounds we know": which graphemes have been taught, which tricky words
-- are active, and the teacher's current focus. Shared by every reading
-- game, so it belongs on the session rather than in per-game settings.
-- ------------------------------------------------------------------

alter table public.lesson_sessions add column if not exists phonics jsonb not null default '{
  "enabled":["s","a","t","p","i","n","m","d","g","o","c","k"],
  "trickyActive":["the","said","was","you","they"],
  "focus":"R3"
}'::jsonb;

-- Reading observations the teacher makes while listening.
alter table public.game_responses drop constraint if exists game_responses_mark_check;

alter table public.game_responses add constraint game_responses_mark_check
  check (mark is null or mark in (
    'got-it','try-again','froze','needed-cue','completed',
    'read-independently','sounded-with-help','needed-prompt','guessed',
    'self-corrected','teacher-supplied','retold-independently',
    'retold-with-prompts'));

-- ------------------------------------------------------------------
-- Two-day mastery (spec §5 rule F, §25).
--
-- A milestone is secure only once it has been demonstrated on two
-- different days. This has to survive across lessons, so it is the one
-- piece of learner-level data in the schema.
--
-- There is no child account in this product. The only learner identity
-- that exists is the nickname typed at the join screen, so evidence is
-- keyed by (teacher, nickname). That is deliberately weak: it is a
-- teacher's private record, not an identity system.
-- ------------------------------------------------------------------

create table if not exists public.reading_mastery (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  learner_name text not null check (char_length(learner_name) between 1 and 24),
  stage text not null check (stage in ('R1','R2','R3','R4','R5','R6')),
  -- One row per day it was demonstrated; the unique key is what enforces
  -- "the same day twice is still one day".
  demonstrated_on date not null default current_date,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (teacher_id, learner_name, stage, demonstrated_on)
);

create index if not exists reading_mastery_lookup_idx
  on public.reading_mastery(teacher_id, learner_name, stage);

alter table public.reading_mastery enable row level security;

-- Strictly the owning teacher's record. A child can never read it.
create policy teacher_own_mastery on public.reading_mastery
  for all to authenticated
  using (
    teacher_id in (
      select id from public.teacher_profiles where auth_user_id = auth.uid()))
  with check (
    teacher_id in (
      select id from public.teacher_profiles where auth_user_id = auth.uid()));

-- ------------------------------------------------------------------
-- Snapshot + sync now carry the phonics configuration.
-- ------------------------------------------------------------------

create or replace function public.lesson_snapshot(
  s public.lesson_sessions,
  p_include_private boolean
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare nick text; items jsonb;
begin
  select nickname into nick from public.session_participants where session_id = s.id;

  select coalesce(jsonb_agg(
    jsonb_strip_nulls(jsonb_build_object(
      'id', r.id,
      'roundId', r.round_id,
      'game', gr.game_id,
      'outcome', r.outcome,
      'attempt', r.attempt_number,
      'label', r.label,
      'at', extract(epoch from r.created_at) * 1000,
      'answer', r.answer_data->'answer',
      'expected', r.answer_data->'expected',
      'kind', r.answer_data->>'kind',
      'correct', r.is_correct,
      'responseTimeMs', r.response_time_ms,
      'field', r.field,
      'choices', r.choices->'ids',
      'choiceLabels', r.choices->'labels',
      'possible', r.choices->'possible',
      'level', r.level,
      'mark', r.mark
    )) order by r.created_at), '[]'::jsonb)
  into items
  from public.game_responses r
  join public.game_rounds gr on gr.id = r.round_id
  where r.session_id = s.id
    and (p_include_private or r.outcome <> 'marked');

  return jsonb_build_object(
    'id', s.id,
    'code', s.join_code,
    'status', s.status,
    'nickname', nick,
    'game', s.current_game,
    'settings', s.current_settings,
    'phonics', s.phonics,
    'round', s.active_round,
    'cue', s.active_cue,
    'parked', s.parked_game,
    'responses', items,
    'discoveries', s.discoveries,
    'note', case when p_include_private then s.teacher_note else null end,
    'startedAt', extract(epoch from coalesce(s.started_at, s.created_at)) * 1000,
    'updatedAt', extract(epoch from now()) * 1000
  );
end $$;

create or replace function public.sync_lesson_state(p_snapshot jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare
  sid uuid := (p_snapshot->>'id')::uuid;
  r jsonb := p_snapshot->'round';
  parked jsonb := p_snapshot->'parked';
  next_no int;
  pid uuid;
  item jsonb;
begin
  if not public.owns_lesson(sid) then raise exception 'Not lesson owner'; end if;

  update public.lesson_sessions set
    status = (p_snapshot->>'status')::public.lesson_status,
    current_game = nullif(p_snapshot->>'game', ''),
    current_settings = coalesce(p_snapshot->'settings', current_settings),
    phonics = coalesce(p_snapshot->'phonics', phonics),
    active_round = case when r is null or r = 'null'::jsonb then null else r end,
    active_cue = case when p_snapshot->'cue' = 'null'::jsonb then null else p_snapshot->'cue' end,
    parked_game = case when parked is null or parked = 'null'::jsonb then null else parked end,
    discoveries = coalesce(p_snapshot->'discoveries', discoveries),
    teacher_note = nullif(p_snapshot->>'note', ''),
    ended_at = case when p_snapshot->>'status' = 'ended' then coalesce(ended_at, now()) else ended_at end
  where id = sid;

  for item in
    select * from jsonb_array_elements(
      (case when r is null or r = 'null'::jsonb then '[]'::jsonb else jsonb_build_array(r) end)
      || (case when parked is null or parked->'round' is null or parked->'round' = 'null'::jsonb
            then '[]'::jsonb else jsonb_build_array(parked->'round') end))
  loop
    select coalesce(max(round_number), 0) + 1 into next_no
      from public.game_rounds where session_id = sid;
    insert into public.game_rounds(id, session_id, game_id, round_number, question_data, correct_answer)
      values ((item->>'id')::uuid, sid, item->>'game', next_no, item,
              case when item->>'expected' is null then null
                   else jsonb_build_object('value', (item->>'expected')::int) end)
      -- A story page turn replaces the round in place, so keep the latest
      -- question data rather than the version we first stored.
      on conflict (id) do update set question_data = excluded.question_data;
  end loop;

  select id into pid from public.session_participants where session_id = sid;
  if pid is null then return; end if;

  for item in select * from jsonb_array_elements(coalesce(p_snapshot->'responses', '[]'::jsonb)) loop
    if exists (select 1 from public.game_rounds gr where gr.id = (item->>'roundId')::uuid) then
      insert into public.game_responses(
        id, round_id, session_id, participant_id, outcome, attempt_number, label,
        answer_data, is_correct, response_time_ms, field, choices, level, mark)
      values (
        (item->>'id')::uuid,
        (item->>'roundId')::uuid,
        sid,
        pid,
        (item->>'outcome')::public.response_outcome,
        (item->>'attempt')::int,
        coalesce(item->>'label', ''),
        case when item->>'outcome' = 'objective' then jsonb_strip_nulls(jsonb_build_object(
          'answer', (item->>'answer')::int,
          'expected', (item->>'expected')::int,
          'kind', item->>'kind')) end,
        case when item->>'outcome' = 'objective' then (item->>'correct')::boolean end,
        nullif(item->>'responseTimeMs', '')::int,
        case when item->>'outcome' = 'observational' then item->>'field' end,
        case when item->>'outcome' = 'observational' then jsonb_strip_nulls(jsonb_build_object(
          'ids', item->'choices',
          'labels', item->'choiceLabels',
          'possible', item->'possible')) end,
        nullif(item->>'level', '')::int,
        case when item->>'outcome' = 'marked' then item->>'mark' end)
      on conflict (id) do nothing;
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------------
-- Recording mastery evidence. Idempotent per day by construction.
-- ------------------------------------------------------------------

create or replace function public.record_reading_evidence(
  p_learner text,
  p_stage text,
  p_note text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare profile_id uuid; days date[];
begin
  select id into profile_id from public.teacher_profiles where auth_user_id = auth.uid();
  if profile_id is null then raise exception 'Teacher sign-in required'; end if;

  insert into public.reading_mastery(teacher_id, learner_name, stage, note)
    values (profile_id, trim(p_learner), p_stage, p_note)
    on conflict (teacher_id, learner_name, stage, demonstrated_on) do nothing;

  select array_agg(demonstrated_on order by demonstrated_on) into days
    from public.reading_mastery
    where teacher_id = profile_id and learner_name = trim(p_learner) and stage = p_stage;

  return jsonb_build_object(
    'stage', p_stage,
    'days', to_jsonb(coalesce(days, '{}')),
    -- Two different days, and not one before. The teacher still decides
    -- whether the child moves on; this is only evidence.
    'status', case
      when coalesce(array_length(days, 1), 0) >= 2 then 'secure'
      when coalesce(array_length(days, 1), 0) = 1 then 'emerging'
      else 'not-started' end
  );
end $$;

revoke all on function public.record_reading_evidence(text, text, text) from public;
grant execute on function public.record_reading_evidence(text, text, text) to authenticated;
