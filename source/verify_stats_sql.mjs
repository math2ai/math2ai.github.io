// Execute the statistics migration in PostgreSQL (test-only PGlite), beside the account migrations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(process.argv[2]?pathToFileURL(process.argv[2]).href:'@electric-sql/pglite');
const db=new PGlite(),A='00000000-0000-4000-8000-000000000001';
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
 grant usage on schema auth to anon,authenticated;insert into auth.users values('${A}');create publication supabase_realtime;`);
const sql=name=>fs.readFileSync(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
for(const name of ['202609140001_account_progress.sql','202609200001_learning_choices.sql','202609290001_expand_learning_concepts.sql'])await db.exec(sql(name));
const migration=sql('202610010001_public_stats.sql');
const as=(role,fn,user='')=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);await tx.exec('set local role '+role);return fn(tx);});
const progress=()=>as('authenticated',async tx=>(await tx.query('select public.math2ai_sync($1,$2,$3,$4) as data',[A,'2.0',0,JSON.stringify([{id:'00000000-0000-4000-8000-000000000003',question_id:'1-01',answer:2}])])).rows[0].data,A);
const before=await progress();
await as('authenticated',tx=>tx.query('select public.math2ai_learning_sync($1,$2,$3)',[A,'2.0',JSON.stringify([{id:'00000000-0000-4000-8000-000000000004',key:'concept:5',value:'revisit',base:0,parent:null}])]),A);

// Everything that existed before must be identical afterwards: structure, code, access rules and stored rows.
const mine="like 'math2ai\\_stats\\_%'";
async function existing() {
 const rows=async text=>(await db.query(text)).rows;
 return JSON.stringify({
  relations:await rows(`select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','auth') and c.relname not ${mine} order by 1,2`),
  columns:await rows(`select table_schema,table_name,column_name,data_type,is_nullable,column_default from information_schema.columns
   where table_schema in ('public','auth') and table_name not ${mine} order by 1,2,3`),
  constraints:await rows(`select conrelid::regclass::text as on_table,conname,pg_get_constraintdef(oid) as definition from pg_constraint
   where connamespace in ('public'::regnamespace,'auth'::regnamespace) and conrelid::regclass::text not like '%math2ai\\_stats\\_%' order by 1,2`),
  functions:await rows(`select n.nspname,p.proname,pg_get_functiondef(p.oid) as definition,p.proacl::text as access from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname in ('public','auth') and p.proname not ${mine} order by 1,2`),
  policies:await rows(`select schemaname,tablename,policyname,roles::text,cmd,qual,with_check from pg_policies order by 1,2,3`),
  tableAccess:await rows(`select table_schema,table_name,grantee,privilege_type from information_schema.role_table_grants
   where table_schema in ('public','auth') and table_name not ${mine} order by 1,2,3,4`),
  realtime:await rows(`select schemaname,tablename from pg_publication_tables order by 1,2`),
  roles:await rows(`select rolname,rolsuper,rolcreaterole,rolbypassrls from pg_roles where rolname in ('anon','authenticated') order by 1`),
  data:{progress:await rows('select * from public.math2ai_progress order by 1,2'),answers:await rows('select * from public.math2ai_answers order by 1,2,3'),
   operations:await rows('select * from public.math2ai_operations order by 1,2,3'),learning:await rows('select * from public.math2ai_learning order by 1,2')}
 });
}
const untouched=await existing();
assert.ok(JSON.parse(untouched).data.answers.length&&JSON.parse(untouched).data.learning.length,'the comparison includes real saved rows');
const added=async()=>(await db.query(`select c.relname,c.relkind from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname ${mine} order by 1`)).rows
 .concat((await db.query(`select proname as relname,'function' as relkind from pg_proc where pronamespace='public'::regnamespace and proname ${mine} order by 1`)).rows);
assert.deepEqual(await added(),[]);

// The script is one transaction: a failure part-way leaves nothing behind.
await assert.rejects(db.exec(migration.replace(/commit;\s*$/,'select 1/0;\ncommit;')),/division by zero/);
await db.exec('rollback');
assert.deepEqual(await added(),[],'a failed run creates nothing');
assert.equal(await existing(),untouched,'a failed run changes nothing');

// No statement in the script can remove or rewrite existing data.
const statements=migration.replace(/--.*$/gm,'');
assert.doesNotMatch(statements,/\b(drop|truncate|delete\s+from|alter\s+(?!table public\.math2ai_stats_\w+ enable row level security)|update\s+public|rename|reindex|vacuum)\b/i);
for(const name of statements.matchAll(/public\.(math2ai_\w+)/g))assert.match(name[1],/^math2ai_stats_/,'the script names only its own objects: '+name[1]);

await db.exec(migration);
assert.equal(await existing(),untouched,'the migration leaves every earlier table, function, policy, grant and row as it was');
assert.deepEqual(await added(),[
 {relname:'math2ai_stats_answers',relkind:'r'},{relname:'math2ai_stats_answers_pkey',relkind:'i'},
 {relname:'math2ai_stats_days',relkind:'r'},{relname:'math2ai_stats_days_pkey',relkind:'i'},
 {relname:'math2ai_stats_lessons',relkind:'r'},{relname:'math2ai_stats_lessons_pkey',relkind:'i'},
 {relname:'math2ai_stats_minutes',relkind:'r'},{relname:'math2ai_stats_minutes_pkey',relkind:'i'},
 {relname:'math2ai_stats_count',relkind:'function'},{relname:'math2ai_stats_read',relkind:'function'}],'it adds exactly four tables and two functions');
const call=async(tx,events=[],beat=false,lesson=null)=>(await tx.query('select public.math2ai_stats_count($1,$2,$3) as data',[JSON.stringify(events),beat,lesson])).rows[0].data;
const count=(events,beat=false,lesson=null,role='anon')=>as(role,tx=>call(tx,events,beat,lesson));
const read=(role='anon')=>as(role,async tx=>(await tx.query('select public.math2ai_stats_read() as data')).rows[0].data);
const zero={visits:0,visitors:0,lessonViews:0,answers:0},quiet={online:0,here:0};
assert.deepEqual(await read(),{totals:zero,days:[],lessons:{},answers:{},online:{total:0,lessons:{}}});
assert.deepEqual(await count([]),{...zero,...quiet},'an empty call reads the totals without writing');
for(const table of ['days','minutes'])assert.equal((await db.query('select count(*)::int as n from public.math2ai_stats_'+table)).rows[0].n,0);

// A first visit, two lesson views and three answers from an anonymous browser.
let totals=await count([{type:'visit',new:true},{type:'lesson',id:1},{type:'lesson',id:162},
 {type:'answer',question:'1-01',choice:2,first:true},{type:'answer',question:'1-01',choice:0,first:false},
 {type:'answer',question:'100-r2-10',choice:3,first:true}]);
assert.deepEqual(totals,{visits:1,visitors:1,lessonViews:2,answers:3,...quiet});
totals=await count([{type:'visit',new:false},{type:'lesson',id:1},{type:'answer',question:'1-01',choice:2,first:true}],false,null,'authenticated');
assert.deepEqual(totals,{visits:2,visitors:1,lessonViews:3,answers:4,...quiet});
const data=await read();
assert.deepEqual({...data.totals,...quiet},totals);
assert.deepEqual(data.lessons,{'1':2,'162':1});
assert.deepEqual(data.answers,{'1-01':{first:[0,0,2,0],total:[1,0,2,0]},'100-r2-10':{first:[0,0,0,1],total:[0,0,0,1]}});
assert.equal(data.days.length,1);
assert.deepEqual({...data.days[0],day:undefined},{day:undefined,visits:2,visitors:1,lessonViews:3,answers:4});
assert.equal(data.days[0].day,new Date().toISOString().slice(0,10),'days are UTC dates');
assert.deepEqual(await read('authenticated'),data);

// Earlier days stay separate, newest first, and are capped at ninety.
await db.exec(`insert into public.math2ai_stats_days(day,visits,visitors,lesson_views,answers)
 select (now() at time zone 'utc')::date-n,n,1,0,0 from generate_series(1,120) n`);
const history=await read();
assert.equal(history.days.length,90);
assert.ok(history.days.every((d,i)=>i===0||d.day<history.days[i-1].day));
assert.equal(history.totals.visits,2+120*121/2,'totals include days outside the recent window');
assert.equal(history.totals.visitors,1+120);

// Heartbeats. One transaction fixes the clock, so a minute boundary cannot split a test;
// the table owner moves stored minutes back to stand in for time passing.
const online=fn=>db.transaction(async tx=>{
 const visitor=()=>tx.exec('set local role anon'),owner=()=>tx.exec('reset role');
 const beat=async(lesson=null)=>{await visitor();const result=await call(tx,[],true,lesson);await owner();return result;};
 const look=async(lesson=null)=>{await visitor();const result=await call(tx,[],false,lesson);const page=(await tx.query('select public.math2ai_stats_read() as data')).rows[0].data.online;await owner();return {...result,page};};
 // Moving a row back n minutes also moves it n slots back, exactly where a real earlier heartbeat would sit.
 const age=n=>tx.exec(`create temp table moved as select (((slot-${n})%8+8)%8)::smallint as slot,lesson,minute-interval '${n} minutes' as minute,beats from public.math2ai_stats_minutes;
  delete from public.math2ai_stats_minutes;insert into public.math2ai_stats_minutes select * from moved;drop table moved;`);
 const rows=async()=>(await tx.query('select slot,lesson,beats,minute=date_trunc(\'minute\',now()) as current from public.math2ai_stats_minutes order by lesson,minute')).rows;
 return fn({beat,look,age,rows,tx});
});
await online(async({beat,look,age,rows})=>{
 assert.deepEqual((await beat()).online,1,'a browser on no lesson, such as the statistics page, still counts');
 await beat(5);await beat(5);const third=await beat(9);
 assert.equal(third.online,4);assert.equal(third.here,1);
 let seen=await look(5);
 assert.equal(seen.online,4);assert.equal(seen.here,2);assert.deepEqual(seen.page,{total:4,lessons:{'5':2,'9':1}});
 assert.equal((await look()).here,0);
 assert.deepEqual((await rows()).map(r=>[r.lesson,r.beats,r.current]),[[0,1,true],[5,2,true],[9,1,true]]);
 // Two minutes later those browsers still count; a new heartbeat does not add to their minute.
 await age(2);const later=await beat(5);
 assert.equal(later.online,4,'online is the busiest recent minute, not a sum across minutes');assert.equal(later.here,2);
 // After three minutes the old minute drops out and only the new heartbeat remains.
 await age(1);seen=await look(5);
 assert.equal(seen.online,1);assert.equal(seen.here,1);assert.deepEqual(seen.page,{total:1,lessons:{'5':1}});
 await age(3);seen=await look(5);
 assert.deepEqual([seen.online,seen.here,seen.page],[0,0,{total:0,lessons:{}}],'nobody stays online without a heartbeat');
});
// The ring reuses slots: a row left from eight minutes ago restarts at one instead of growing.
await online(async({beat,rows,tx})=>{
 await tx.exec(`delete from public.math2ai_stats_minutes;
  insert into public.math2ai_stats_minutes(slot,lesson,minute,beats)
  values(((extract(epoch from date_trunc('minute',now()))::bigint/60)%8)::smallint,7,date_trunc('minute',now())-interval '8 minutes',99)`);
 const result=await beat(7);
 assert.equal(result.online,1);assert.equal(result.here,1);
 assert.deepEqual((await rows()).map(r=>[r.lesson,r.beats,r.current]),[[7,1,true]]);
});
const slots=(await db.query(`select ((extract(epoch from m)::bigint/60)%8)::int as slot from generate_series(now(),now()+interval '39 minutes',interval '1 minute') m`)).rows.map(r=>r.slot);
assert.deepEqual(new Set(slots),new Set([0,1,2,3,4,5,6,7]));
assert.ok(slots.every((slot,i)=>i===0||slot===(slots[i-1]+1)%8),'consecutive minutes use consecutive slots');
await assert.rejects(db.exec("insert into public.math2ai_stats_minutes values(8,1,now(),1)"),/check constraint/);
await assert.rejects(db.exec("insert into public.math2ai_stats_minutes values(0,257,now(),1)"),/check constraint/);
assert.ok((await db.query('select count(*)::int as n from public.math2ai_stats_minutes')).rows[0].n<=8*257,'at most eight slots for each lesson');

// Malformed, oversized or out-of-range input is rejected and leaves no partial counts.
const snapshot=JSON.stringify(await read()),minutes=async()=>JSON.stringify((await db.query('select * from public.math2ai_stats_minutes order by 1,2')).rows);
const beats=await minutes();
for(const bad of [
 [{type:'visit'}],[{type:'visit',new:'true'}],[{type:'visit',new:true},{type:'visit',new:false}],
 [{type:'lesson'}],[{type:'lesson',id:0}],[{type:'lesson',id:257}],[{type:'lesson',id:'5'}],[{type:'lesson',id:1.5}],[{type:'lesson',id:-3}],
 [{type:'answer',question:'1-01',choice:4,first:true}],[{type:'answer',question:'1-01',choice:'2',first:true}],
 [{type:'answer',question:'1-01',choice:2}],[{type:'answer',question:'1-01',choice:2,first:'yes'}],
 [{type:'answer',question:'257-01',choice:0,first:true}],[{type:'answer',question:'1-11',choice:0,first:true}],
 [{type:'answer',question:'1-00',choice:0,first:true}],[{type:'answer',question:'1-r0-01',choice:0,first:true}],
 [{type:'answer',question:'1-01; drop table x',choice:0,first:true}],[{type:'answer',question:'someone@example.com',choice:0,first:true}],
 [{type:'answer',choice:0,first:true}],[{type:'email',value:'x'}],[{}],['visit'],[null],
 [{type:'lesson',id:1},{type:'lesson',id:999}],
]) await assert.rejects(count(bad,true,3),/Invalid/,JSON.stringify(bad));
await assert.rejects(count(Array(51).fill({type:'lesson',id:1})),/Batch too large/);
await assert.rejects(count({type:'visit',new:true}),/Invalid events/);
await assert.rejects(as('anon',tx=>tx.query('select public.math2ai_stats_count(null)')),/Invalid events/);
for(const lesson of [0,257,-1,100000])await assert.rejects(count([{type:'lesson',id:1}],true,lesson),/Invalid heartbeat/);
await assert.rejects(count([],null),/Invalid heartbeat/);
await assert.rejects(as('anon',tx=>tx.query("select public.math2ai_stats_count('[]',true,'5; drop table x')")),/invalid input syntax/);
assert.equal(JSON.stringify(await read()),snapshot,'a rejected call changes nothing, including its valid events');
assert.equal(await minutes(),beats,'a rejected call leaves no heartbeat either');
assert.deepEqual((await count(Array(50).fill({type:'lesson',id:7}))).lessonViews,JSON.parse(snapshot).totals.lessonViews+50);

// Visitors cannot read or edit the tables directly, and nothing identifying is stored.
for(const role of ['anon','authenticated'])for(const table of ['days','lessons','answers','minutes']) {
 await assert.rejects(as(role,tx=>tx.query('select * from public.math2ai_stats_'+table)),/permission denied/);
 await assert.rejects(as(role,tx=>tx.query('delete from public.math2ai_stats_'+table)),/permission denied/);
}
await assert.rejects(as('anon',tx=>tx.query("update public.math2ai_stats_days set visitors=1000000")),/permission denied/);
await assert.rejects(as('anon',tx=>tx.query("update public.math2ai_stats_minutes set beats=1000000")),/permission denied/);
const columns=(await db.query("select table_name,column_name,data_type from information_schema.columns where table_schema='public' and table_name like 'math2ai_stats_%' order by 1,2")).rows;
assert.deepEqual(columns.map(c=>c.table_name+'.'+c.column_name),[
 'math2ai_stats_answers.choice','math2ai_stats_answers.first_count','math2ai_stats_answers.question_id','math2ai_stats_answers.total_count',
 'math2ai_stats_days.answers','math2ai_stats_days.day','math2ai_stats_days.lesson_views','math2ai_stats_days.visitors','math2ai_stats_days.visits',
 'math2ai_stats_lessons.concept_id','math2ai_stats_lessons.views',
 'math2ai_stats_minutes.beats','math2ai_stats_minutes.lesson','math2ai_stats_minutes.minute','math2ai_stats_minutes.slot']);
assert.ok(columns.every(c=>['bigint','integer','smallint','date','text','timestamp with time zone'].includes(c.data_type)));
assert.ok(!columns.some(c=>/user|account|session|address|agent|key|token|uuid/.test(c.column_name+c.data_type)),'no column can hold an identity');
assert.equal((await db.query("select count(*)::int as n from public.math2ai_stats_minutes where minute<>date_trunc('minute',minute)")).rows[0].n,0,'heartbeat times are whole minutes');

// A signed-in caller adds the same anonymous counts; account progress is untouched.
const signedIn=await as('authenticated',tx=>call(tx,[{type:'lesson',id:2}],true,2),A);
assert.equal(signedIn.lessonViews,JSON.parse(snapshot).totals.lessonViews+51);assert.ok(signedIn.online>=1&&signedIn.here>=1);
assert.deepEqual(await progress(),before);
const final=JSON.stringify((await read()).totals),finalBeats=await minutes();await db.exec(migration);
assert.equal(JSON.stringify((await read()).totals),final,'reapplying the migration keeps every count');
assert.equal(await minutes(),finalBeats);
assert.deepEqual(await progress(),before);
assert.equal(await existing(),untouched,'after heavy use and a second run, everything that existed before is still identical');

// Removing the feature is four tables and two functions, and again touches nothing else.
await db.exec(`begin;drop function public.math2ai_stats_count(jsonb,boolean,integer);drop function public.math2ai_stats_read();
 drop table public.math2ai_stats_days, public.math2ai_stats_lessons, public.math2ai_stats_answers, public.math2ai_stats_minutes;commit;`);
assert.deepEqual(await added(),[]);assert.equal(await existing(),untouched);assert.deepEqual(await progress(),before);
const kept=JSON.parse(untouched);
console.log(`PASS: before/after comparison of ${kept.relations.length} existing tables and indexes, ${kept.columns.length} columns, ${kept.constraints.length} constraints, ${kept.functions.length} functions, ${kept.policies.length} policies, ${kept.tableAccess.length} grants and ${Object.values(kept.data).flat().length} saved rows: all identical after applying, reapplying, a failed run and removal.`);
console.log('PASS: actual PostgreSQL migration; anonymous counters only; per-minute heartbeats in a fixed ring with a three-minute window; validated calls with no partial writes; function-only access; UTC days capped at ninety; reapplication; account data untouched.');
await db.close();
