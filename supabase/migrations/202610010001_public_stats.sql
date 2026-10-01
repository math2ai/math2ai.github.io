-- Additive: anonymous, public usage statistics. Account tables are untouched.
-- Only counters are stored: no user ID, IP address, session ID, key or free text.
-- Anyone can add to these counters, so treat them as indicative, not audited.
begin;
create table if not exists public.math2ai_stats_days (
 day date primary key,
 visits bigint not null default 0,
 visitors bigint not null default 0,
 lesson_views bigint not null default 0,
 answers bigint not null default 0
);
create table if not exists public.math2ai_stats_lessons (
 concept_id smallint primary key check (concept_id between 1 and 256),
 views bigint not null default 0
);
create table if not exists public.math2ai_stats_answers (
 question_id text not null,
 choice smallint not null check (choice between 0 and 3),
 first_count bigint not null default 0,
 total_count bigint not null default 0,
 primary key (question_id, choice)
);
-- Who is online: heartbeats counted per minute and lesson (0 = no lesson) in a
-- ring of eight reused slots. The table never grows and needs no clean-up.
create table if not exists public.math2ai_stats_minutes (
 slot smallint not null check (slot between 0 and 7),
 lesson smallint not null check (lesson between 0 and 256),
 minute timestamptz not null,
 beats integer not null default 0,
 primary key (slot, lesson)
);
alter table public.math2ai_stats_days enable row level security;
alter table public.math2ai_stats_lessons enable row level security;
alter table public.math2ai_stats_answers enable row level security;
alter table public.math2ai_stats_minutes enable row level security;
-- No direct table access: reads and writes go through the two functions below.
revoke all on public.math2ai_stats_days, public.math2ai_stats_lessons, public.math2ai_stats_answers,
 public.math2ai_stats_minutes from public, anon, authenticated;

-- Events: {"type":"visit","new":bool}, {"type":"lesson","id":1..256},
-- {"type":"answer","question":"<id>","choice":0..3,"first":bool}.
-- Question IDs follow the course format: concept 1-256, optional revision
-- r1-r99, question 01-10. Widen the pattern if a bank ever exceeds ten questions.
-- p_beat is a browser's once-a-minute heartbeat; p_lesson is the lesson it shows.
create or replace function public.math2ai_stats_count(p_events jsonb default '[]',p_beat boolean default false,p_lesson integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 item jsonb;
 kind text;
 question text;
 visits_added bigint := 0;
 visitors_added bigint := 0;
 views_added bigint := 0;
 answers_added bigint := 0;
 this_minute timestamptz := date_trunc('minute',now());
begin
 if p_events is null or jsonb_typeof(p_events) is distinct from 'array' then raise exception 'Invalid events'; end if;
 if jsonb_array_length(p_events)>50 then raise exception 'Batch too large'; end if;
 if p_beat is null or (p_lesson is not null and p_lesson not between 1 and 256) then raise exception 'Invalid heartbeat'; end if;
 for item in select * from jsonb_array_elements(p_events) loop
  if jsonb_typeof(item) is distinct from 'object' then raise exception 'Invalid event'; end if;
  kind := item->>'type';
  if kind='visit' then
   -- One page load is one visit; a batch cannot claim several.
   if visits_added>0 or jsonb_typeof(item->'new') is distinct from 'boolean' then raise exception 'Invalid visit'; end if;
   visits_added := 1;
   if (item->>'new')::boolean then visitors_added := 1; end if;
  elsif kind='lesson' then
   if jsonb_typeof(item->'id') is distinct from 'number' or (item->>'id') !~ '^[1-9][0-9]{0,2}$'
    or (item->>'id')::integer>256 then raise exception 'Invalid lesson'; end if;
   insert into public.math2ai_stats_lessons as l(concept_id,views) values((item->>'id')::smallint,1)
    on conflict(concept_id) do update set views=l.views+1;
   views_added := views_added+1;
  elsif kind='answer' then
   question := item->>'question';
   if question is null or question !~ '^[1-9][0-9]{0,2}(-r[1-9][0-9]?)?-(0[1-9]|10)$'
    or split_part(question,'-',1)::integer>256
    or jsonb_typeof(item->'choice') is distinct from 'number' or (item->>'choice') !~ '^[0-3]$'
    or jsonb_typeof(item->'first') is distinct from 'boolean' then raise exception 'Invalid answer'; end if;
   insert into public.math2ai_stats_answers as a(question_id,choice,first_count,total_count)
    values(question,(item->>'choice')::smallint,case when (item->>'first')::boolean then 1 else 0 end,1)
    on conflict(question_id,choice) do update
    set first_count=a.first_count+excluded.first_count,total_count=a.total_count+1;
   answers_added := answers_added+1;
  else raise exception 'Invalid event';
  end if;
 end loop;
 if visits_added+views_added+answers_added>0 then
  insert into public.math2ai_stats_days as d(day,visits,visitors,lesson_views,answers)
   values((now() at time zone 'utc')::date,visits_added,visitors_added,views_added,answers_added)
   on conflict(day) do update set visits=d.visits+excluded.visits,visitors=d.visitors+excluded.visitors,
    lesson_views=d.lesson_views+excluded.lesson_views,answers=d.answers+excluded.answers;
 end if;
 if p_beat then
  -- A slot left over from an earlier minute starts again at one.
  insert into public.math2ai_stats_minutes as m(slot,lesson,minute,beats)
   values(((extract(epoch from this_minute)::bigint/60)%8)::smallint,coalesce(p_lesson,0),this_minute,1)
   on conflict(slot,lesson) do update set beats=case when m.minute=excluded.minute then m.beats+1 else 1 end,minute=excluded.minute;
 end if;
 -- The caller gets the running totals back, so one request both counts and displays.
 -- Online is the busiest of the current and two previous minutes, which tolerates a late heartbeat.
 return (select jsonb_build_object('visits',coalesce(sum(visits),0),'visitors',coalesce(sum(visitors),0),
  'lessonViews',coalesce(sum(lesson_views),0),'answers',coalesce(sum(answers),0)) from public.math2ai_stats_days)
  || jsonb_build_object(
   'online',(select coalesce(max(total),0) from (select sum(beats) as total from public.math2ai_stats_minutes
    where minute>this_minute-interval '3 minutes' group by minute) recent),
   'here',(select coalesce(max(beats),0) from public.math2ai_stats_minutes
    where lesson=p_lesson and minute>this_minute-interval '3 minutes'));
end;
$$;

create or replace function public.math2ai_stats_read()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'totals',(select jsonb_build_object('visits',coalesce(sum(visits),0),'visitors',coalesce(sum(visitors),0),
   'lessonViews',coalesce(sum(lesson_views),0),'answers',coalesce(sum(answers),0)) from public.math2ai_stats_days),
  'days',coalesce((select jsonb_agg(jsonb_build_object('day',day,'visits',visits,'visitors',visitors,
   'lessonViews',lesson_views,'answers',answers) order by day desc)
   from (select * from public.math2ai_stats_days order by day desc limit 90) recent),'[]'::jsonb),
  'lessons',coalesce((select jsonb_object_agg(concept_id::text,views) from public.math2ai_stats_lessons),'{}'::jsonb),
  'answers',coalesce((select jsonb_object_agg(question_id,counts) from (
   select question_id,jsonb_build_object(
    'first',jsonb_build_array(coalesce(sum(first_count) filter (where choice=0),0),coalesce(sum(first_count) filter (where choice=1),0),
     coalesce(sum(first_count) filter (where choice=2),0),coalesce(sum(first_count) filter (where choice=3),0)),
    'total',jsonb_build_array(coalesce(sum(total_count) filter (where choice=0),0),coalesce(sum(total_count) filter (where choice=1),0),
     coalesce(sum(total_count) filter (where choice=2),0),coalesce(sum(total_count) filter (where choice=3),0))) as counts
   from public.math2ai_stats_answers group by question_id) grouped),'{}'::jsonb),
  'online',jsonb_build_object(
   'total',(select coalesce(max(total),0) from (select sum(beats) as total from public.math2ai_stats_minutes
    where minute>date_trunc('minute',now())-interval '3 minutes' group by minute) recent),
   'lessons',coalesce((select jsonb_object_agg(lesson::text,peak) from (select lesson,max(beats) as peak from public.math2ai_stats_minutes
    where lesson>0 and minute>date_trunc('minute',now())-interval '3 minutes' group by lesson) busy),'{}'::jsonb)));
$$;

revoke all on function public.math2ai_stats_count(jsonb,boolean,integer) from public, anon, authenticated;
revoke all on function public.math2ai_stats_read() from public, anon, authenticated;
grant execute on function public.math2ai_stats_count(jsonb,boolean,integer) to anon, authenticated;
grant execute on function public.math2ai_stats_read() to anon, authenticated;
commit;
