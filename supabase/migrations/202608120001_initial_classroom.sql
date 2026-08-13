-- Florie Games: durable lesson state, learning history, and least-privilege
-- access for one teacher and one child per lesson.
--
-- Covers both game categories:
--   Maths            — questions with a right answer
--   Feelings & Focus — mostly observations, which are never marked
create extension if not exists pgcrypto;

create type public.lesson_status as enum ('waiting','active','paused','ended');
create type public.participant_role as enum ('student');
create type public.response_outcome as enum ('objective','observational','marked');

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default 'Florie' check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  join_code text not null unique check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  status public.lesson_status not null default 'waiting',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  current_game text check (current_game is null or current_game in (
    'flash-hide','feed-monster','bond-garden','ten-frame','number-line',
    'feeling-thermometer','opposite-game','mirror-faces','scavenger-hunt',
    'rock-buddy','freeze-dance')),
  -- One settings block per game, so switching games never loses setup.
  current_settings jsonb not null default '{
    "flash-hide":{"max":5,"duration":1000,"representation":"dots"},
    "feed-monster":{"target":5,"start":2,"randomStart":true,"showEquation":true},
    "bond-garden":{"target":5,"challenge":false,"showEquation":true},
    "ten-frame":{"mode":"build","target":7,"randomTarget":false,"flashDuration":1200,"showEquation":true},
    "number-line":{"range":10,"operation":"+","amount":2,"start":3,"randomStart":true,"character":"rabbit","predict":false,"showEquation":true},
    "feeling-thermometer":{"mode":"me","vocabulary":"starter","askBody":true,"askStrategy":true},
    "opposite-game":{"level":1,"mode":"observed"},
    "mirror-faces":{"mode":"guess","askClue":true,"includeAmbiguous":false},
    "scavenger-hunt":{"askWhy":true,"askNext":true,"askOther":false},
    "rock-buddy":{"breaths":3,"pace":"slow","position":"sit","askReflection":true},
    "freeze-dance":{"mode":"classic"}
  }'::jsonb,
  active_round jsonb,
  -- The teacher's live instruction inside an open round (JUMP, FREEZE, a
  -- face to pull). Stored so a child who reconnects still sees it.
  active_cue jsonb,
  -- A game set aside by Quick Break, waiting to be returned to.
  parked_game jsonb,
  -- Number bonds the child has discovered, keyed by target: {"5":[[2,3]]}
  discoveries jsonb not null default '{}'::jsonb,
  teacher_note text check (char_length(teacher_note) <= 2000)
);

create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lesson_sessions(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  role public.participant_role not null default 'student',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(session_id, auth_user_id),
  -- V1 is one child per lesson.
  unique(session_id)
);

create table public.game_rounds (
  id uuid primary key,
  session_id uuid not null references public.lesson_sessions(id) on delete cascade,
  game_id text not null,
  round_number integer not null check (round_number > 0),
  question_data jsonb not null,
  -- Null for Feelings & Focus rounds: there is no correct way to feel.
  correct_answer jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(session_id, round_number)
);

-- One table for three genuinely different kinds of thing. Forcing a child's
-- feeling into `is_correct` is exactly what this schema must not do.
create table public.game_responses (
  id uuid primary key,
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  session_id uuid not null references public.lesson_sessions(id) on delete cascade,
  participant_id uuid not null references public.session_participants(id) on delete cascade,
  outcome public.response_outcome not null,
  -- Ordinal within the round, for display only.
  attempt_number integer not null check (attempt_number > 0),
  -- Pre-formatted for the teacher's history strip.
  label text not null,

  -- outcome = 'objective'
  answer_data jsonb,
  is_correct boolean,
  response_time_ms integer check (response_time_ms is null or response_time_ms between 0 and 3600000),

  -- outcome = 'observational' — what the child noticed or chose
  field text,
  choices jsonb,
  level integer,

  -- outcome = 'marked' — what the teacher saw on the video call
  mark text check (mark is null or mark in
    ('got-it','try-again','froze','needed-cue','completed')),

  created_at timestamptz not null default now(),

  constraint objective_needs_an_answer check (
    outcome <> 'objective' or (answer_data is not null and is_correct is not null)),
  constraint observational_needs_choices check (
    outcome <> 'observational' or (field is not null and choices is not null)),
  -- An observation can never be marked right or wrong.
  constraint observational_is_never_marked check (
    outcome <> 'observational' or (is_correct is null and mark is null)),
  constraint marked_needs_a_mark check (
    outcome <> 'marked' or mark is not null)
);

create index lesson_sessions_teacher_created_idx on public.lesson_sessions(teacher_id, created_at desc);
create index session_participants_user_idx on public.session_participants(auth_user_id, session_id);
create index game_rounds_session_idx on public.game_rounds(session_id, round_number);
create index game_responses_session_idx on public.game_responses(session_id, created_at);
create index game_responses_round_idx on public.game_responses(round_id);

alter table public.teacher_profiles enable row level security;
alter table public.lesson_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.game_rounds enable row level security;
alter table public.game_responses enable row level security;

-- ------------------------------------------------------------------
-- Membership helpers
-- ------------------------------------------------------------------

create function public.owns_lesson(p_session uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.lesson_sessions s
    join public.teacher_profiles t on t.id = s.teacher_id
    where s.id = p_session and t.auth_user_id = auth.uid()
  )
$$;

create function public.joined_lesson(p_session uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.session_participants p
    where p.session_id = p_session and p.auth_user_id = auth.uid()
  )
$$;

revoke all on function public.owns_lesson(uuid), public.joined_lesson(uuid) from public;
grant execute on function public.owns_lesson(uuid), public.joined_lesson(uuid) to authenticated;

-- ------------------------------------------------------------------
-- Row level security
-- ------------------------------------------------------------------

create policy teacher_own_profile on public.teacher_profiles
  for all to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy teacher_own_sessions on public.lesson_sessions
  for all to authenticated using (public.owns_lesson(id)) with check (public.owns_lesson(id));

create policy student_current_session_read on public.lesson_sessions
  for select to authenticated using (public.joined_lesson(id));

create policy teacher_participants on public.session_participants
  for select to authenticated using (public.owns_lesson(session_id));

create policy student_own_membership on public.session_participants
  for select to authenticated using (auth_user_id = auth.uid());

create policy teacher_rounds on public.game_rounds
  for all to authenticated using (public.owns_lesson(session_id)) with check (public.owns_lesson(session_id));

create policy student_rounds_read on public.game_rounds
  for select to authenticated using (public.joined_lesson(session_id));

create policy teacher_responses_read on public.game_responses
  for select to authenticated using (public.owns_lesson(session_id));

-- A child can read their own work, but never a teacher's private mark.
create policy student_responses_read on public.game_responses
  for select to authenticated using (
    outcome <> 'marked'
    and participant_id in (
      select id from public.session_participants where auth_user_id = auth.uid())
  );

create policy student_responses_insert on public.game_responses
  for insert to authenticated with check (
    outcome <> 'marked'
    and participant_id in (
      select id from public.session_participants
      where auth_user_id = auth.uid() and session_id = game_responses.session_id)
    and exists (
      select 1 from public.game_rounds r
      where r.id = round_id and r.session_id = game_responses.session_id)
  );

-- ------------------------------------------------------------------
-- Secure joining. The sessions table is never searchable by join code
-- from the client; only this security-definer RPC resolves one.
-- ------------------------------------------------------------------

create function public.random_join_code() returns text
language plpgsql volatile security definer set search_path='' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end $$;

create function public.lesson_snapshot(s public.lesson_sessions, p_include_private boolean)
returns jsonb language plpgsql stable security definer set search_path='' as $$
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

create function public.create_lesson() returns jsonb
language plpgsql security definer set search_path='' as $$
declare profile_id uuid; new_session public.lesson_sessions; candidate text; tries int := 0;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Teacher sign-in required';
  end if;

  insert into public.teacher_profiles(auth_user_id) values (auth.uid())
    on conflict (auth_user_id) do nothing;
  select id into profile_id from public.teacher_profiles where auth_user_id = auth.uid();

  loop
    tries := tries + 1;
    candidate := public.random_join_code();
    begin
      insert into public.lesson_sessions(teacher_id, join_code, started_at)
        values (profile_id, candidate, now())
        returning * into new_session;
      exit;
    exception when unique_violation then
      if tries >= 10 then raise exception 'Could not allocate join code'; end if;
    end;
  end loop;

  return public.lesson_snapshot(new_session, true);
end $$;

create function public.join_lesson(p_join_code text, p_nickname text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare target public.lesson_sessions; member public.session_participants;
begin
  if auth.uid() is null or not coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Anonymous learner sign-in required';
  end if;
  if char_length(trim(p_nickname)) not between 1 and 24 then
    raise exception 'Please enter a first name';
  end if;

  select * into target from public.lesson_sessions
    where join_code = upper(trim(p_join_code)) for update;
  if not found then raise exception 'Invalid lesson code'; end if;
  if target.status = 'ended' then raise exception 'Lesson ended'; end if;

  select * into member from public.session_participants where session_id = target.id;
  if found and member.auth_user_id <> auth.uid() then
    raise exception 'Lesson already has a learner';
  end if;

  insert into public.session_participants(session_id, auth_user_id, nickname)
    values (target.id, auth.uid(), trim(p_nickname))
    on conflict (session_id, auth_user_id)
      do update set nickname = excluded.nickname, last_seen_at = now()
    returning * into member;

  update public.lesson_sessions
    set status = 'active', started_at = coalesce(started_at, now())
    where id = target.id
    returning * into target;

  return public.lesson_snapshot(target, false);
end $$;

revoke all on function public.random_join_code(), public.create_lesson(),
  public.join_lesson(text, text), public.lesson_snapshot(public.lesson_sessions, boolean) from public;
grant execute on function public.create_lesson(), public.join_lesson(text, text) to authenticated;

-- ------------------------------------------------------------------
-- Durable state + learning history.
--
-- The teacher owns the lesson document and is the single writer, so a
-- response can never arrive before the round it belongs to.
-- ------------------------------------------------------------------

create function public.sync_lesson_state(p_snapshot jsonb) returns void
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
    active_round = case when r is null or r = 'null'::jsonb then null else r end,
    active_cue = case when p_snapshot->'cue' = 'null'::jsonb then null else p_snapshot->'cue' end,
    parked_game = case when parked is null or parked = 'null'::jsonb then null else parked end,
    discoveries = coalesce(p_snapshot->'discoveries', discoveries),
    teacher_note = nullif(p_snapshot->>'note', ''),
    ended_at = case when p_snapshot->>'status' = 'ended' then coalesce(ended_at, now()) else ended_at end
  where id = sid;

  -- Store the active round, and anything Quick Break set aside, before any
  -- of their responses.
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
      on conflict (id) do nothing;
  end loop;

  select id into pid from public.session_participants where session_id = sid;
  if pid is null then return; end if;

  for item in select * from jsonb_array_elements(coalesce(p_snapshot->'responses', '[]'::jsonb)) loop
    -- Skip anything whose round has not been stored yet; the next sync
    -- picks it up rather than failing the whole call.
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

create function public.get_lesson_snapshot(p_session_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s public.lesson_sessions;
begin
  if not (public.owns_lesson(p_session_id) or public.joined_lesson(p_session_id)) then
    raise exception 'Lesson access denied';
  end if;
  select * into s from public.lesson_sessions where id = p_session_id;
  return public.lesson_snapshot(s, public.owns_lesson(p_session_id));
end $$;

revoke all on function public.sync_lesson_state(jsonb), public.get_lesson_snapshot(uuid) from public;
grant execute on function public.sync_lesson_state(jsonb), public.get_lesson_snapshot(uuid) to authenticated;

-- ------------------------------------------------------------------
-- Private Realtime channels. Both roles must already belong to the
-- lesson UUID inside the topic `session:<uuid>`.
-- ------------------------------------------------------------------

create policy lesson_broadcast_read on realtime.messages
  for select to authenticated using (
    realtime.messages.extension in ('broadcast','presence')
    and (public.owns_lesson((split_part(realtime.topic(), ':', 2))::uuid)
      or public.joined_lesson((split_part(realtime.topic(), ':', 2))::uuid))
  );

create policy lesson_broadcast_write on realtime.messages
  for insert to authenticated with check (
    realtime.messages.extension in ('broadcast','presence')
    and (public.owns_lesson((split_part(realtime.topic(), ':', 2))::uuid)
      or public.joined_lesson((split_part(realtime.topic(), ':', 2))::uuid))
  );
