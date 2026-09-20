-- Additive: private revisit bookmarks. Quiz tables are untouched.
begin;
create table if not exists public.math2ai_learning (
 user_id uuid not null references auth.users(id) on delete cascade,
 course_version text not null check (length(course_version) between 1 and 32),
 revision bigint not null default 0,
 fields jsonb not null default '{}'::jsonb,
 primary key(user_id,course_version)
);
alter table public.math2ai_learning enable row level security;
revoke all on public.math2ai_learning from public,anon,authenticated;
grant select on public.math2ai_learning to authenticated;
drop policy if exists own_learning_choices on public.math2ai_learning;
create policy own_learning_choices on public.math2ai_learning for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.math2ai_learning_sync(p_user_id uuid,p_course_version text,p_changes jsonb default '[]')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 saved public.math2ai_learning%rowtype;
 change jsonb;
 field text;
 value text;
 operation uuid;
 parent uuid;
 base bigint;
 previous jsonb;
 accepted jsonb := '[]';
 conflicts jsonb := '[]';
 changed boolean := false;
begin
 if auth.uid() is null or p_user_id is null or auth.uid()<>p_user_id then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_course_version is null or length(p_course_version) not between 1 and 32 then raise exception 'Invalid course'; end if;
 if p_changes is null or jsonb_typeof(p_changes)<>'array' then raise exception 'Invalid changes'; end if;
 if jsonb_array_length(p_changes)>100 then raise exception 'Batch too large'; end if;
 insert into public.math2ai_learning(user_id,course_version) values(p_user_id,p_course_version) on conflict do nothing;
 select * into saved from public.math2ai_learning where user_id=p_user_id and course_version=p_course_version for update;
 for change in select * from jsonb_array_elements(p_changes) loop
  if jsonb_typeof(change)<>'object' or change->>'id' is null or change->>'key' is null or change->>'value' is null
   or jsonb_typeof(change->'base') is distinct from 'number' or (change->>'base') !~ '^[0-9]+$' then raise exception 'Invalid choice'; end if;
  operation := (change->>'id')::uuid;
  parent := (change->>'parent')::uuid;
  field := change->>'key'; value := change->>'value'; base := (change->>'base')::bigint;
  if base>9007199254740991 then raise exception 'Invalid revision'; end if;
  if field ~ '^concept:([1-9][0-9]{0,2})$' then
   if substring(field from 9)::integer>128 or value not in ('none','revisit') then raise exception 'Invalid concept choice'; end if;
  else raise exception 'Invalid choice key'; end if;
  previous := saved.fields->field;
  if previous->>'operation_id'=operation::text then
   accepted := accepted || jsonb_build_array(operation);
  elsif coalesce((previous->>'revision')::bigint,0)=base or (parent is not null and previous->>'operation_id'=parent::text) then
   saved.revision := saved.revision+1;
   saved.fields := jsonb_set(saved.fields,array[field],jsonb_build_object('value',value,'revision',saved.revision,'operation_id',operation));
   accepted := accepted || jsonb_build_array(operation); changed := true;
  else
   conflicts := conflicts || jsonb_build_array(operation);
  end if;
 end loop;
 if changed then update public.math2ai_learning set revision=saved.revision,fields=saved.fields where user_id=p_user_id and course_version=p_course_version; end if;
 return jsonb_build_object('revision',saved.revision,'fields',saved.fields,'accepted',accepted,'conflicts',conflicts);
end;
$$;
revoke all on function public.math2ai_learning_sync(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.math2ai_learning_sync(uuid,text,jsonb) to authenticated;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
  select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='math2ai_learning'
 ) then alter publication supabase_realtime add table public.math2ai_learning; end if;
end $$;
commit;
