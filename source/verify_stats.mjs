// Anonymous usage statistics: what the page sends, when it stays silent, and what the public page computes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {bootBrowser,hub,course,flush,Server} from './progress-test-helpers.mjs';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Simulated SDK: records every request the statistics client makes and keeps running totals.
// It offers no live channel, so any attempt to open one would fail the test.
function sdk({fail=false,beats={}}={}) {
 const totals={visits:0,visitors:0,lessonViews:0,answers:0};
 const fake={clients:[],calls:[],beats,
  createClient(url,key,options) {
   // Copy values out of the simulated page so they compare as ordinary objects here.
   fake.clients.push(JSON.parse(JSON.stringify({url,key,options})));
   return {
    rpc(name,args) {
     args=JSON.parse(JSON.stringify(args));fake.calls.push({name,args});
     if(fail)return Promise.resolve({data:null,error:{code:'PGRST202'}});
     for(const e of args.p_events) {
      if(e.type==='visit'){totals.visits++;if(e.new)totals.visitors++;}
      if(e.type==='lesson')totals.lessonViews++;
      if(e.type==='answer')totals.answers++;
     }
     if(args.p_beat)beats[args.p_lesson||0]=(beats[args.p_lesson||0]||0)+1;
     const online=Object.values(beats).reduce((a,b)=>a+b,0);
     return Promise.resolve({data:{...totals,online,here:beats[args.p_lesson]||0},error:null});
    }
   };
  }};
 return fake;
}
const published={hostname:'math2ai.github.io',protocol:'https:'},T=1800000000000;
const boot=async(options={})=>{const app=bootBrowser({configured:true,now:T,...options});app.signout();await flush();return app;};
const request=async(app,fake)=>{const from=fake.calls.length;app.stats.flush();await flush();return fake.calls.slice(from);};
const sent=async(app,fake)=>(await request(app,fake)).flatMap(c=>c.args.p_events);
const A='00000000-0000-4000-8000-000000000001';

// A first visit on the published site: one visit, one lesson view, one heartbeat, then answers with first-try flags.
let fake=sdk(),shared=hub(),app=await boot({shared,stats:{sdk:fake,...published}});
assert.equal(app.get('stats-note').hidden,true,'nothing is shown before the server answers');
let calls=await request(app,fake);
assert.deepEqual(calls,[{name:'math2ai_stats_count',args:{p_events:[{type:'visit',new:true},{type:'lesson',id:1}],p_beat:true,p_lesson:1}}]);
assert.deepEqual(fake.clients[0].options.auth,{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'math2ai-stats'});
assert.equal(app.get('stats-note').hidden,false);
assert.equal(app.get('stats-summary').textContent,'1 online · 1 visitor so far.');
assert.equal(app.get('stats-privacy').textContent,'Visits and answers are counted anonymously.');
const q=app.question(),wrong=(q.correct+1)%4;
app.wrong();app.retry();app.correct();
calls=await request(app,fake);
assert.deepEqual(calls.map(c=>c.args),[{p_events:[{type:'answer',question:q.id,choice:wrong,first:true},{type:'answer',question:q.id,choice:q.correct,first:false}],p_beat:false,p_lesson:1}],
 'a second request within the minute carries no heartbeat');
app.go(4);app.go(0);app.go(4);
calls=await request(app,fake);
assert.deepEqual(calls.map(c=>c.args),[{p_events:[{type:'lesson',id:course.concepts[4].legacyId}],p_beat:false,p_lesson:course.concepts[4].legacyId}],'a lesson is counted once per page load');
app.go(0);
assert.deepEqual((await request(app,fake)).map(c=>c.args),[{p_events:[],p_beat:false,p_lesson:1}],'returning to a counted lesson only asks who else is on it');
app.go(4);await request(app,fake);
app.review();app.startReview();const reviewed=app.question();app.correct();
assert.deepEqual(await sent(app,fake),[{type:'answer',question:reviewed.id,choice:reviewed.correct,first:reviewed.id!==q.id}]);
assert.deepEqual(await request(app,fake),[],'nothing is sent when nothing happened');
app.close();

// Another tab or a reload within the minute is the same person: a visit, but no second heartbeat.
const saved=course.concepts[4].legacyId;
fake=sdk();app=await boot({shared,now:T+30000,stats:{sdk:fake,...published}});
assert.deepEqual((await request(app,fake)).map(c=>c.args),[{p_events:[{type:'visit',new:false},{type:'lesson',id:saved}],p_beat:false,p_lesson:saved}],
 'the returning browser is not a new visitor, and its saved lesson is the one counted');
app.close();
fake=sdk();app=await boot({shared,now:T+61000,stats:{sdk:fake,...published}});
assert.equal((await request(app,fake))[0].args.p_beat,true,'a minute later the browser is heard from again');
assert.deepEqual((await request(app,fake)),[]);app.close();
// A clock that jumps backwards must not silence the heartbeat for good.
fake=sdk();app=await boot({shared,now:T-500000,stats:{sdk:fake,...published}});
assert.equal((await request(app,fake))[0].args.p_beat,true);app.close();
// A tab in the background still reports what happened, but is not online.
fake=sdk();app=await boot({stats:{sdk:fake,...published,visibility:'hidden'}});
assert.deepEqual((await request(app,fake)).map(c=>c.args),[{p_events:[{type:'visit',new:true},{type:'lesson',id:1}],p_beat:false,p_lesson:1}]);
assert.deepEqual(await request(app,fake),[],'a hidden tab does not keep asking');app.close();

// Signing in changes nothing about what is sent: no account, email or token reaches the statistics.
fake=sdk();app=await boot({stats:{sdk:fake,...published}});const server=new Server();
app.signin(server,A);await flush();app.correct();app.go(2);app.wrong();await sent(app,fake);
assert.doesNotMatch(JSON.stringify(fake.calls),/00000000-0000|test-token|user|email|account|key|uuid/i);
assert.doesNotMatch(JSON.stringify(fake.clients),/00000000-0000|test-token/);
for(const call of fake.calls) {
 assert.deepEqual(Object.keys(call.args),['p_events','p_beat','p_lesson']);
 for(const event of call.args.p_events)assert.deepEqual(Object.keys(event).sort(),{visit:['new','type'],lesson:['id','type'],answer:['choice','first','question','type']}[event.type]);
}
assert.equal(fake.clients.length,1,'statistics use their own client, never the account client');
assert.ok(server.calls.every(c=>!c.name.includes('stats')));
app.close();
console.log('PASS: visit, lesson and answer events carry only lesson and question identity; one heartbeat a minute per browser, none from hidden tabs; accounts never reach the statistics.');

// The footer reports who is online and who shares this lesson, from the server's answer.
fake=sdk({beats:{0:1,1:1,5:1}});app=await boot({stats:{sdk:fake,...published}});await request(app,fake);
assert.equal(app.get('stats-summary').textContent,'4 online (2 on this lesson) · 1 visitor so far.');
app.go(1);assert.equal(app.get('stats-summary').textContent,'4 online · 1 visitor so far.','a stale lesson count is not shown for the new lesson');
await request(app,fake);assert.equal(app.get('stats-summary').textContent,'4 online · 1 visitor so far.');
app.close();

// Batches are capped; a long session is sent in several requests.
fake=sdk();app=await boot({stats:{sdk:fake,...published}});await sent(app,fake);
for(let i=0;i<120;i++)app.stats.answer('1-01',i%4,i===0);
const sizes=[];for(let i=0;i<4;i++){const batch=await sent(app,fake);if(batch.length)sizes.push(batch.length);}
assert.deepEqual(sizes,[50,50,20]);app.close();
console.log('PASS: footer shows online and same-lesson counts without stale numbers; batches stay within the server limit.');

// Silence: local copies, unconfigured builds, opted-out browsers and a database without the migration.
for(const place of [{hostname:'localhost',protocol:'http:'},{hostname:'127.0.0.1',protocol:'http:'},{hostname:'math2ai.github.io',protocol:'http:'},{hostname:'example.org',protocol:'https:'}]) {
 fake=sdk();app=await boot({stats:{sdk:fake,...place}});app.correct();app.go(3);app.stats.flush();await flush();
 assert.equal(fake.clients.length,0,JSON.stringify(place));assert.equal(app.get('stats-summary').textContent,'');
 app.close();
}
fake=sdk();app=bootBrowser({configured:false,stats:{sdk:fake,...published}});await flush();app.correct();app.stats.flush();await flush();
assert.equal(fake.clients.length,0,'a build without account settings contacts nothing');app.close();
for(const navigator of [{doNotTrack:'1'},{globalPrivacyControl:true}]) {
 fake=sdk({beats:{9:2}});app=await boot({stats:{sdk:fake,...published,navigator}});app.correct();app.go(2);
 assert.deepEqual((await request(app,fake)).map(c=>c.args),[{p_events:[],p_beat:false,p_lesson:course.concepts[2].legacyId}],'an opted-out browser only reads the totals');
 assert.match(app.get('stats-privacy').textContent,/not counted/);assert.equal(app.get('stats-note').hidden,false);
 assert.equal(app.get('stats-summary').textContent,'2 online · 0 visitors so far.');
 app.close();
}
fake=sdk({fail:true});app=await boot({stats:{sdk:fake,...published}});await request(app,fake);
assert.equal(app.get('stats-note').hidden,true,'a database without the migration shows nothing');
const failures=fake.calls.length;await wait(1800);
assert.equal(fake.calls.length,failures,'a failed request is not retried in a loop');
app.correct();assert.equal(app.get('concept-score').hidden,false,'the course keeps working when statistics fail');
const broken={createClient(){throw Error('blocked');}};
app.close();app=await boot({stats:{sdk:broken,...published}});app.correct();assert.equal(app.get('concept-score').hidden,false);app.close();
console.log('PASS: local copies, unconfigured builds and opted-out browsers are not counted; failures stay invisible, harmless and unrepeated.');

// The public page: correctness comes from the course, not the server; thin data is not ranked.
const pageContext=vm.createContext({});vm.runInContext(read('stats-page.js'),pageContext);
const summarize=pageContext.math2aiStatsSummarize;
const first=course.concepts[0],hard=first.questions[0],easy=first.questions[1],thin=first.questions[2],other=course.concepts[1].questions[0];
const spread=(question,right,wrongs)=>{const counts=[0,0,0,0];counts[question.correct]=right;wrongs.forEach((n,i)=>{counts[(question.correct+1+i)%4]=n;});return counts;};
const data={totals:{visitors:'12',visits:30,lessonViews:44,answers:61},
 days:[{day:'2026-10-02',visitors:2,visits:5,lessonViews:9,answers:11},{day:'2026-10-01',visitors:10,visits:25,lessonViews:35,answers:50},{day:'<script>',visits:1}],
 lessons:{[first.legacyId]:20,[course.concepts[1].legacyId]:7,'999':5},
 online:{total:5,lessons:{[first.legacyId]:3,'999':4}},
 answers:{[hard.id]:{first:spread(hard,2,[6,1,1]),total:spread(hard,7,[6,2,1])},
  [easy.id]:{first:spread(easy,9,[1]),total:spread(easy,9,[1])},
  [thin.id]:{first:spread(thin,0,[4]),total:spread(thin,0,[4])},
  [other.id]:{first:spread(other,3,[2]),total:spread(other,3,[3])},'999-01':{first:[9,9,9,9],total:[9,9,9,9]},'bad':null}};
const summary=JSON.parse(JSON.stringify(summarize(course,data)));
assert.deepEqual(summary.totals,{visitors:12,visits:30,lessonViews:44,answers:61});assert.equal(summary.online,5);
assert.equal(summary.lessons.length,course.concepts.length);
assert.deepEqual(summary.lessons[0],{position:1,legacyId:first.legacyId,title:first.title,chapter:first.chapter,views:20,online:3,firstTries:24,firstCorrect:11,attempts:30,rate:11/24});
assert.equal(summary.lessons[2].rate,null);assert.equal(summary.lessons[2].views,0);assert.equal(summary.lessons[2].online,0);
assert.deepEqual(summary.hardest.map(x=>x.id),[hard.id,other.id,easy.id],'ranked by first-try share; fewer than five first tries is not ranked');
assert.equal(summary.hardest[0].rate,.2);
assert.equal(summary.hardest[0].commonWrong,hard.options[(hard.correct+1)%4]);assert.equal(summary.hardest[0].commonWrongCount,6);
assert.ok(!summary.questions.some(x=>x.id==='999-01'),'counts for unknown questions are ignored');
assert.deepEqual(summary.days.map(d=>d.day),['2026-10-02','2026-10-01']);
const empty=JSON.parse(JSON.stringify(summarize(course,null)));
assert.deepEqual(empty.totals,{visitors:0,visits:0,lessonViews:0,answers:0});assert.equal(empty.online,0);assert.deepEqual(empty.hardest,[]);
console.log('PASS: public page totals, online counts, per-lesson first-try shares, most-missed ranking with a minimum sample, and malformed data ignored.');

// The database accepts every real lesson and question ID, and the pages ship what they need.
const migration=read('../supabase/migrations/202610010001_public_stats.sql');
const questionPattern=new RegExp(migration.match(/question !~ '([^']+)'/)[1]);
for(const c of course.concepts) {
 assert.ok(c.legacyId>=1&&c.legacyId<=256,c.title);
 for(const question of c.questions)assert.ok(questionPattern.test(question.id)&&Number(question.id.split('-')[0])<=256,question.id);
}
const unix=text=>text.replaceAll('\r\n','\n');
const html=unix(read('dist/index.html')),page=read('../stats.html'),pageScript=read('stats-page.js'),recorder=unix(read('stats.js'));
assert.ok(html.includes(recorder));
assert.match(html,/<p id="stats-note" hidden>.*<a href="stats\.html">Statistics<\/a><\/p>/);
assert.ok(html.indexOf('math2aiStats = {')<html.lastIndexOf('math2aiStats?.lesson'),'the recorder loads before the course script');
for(const id of pageScript.matchAll(/el\('([^']+)'\)/g))assert.ok(page.includes(`id="${id[1]}"`),id[1]);
for(const src of page.matchAll(/<script src="([^"]+)"/g))assert.ok(fs.existsSync(new URL('../'+src[1],import.meta.url)),src[1]);
for(const path of pageScript.matchAll(/'(source\/[^']+\.json)'/g))assert.ok(fs.existsSync(new URL('../'+path[1],import.meta.url)),path[1]);
// Every function the pages call is defined by the migration with the same argument names.
for(const name of new Set([...(recorder+pageScript).matchAll(/rpc\('(\w+)'/g)].map(m=>m[1])))assert.ok(migration.includes(`function public.${name}(`),name);
for(const argument of new Set([...(recorder+pageScript).matchAll(/\b(p_\w+):/g)].map(m=>m[1])))assert.ok(migration.includes(argument),argument);
// No live connection, no stored identifier, no HTML built from data, nothing from the account client.
assert.doesNotMatch(pageScript+recorder,/\.channel\(|presence|realtime|randomUUID|innerHTML|document\.cookie|getSession|math2aiProgress/i);
console.log('PASS: every lesson and question ID is accepted by the migration; pages and database agree on function names; the recorder is embedded before the course script; no live connection or identifier is used.');
