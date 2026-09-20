import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bootBrowser,hub,course,flush,Server,root} from './progress-test-helpers.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const boot=async options=>{const app=bootBrowser({...options,learning:true});await flush();return app;};
const key=c=>'concept:'+c.legacyId;
const mark=app=>app.get('mark-revisit').onclick();
const value=(app,k)=>app.learning.status().values[k];
const [scalar,variable]=course.concepts;

class LearningServer extends Server {
 constructor(){super();this.learningRows=new Map();this.learningCalls=[];this.learningGate=null;this.learningMissing=false;this.loseLearningReply=false;}
 learningData(user){if(!this.learningRows.has(user))this.learningRows.set(user,{revision:0,fields:{}});return this.learningRows.get(user);}
 holdLearning(){let release;this.learningGate=new Promise(r=>release=r);return release;}
 client(user){
  const server=this,client=super.client(user),rpc=client.rpc.bind(client),channel=client.channel.bind(client);
  client.channel=()=>{const c=channel(),on=c.on;c.on=function(kind,config,fn){this.table=config.table;return on.call(this,kind,config,fn);};return c;};
  client.rpc=async(name,args)=>{
   if(name!=='math2ai_learning_sync')return rpc(name,args);
   server.learningCalls.push({user,args});
   const gate=server.learningGate;server.learningGate=null;if(gate)await gate;
   if(server.learningMissing)return {error:{code:'PGRST202'}};
   if(server.offline)return {error:{message:'offline'}};
   const row=server.learningData(user),accepted=[],conflicts=[];let changed=false;
   for(const op of args.p_changes){
    const prev=row.fields[op.key];
    if(prev?.operation_id===op.id)accepted.push(op.id);
    else if((prev?.revision||0)===op.base||op.parent&&prev?.operation_id===op.parent){
     row.fields[op.key]={value:op.value,revision:++row.revision,operation_id:op.id};accepted.push(op.id);changed=true;
    }else conflicts.push(op.id);
   }
   const data=clone({...row,accepted,conflicts});
   if(changed)for(const {user:other,channel:c}of server.listeners)if(user===other&&c.active&&c.table==='math2ai_learning')queueMicrotask(()=>c.fn({new:{course_version:course.version}}));
   if(server.loseLearningReply&&changed){server.loseLearningReply=false;return {error:{message:'lost reply'}};}
   return {data,error:null};
  };
  return client;
 }
}

const shared=hub(),app=await boot({shared});
const question=app.question().id,answers=clone(app.state().concepts[scalar.legacyId].answers);
mark(app);assert.equal(value(app,key(scalar)),'revisit');assert.equal(app.get('concept-score').hidden,true);
assert.match(app.get('concept-select').innerHTML,/Scalar · Revisit later/);
assert.equal(app.question().id,question);assert.deepEqual(app.state().concepts[scalar.legacyId].answers,answers);
app.correct();assert.equal(value(app,key(scalar)),'revisit','correctness does not remove a deliberate reminder');
mark(app);assert.equal(value(app,key(scalar)),'none','clicking the active bookmark removes it');assert.equal(app.get('mark-revisit').attributes['aria-pressed'],'false');
mark(app);app.go(1);mark(app);mark(app);app.review();app.get('review-bookmarks').onclick();
assert.equal(app.get('review-filter').value,'bookmarked');assert.equal(app.get('review-selection-count').textContent,'1 topic selected');
assert.match(app.get('review-topics').innerHTML,/Open Scalar/);assert.doesNotMatch(app.get('review-topics').innerHTML,/Open Variable/);
app.startReview();assert.ok(scalar.questions.some(q=>q.id===app.question().id));app.changeTopics();
const reloaded=await boot({shared});assert.equal(value(reloaded,key(scalar)),'revisit');assert.equal(value(reloaded,key(variable)),'none');
await reloaded.reset();assert.equal(value(reloaded,key(scalar)),'revisit','clearing answers preserves personal judgments');
console.log('PASS: markers are reversible and independent of answers; Review lists/filter/practice and guest reload work.');

const left=await boot({shared}),right=await boot({shared});
left.go(0);mark(left);await flush();assert.equal(value(right,key(scalar)),'none');
left.go(1);left.draft(2);const draftQuestion=left.question().id,draftState=clone(left.state());
mark(left);mark(left);left.emit('focus');await flush();
assert.equal(left.question().id,draftQuestion);assert.deepEqual(left.state(),draftState);
assert.match(left.get('choices').innerHTML,/value="2" checked/,'bookmark changes preserve an unanswered choice');
const last=await boot({shared});assert.equal(value(last,key(scalar)),'none');
console.log('PASS: live tabs and bookmark changes retain question drafts, decks and ordinary worked examples.');

const server=new LearningServer(),account=await boot({configured:true});account.signout();await flush();
mark(account);account.correct();const solved=account.question().id;
account.signin(server,'A');await flush();
assert.equal(value(account,key(scalar)),'revisit');assert.equal(server.learningData('A').fields[key(scalar)].value,'revisit');
assert.ok(server.data('A',course.version).answers[solved]);
const other=await boot({configured:true});other.signin(server,'A');await flush();
assert.equal(value(other,key(scalar)),'revisit');
mark(other);await flush();assert.equal(value(account,key(scalar)),'none');
account.signout();await flush();assert.equal(value(account,key(scalar)),undefined);
account.signin(server,'B');await flush();assert.equal(value(account,key(scalar)),undefined);
account.signin(server,'A');await flush();assert.equal(value(account,key(scalar)),'none');
console.log('PASS: guest choices and answers transfer together; Realtime reconciles devices; sign-out/account switching isolates personal choices.');

server.offline=true;account.go(1);mark(account);await flush();assert.match(account.learning.status().message,/Waiting to sync/);
server.offline=false;account.emit('online');await flush();assert.equal(value(other,key(variable)),'revisit');
// The old device queues a write to a different field while another device changes this one.
server.offline=true;account.go(0);mark(account);await flush();
server.offline=false;mark(other);mark(other); // revisit then explicitly remove it on the other device
await flush();assert.equal(value(other,key(scalar)),'none');
await account.learning.sync();await flush();assert.equal(value(account,key(scalar)),'none');assert.match(account.learning.status().conflict,/saved choice/);
// Removal remains a versioned value, so a stale offline write cannot resurrect it.
assert.equal(server.learningData('A').fields[key(scalar)].value,'none');
console.log('PASS: offline recovery and explicit-removal conflict protection prevent stale devices from resurrecting old markers.');

const chain=await boot({configured:true});chain.signin(server,'C');await flush();
server.offline=true;mark(chain);mark(chain);mark(chain);await flush();
server.offline=false;await chain.learning.sync();assert.equal(value(chain,key(scalar)),'revisit');
const rev=server.learningData('C').revision;server.loseLearningReply=true;mark(chain);await flush();await chain.learning.sync();
assert.equal(server.learningData('C').revision,rev+1,'a lost reply is safe to retry');assert.equal(value(chain,key(scalar)),'none');
const release=server.holdLearning();mark(chain);await flush();chain.signout();await flush();release();await flush();
assert.equal(value(chain,key(scalar)),undefined,'late replies cannot populate the signed-out view');
chain.signin(server,'C');await flush();assert.equal(value(chain,key(scalar)),'revisit');
console.log('PASS: rapid offline toggles keep their order, writes are idempotent, and late replies after sign-out remain isolated.');

const conflict=await boot({configured:true});conflict.signout();await flush();mark(conflict);mark(conflict);conflict.signin(server,'C');await flush();
assert.equal(value(conflict,key(scalar)),'revisit','existing account choice wins a guest conflict');
conflict.signout();await flush();assert.equal(value(conflict,key(scalar)),undefined,'a transferred guest choice does not leak back on sign-out');
server.learningMissing=true;const missing=await boot({configured:true});missing.signin(server,'D');await flush();mark(missing);await flush();
assert.equal(value(missing,key(scalar)),'revisit');assert.match(missing.learning.status().message,/not available yet/);
missing.correct();await flush();assert.ok(server.data('D',course.version).answers[missing.question().id],'missing optional setup cannot break quiz saving');
server.learningMissing=false;await missing.learning.sync();assert.equal(server.learningData('D').fields[key(scalar)].value,'revisit');
const blocked=await boot({readBlocked:true,writeBlocked:true});mark(blocked);assert.equal(value(blocked,key(scalar)),'revisit');assert.match(blocked.learning.status().message,/cannot be saved/);
console.log('PASS: guest conflicts preserve account choices; missing migration and blocked storage are explicit and do not break questions.');
for(const a of [app,reloaded,left,right,last,account,other,chain,conflict,missing,blocked])a.close();

// Durable guest transfers: multiple batches, reload after failure and racing accounts.
const bulk=await boot({configured:true});bulk.signout();await flush();
for(const c of course.concepts)bulk.learning.set(key(c),'revisit');
bulk.signin(server,'Bulk');await flush();
assert.equal(Object.keys(server.learningData('Bulk').fields).length,128);
bulk.signout();await flush();assert.equal(Object.keys(bulk.learning.status().values).length,0);
const queuedShared=hub(),queued=await boot({configured:true,shared:queuedShared});queued.signout();await flush();mark(queued);
server.offline=true;queued.signin(server,'Queued');await flush();queued.close();
const recovered=await boot({configured:true,shared:queuedShared});recovered.signin(server,'Queued');await flush();
assert.equal(value(recovered,key(scalar)),'revisit');server.offline=false;await recovered.learning.sync();
assert.equal(server.learningData('Queued').fields[key(scalar)].value,'revisit');
const raceShared=hub(),raceA=await boot({configured:true,shared:raceShared}),raceB=await boot({configured:true,shared:raceShared});
raceA.signout();raceB.signout();await flush();mark(raceA);
raceA.signin(server,'RaceA');raceB.signin(server,'RaceB');await flush();
assert.equal(['RaceA','RaceB'].filter(user=>server.learningData(user).fields[key(scalar)]).length,1,'one guest choice belongs to only one claiming account');
for(const a of [bulk,recovered,raceA,raceB])a.close();
console.log('PASS: all 128 guest markers upload in multiple batches; failed transfers survive reload; concurrent accounts claim guest choices only once.');

// Earlier previews offered a separate completion marker. It must not reappear or
// resurrect an older bookmark; keep server revisions so new bookmarks can sync.
const legacyId='11111111-1111-4111-8111-111111111111';
server.learningRows.set('Legacy',{revision:3,fields:{[key(scalar)]:{value:'done',revision:3,operation_id:legacyId}}});
const legacy=await boot({configured:true});legacy.signin(server,'Legacy');await flush();
assert.equal(value(legacy,key(scalar)),'none');assert.equal(legacy.get('concept-personal').hidden,true);
assert.doesNotMatch(legacy.get('concept-select').innerHTML,/Done for now/);
assert.equal(legacy.learning.set(key(scalar),'done'),false,'the removed choice cannot be created');
mark(legacy);await flush();assert.equal(server.learningData('Legacy').fields[key(scalar)].value,'revisit');
const oldPrefix='math2ai-learning-v1:https://example.supabase.co:'+course.version+':guest:op:';
const oldStorage=new Map(),oldId='22222222-2222-4222-8222-222222222222';
oldStorage.set(oldPrefix+legacyId,JSON.stringify({id:legacyId,key:key(scalar),value:'revisit',base:0,parent:null,time:1}));
oldStorage.set(oldPrefix+oldId,JSON.stringify({id:oldId,key:key(scalar),value:'done',base:0,parent:legacyId,time:2}));
const oldGuest=await boot({configured:true,shared:hub(oldStorage)});oldGuest.signout();await flush();
assert.equal(value(oldGuest,key(scalar)),'none','old completion cancels the earlier bookmark');
oldGuest.signin(server,'LegacyGuest');await flush();
assert.equal(server.learningData('LegacyGuest').fields[key(scalar)].value,'none','old queued completion is uploaded as a cleared bookmark');
legacy.close();oldGuest.close();
console.log('PASS: removed preview markers stay invisible; legacy revisions and queued cancellations remain compatible with bookmark syncing.');

const published=fs.readFileSync(new URL('../index.html',root),'utf8');
for(const id of ['example-domain','example-data','story-pager','story-data','mark-done'])assert.ok(!published.includes('id="'+id+'"'));
assert.ok(published.includes('id="mark-revisit"')&&published.includes('id="review-bookmarks"'));
// A queued domain preference from the discarded preview must not block bookmarks.
const retiredId='33333333-3333-4333-8333-333333333333';
const retiredShared=hub(new Map([[oldPrefix+retiredId,JSON.stringify({id:retiredId,key:'example-domain',value:'mineral',base:0,parent:null,time:3})]]));
const retired=await boot({configured:true,shared:retiredShared});retired.signout();await flush();
assert.equal(retired.learning.set('example-domain','mineral'),false);assert.equal(value(retired,'example-domain'),undefined);
mark(retired);retired.signin(server,'RetiredPreference');await flush();
assert.equal(server.learningData('RetiredPreference').fields[key(scalar)].value,'revisit');
assert.ok(server.learningCalls.filter(call=>call.user==='RetiredPreference').every(call=>call.args.p_changes.every(op=>op.key.startsWith('concept:'))));
retired.close();
console.log('PASS: context selector, story data/navigation and completion control are absent; obsolete preferences cannot block bookmark syncing.');
