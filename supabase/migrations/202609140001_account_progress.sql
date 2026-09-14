-- Account progress: private rows, idempotent answer writes, atomic resets.
-- Safe to apply after the same setup was run manually in the SQL Editor.
begin;

create table if not exists public.math2ai_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 course_version text not null check (length(course_version) between 1 and 32),
 epoch bigint not null default 0,
 revision bigint not null default 0,
 primary key (user_id, course_version)
);
create table if not exists public.math2ai_answers (
 user_id uuid not null,
 course_version text not null,
 question_id text not null,
 first_answer smallint not null check (first_answer between 0 and 3),
 last_answer smallint not null check (last_answer between 0 and 3),
 attempts integer not null check (attempts > 0),
 choices integer not null check (choices between 1 and 15),
 primary key (user_id, course_version, question_id),
 foreign key (user_id, course_version) references public.math2ai_progress on delete cascade
);
create table if not exists public.math2ai_operations (
 user_id uuid not null,
 course_version text not null,
 operation_id uuid not null,
 primary key (user_id, course_version, operation_id),
 foreign key (user_id, course_version) references public.math2ai_progress on delete cascade
);

alter table public.math2ai_progress enable row level security;
alter table public.math2ai_answers enable row level security;
alter table public.math2ai_operations enable row level security;
revoke all on public.math2ai_progress, public.math2ai_answers, public.math2ai_operations from public, anon, authenticated;
grant select on public.math2ai_progress, public.math2ai_answers to authenticated;
drop policy if exists own_progress on public.math2ai_progress;
create policy own_progress on public.math2ai_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists own_answers on public.math2ai_answers;
create policy own_answers on public.math2ai_answers for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.math2ai_sync(p_user_id uuid, p_course_version text, p_epoch bigint default null, p_attempts jsonb default '[]')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 current_progress public.math2ai_progress%rowtype;
 item jsonb;
 operation uuid;
 question text;
 answer smallint;
 inserted boolean;
 changed boolean := false;
 result jsonb;
begin
 if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'Not authorized' using errcode = '42501'; end if;
 if p_course_version is null or length(p_course_version) not between 1 and 32 then raise exception 'Invalid course'; end if;
 if p_attempts is null or jsonb_typeof(p_attempts) <> 'array' then raise exception 'Invalid attempts'; end if;
 if jsonb_array_length(p_attempts) > 100 or octet_length(p_attempts::text) > 50000 then raise exception 'Batch too large'; end if;
 insert into public.math2ai_progress(user_id, course_version) values (p_user_id, p_course_version) on conflict do nothing;
 -- All writes and resets for an account/course share this transaction lock.
 select * into current_progress from public.math2ai_progress where user_id = p_user_id and course_version = p_course_version for update;
 if p_epoch = current_progress.epoch then
  for item in select value from jsonb_array_elements(p_attempts) loop
   if jsonb_typeof(item->'answer') <> 'number' or (item->>'answer') !~ '^[0-3]$'
      or item->>'question_id' is null or (item->>'question_id') !~ '^[0-9]{1,3}(-r[0-9]{1,3})?-[0-9]{2}$'
      or item->>'id' is null then raise exception 'Invalid answer'; end if;
   operation := (item->>'id')::uuid;
   question := item->>'question_id';
   answer := (item->>'answer')::smallint;
   inserted := false;
   insert into public.math2ai_operations values (p_user_id, p_course_version, operation) on conflict do nothing returning true into inserted;
   if inserted then
    insert into public.math2ai_answers values (p_user_id, p_course_version, question, answer, answer, 1, 1 << answer)
    on conflict (user_id, course_version, question_id) do update set
     last_answer = excluded.last_answer,
     attempts = math2ai_answers.attempts + 1,
     choices = math2ai_answers.choices | excluded.choices;
    changed := true;
   end if;
  end loop;
 end if;
 if changed then
  update public.math2ai_progress set revision = revision + 1 where user_id = p_user_id and course_version = p_course_version returning * into current_progress;
 end if;
 select coalesce(jsonb_object_agg(question_id, jsonb_build_object('first',first_answer,'last',last_answer,'attempts',attempts,'choices',choices)), '{}')
 into result from public.math2ai_answers where user_id = p_user_id and course_version = p_course_version;
 return jsonb_build_object('epoch',current_progress.epoch,'revision',current_progress.revision,'answers',result);
end;
$$;

create or replace function public.math2ai_reset(p_user_id uuid, p_course_version text, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare inserted boolean := false;
begin
 if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'Not authorized' using errcode = '42501'; end if;
 if p_course_version is null or length(p_course_version) not between 1 and 32 or p_request_id is null then raise exception 'Invalid reset'; end if;
 insert into public.math2ai_progress(user_id, course_version) values (p_user_id, p_course_version) on conflict do nothing;
 perform 1 from public.math2ai_progress where user_id = p_user_id and course_version = p_course_version for update;
 insert into public.math2ai_operations values (p_user_id, p_course_version, p_request_id) on conflict do nothing returning true into inserted;
 if inserted then
  update public.math2ai_progress set epoch = epoch + 1, revision = revision + 1 where user_id = p_user_id and course_version = p_course_version;
  delete from public.math2ai_answers where user_id = p_user_id and course_version = p_course_version;
 end if;
 return public.math2ai_sync(p_user_id, p_course_version);
end;
$$;

revoke all on function public.math2ai_sync(uuid,text,bigint,jsonb), public.math2ai_reset(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.math2ai_sync(uuid,text,bigint,jsonb), public.math2ai_reset(uuid,text,uuid) to authenticated;

-- Only revision notifications are streamed; answer contents are read through the RPC.
do $$ begin
 if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
  select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'math2ai_progress'
 ) then alter publication supabase_realtime add table public.math2ai_progress; end if;
end $$;
commit;
