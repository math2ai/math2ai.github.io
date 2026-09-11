// Exercise the actual application handlers with a minimal DOM and controlled randomness.
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('.', import.meta.url);
const course = JSON.parse(fs.readFileSync(new URL('dist/curriculum.json', root), 'utf8'));
const js = fs.readFileSync(new URL('site.js', root), 'utf8');
const key = 'model-conversations-progress-v1';
function boot(storage = new Map(), {readBlocked=false, writeBlocked=false, hash='', seed=7, confirm=true} = {}) {
 const elements = new Map(), events = {};
 const get = id => {
  if (!elements.has(id)) elements.set(id, {id, textContent:'', innerHTML:'', hidden:false, disabled:false, value:'', handlers:{}, attributes:{}, setAttribute(name,value){this.attributes[name]=value;}, classList:{toggle(){}}, focus(){}, addEventListener(name, handler){this.handlers[name]=handler;}, querySelector(){return {focus(){}};}});
  return elements.get(id);
 };
 get('course-data').textContent = JSON.stringify(course);
 const location = {hash}, math = Object.create(Math);
 math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2**32; };
 const sandbox = {
  Math:math, document:{getElementById:get, title:''}, location,
  history:{replaceState(_a,_b,h){location.hash=h;}},
  window:{scrollTo(){}, confirm:()=>confirm, addEventListener(name,handler){events[name]=handler;}},
  localStorage:{getItem(k){if(readBlocked)throw Error('read blocked');return storage.get(k) ?? null;}, setItem(k,v){if(writeBlocked)throw Error('write blocked');storage.set(k,v);}}
 };
 vm.runInNewContext(js, sandbox, {timeout:3000});
 const app = {
  get, storage, state:()=>JSON.parse(storage.get(key)),
  current:()=>course.concepts.find(c=>c.title===get('title').textContent),
  question:()=>app.current().questions.find(q=>q.question===get('question').textContent),
  answer(index){get('choices').handlers.change({target:{name:'answer',value:String(index)}});get('quiz-form').handlers.submit({preventDefault(){}});},
  correct(){app.answer(app.question().correct);},
  wrong(){app.answer((app.question().correct+1)%4);},
  another(){get('another').onclick();}, retry(){get('retry').onclick();}, next(){get('next').onclick();},
  go(index){get('concept-select').onchange({target:{value:String(index)}});},
  hash(value){location.hash=value;events.hashchange();}
 };
 return app;
}
const score = app => Object.values(app.state().concepts[app.current().legacyId].answers).filter(a => a.solved).length;
const a = boot();
assert.equal(a.current().title, 'Scalar');
assert.equal(score(a), 0);
assert.equal(a.get('concept-score').hidden, true);
assert.match(a.get('concept-select').innerHTML, /001 · Scalar<\/option>/);
assert.equal(a.get('next').disabled, false);
a.next(); assert.equal(a.current().title, 'Variable');
a.wrong(); assert.equal(a.get('next').disabled, false); a.next(); assert.equal(a.current().title, 'Function');
a.go(0); a.wrong(); assert.match(a.get('feedback').innerHTML, /Not quite/);
const first = a.question(); a.retry(); a.correct(); a.correct();
assert.equal(a.state().concepts[a.current().legacyId].answers[first.id].attempts, 2);
assert.equal(score(a), 1);
assert.equal(a.get('concept-score').attributes['aria-label'], 'Answered correctly');
assert.equal(a.get('concept-score').textContent, '✓');
assert.equal(a.get('concept-score').hidden, false);
assert.match(a.get('concept-select').innerHTML, /001 · Scalar ✓<\/option>/);
a.another(); a.correct(); assert.equal(score(a), 2);
a.another(); a.correct(); assert.equal(score(a), 3);
assert.match(a.get('concept-select').innerHTML, /001 · Scalar ✓<\/option>/);
const restored = boot(a.storage);
assert.equal(restored.question().id, a.question().id);
assert.equal(restored.get('feedback').hidden, false);
assert.equal(score(restored), 3);
assert.deepEqual(restored.state(), a.state());
console.log('PASS: optional navigation; wrong then retry; plain completion checks beside title and numbered menu entries; existing saves retained.');

// Answers from replaced lessons must not appear as correct answers to the new material.
const revisedSave = a.state();
for (const legacyId of [90, 91, 92, 93, 94, 96, 99, 100]) {
 revisedSave.concepts[legacyId] = {active:`${legacyId}-01`, remaining:[`${legacyId}-02`], pending:false,
  answers:{[`${legacyId}-01`]:{first:0,last:0,attempts:1,solved:true}}};
}
const revised = boot(new Map([[key, JSON.stringify(revisedSave)]]));
assert.equal(score(revised), 3);
assert.match(revised.get('concept-select').innerHTML, /001 · Scalar ✓<\/option>/);
for (const legacyId of [90, 91, 92, 93, 94, 96, 99, 100]) {
 revised.go(course.concepts.findIndex(c => c.legacyId === legacyId));
 assert.equal(score(revised), 0);
 assert.equal(revised.get('concept-score').hidden, true);
 assert.match(revised.question().id, new RegExp(`^${legacyId}-r2-`));
 const seen = new Set([revised.question().id]);
 for (let n=1; n<10; n++) {revised.another(); seen.add(revised.question().id);}
 assert.equal(seen.size, 10);
}
revised.correct();
assert.equal(score(boot(revised.storage)), 1);
console.log('PASS: rewritten banks discard obsolete answers and restart complete decks; unrelated progress is retained.');

// Saved positions and bookmarks from the 100-lesson edition keep their meaning.
for (const [position, identity, title] of [[32,33,'Artificial neuron'],[63,62,'Fine-tuning'],[96,96,'Ore grade estimation']]) {
 const concept = course.concepts.find(c => c.legacyId === identity), q = concept.questions[0];
 const oldPosition = {version:course.version,current:position,concepts:{[identity]:{
  active:q.id,remaining:concept.questions.slice(1).map(q => q.id),pending:false,
  answers:{[q.id]:{first:q.correct,last:q.correct,attempts:1,solved:true}}
 }}};
 const migrated = boot(new Map([[key,JSON.stringify(oldPosition)]]));
 assert.equal(migrated.current().title,title);
 assert.equal(migrated.state().currentConceptId,identity);
 assert.equal(score(migrated),1);
 assert.equal(boot(migrated.storage).current().title,title);
 assert.equal(boot(new Map(),{hash:`#concept-${position+1}`}).current().title,title);
 assert.equal(boot(new Map(),{hash:`#lesson-${identity}`}).current().title,title);
}
const stablePosition = boot(new Map([[key,JSON.stringify({version:course.version,current:0,currentConceptId:128,concepts:{}})]]));
assert.equal(stablePosition.current().title,'Mineral processing and recovery');
assert.equal(stablePosition.current().id,123);
console.log('PASS: old bookmarks and saved positions follow their concepts; stable IDs override obsolete display positions.');

for (const seed of [1, 19, 2048, 123456]) {
 let r = boot(new Map(), {seed});
 let last = null;
 for (let cycle=0; cycle<3; cycle++) {
  const ids = new Set();
  for(let i=0;i<10;i++) {
   const id = r.question().id;
   assert.notEqual(id, last); assert.ok(!ids.has(id)); ids.add(id);
   if(cycle===0) r.correct(); else r.wrong();
   last=id;
   if(i===4) r=boot(r.storage, {seed:99});
   r.another();
  }
  assert.equal(ids.size, 10);
 }
 assert.equal(score(r), 10);
 const answers=Object.values(r.state().concepts[r.current().legacyId].answers);
 assert.equal(answers.reduce((n,a)=>n+a.attempts,0),30);
 r=boot(r.storage); assert.equal(r.get('feedback').hidden,true);
 assert.equal(r.get('check').disabled,true);
}
const starts = new Set(Array.from({length:20},(_,seed)=>boot(new Map(),{seed:seed*1009}).question().id));
assert.ok(starts.size > 1);
console.log('PASS: randomized starts and unique cycles across reloads; repeated answers do not inflate the count.');

const all = boot();
for(let i=0;i<course.concepts.length;i++) {
 assert.equal(all.current().id, i+1);
 const seen=new Set();
 for(let j=0;j<10;j++) {seen.add(all.question().id);all.correct();if(j<9)all.another();}
 assert.equal(seen.size,10); assert.equal(score(all),10); all.next();
}
assert.equal(all.current().id,1);
for (const c of course.concepts) {
 const answers=Object.values(all.state().concepts[c.legacyId].answers);
 assert.equal(answers.length,10);assert.ok(answers.every(a=>a.solved));
}
assert.equal((all.get('concept-select').innerHTML.match(/✓<\/option>/g)||[]).length,course.concepts.length);
const reloadAll=boot(all.storage);assert.equal(score(reloadAll),10);
reloadAll.get('reset').onclick();assert.equal(score(reloadAll),0);assert.equal(reloadAll.current().id,1);
console.log('PASS: all 1,280 questions, full menu indicators, return to start, reload, and reset.');

const skipped=boot();skipped.go(course.concepts.length-1);assert.equal(skipped.get('next').textContent,'Back to start');skipped.next();assert.equal(skipped.current().id,1);
const deep=boot(new Map(),{hash:'#lesson-50'});assert.equal(deep.current().legacyId,50);
deep.hash('#lesson-77');assert.equal(deep.current().legacyId,77);deep.hash('#lesson-1000');assert.equal(deep.current().legacyId,77);
deep.go(NaN);assert.equal(deep.current().legacyId,77);
for(const options of [{readBlocked:true,writeBlocked:true},{writeBlocked:true}]) {
 const offline=boot(new Map(),options);assert.match(offline.get('storage-note').textContent,/cannot save/);
 offline.correct();offline.another();offline.correct();offline.another();offline.correct();assert.equal(offline.get('concept-score').hidden,false);offline.next();assert.equal(offline.current().id,2);
}
for(const bad of ['not json','null','[]',JSON.stringify({version:course.version,current:999,concepts:{'1':{active:'fake',remaining:['fake'],answers:{'1-01':{first:99,last:0,attempts:-1,solved:true}}}}})]) {
 const r=boot(new Map([[key,bad]]));assert.equal(r.current().id,1);assert.equal(score(r),0);r.correct();assert.equal(score(r),1);
}
const old=boot(new Map([[key,JSON.stringify({version:'1.2',current:20,answers:{1:{first:0,last:0,attempts:1}}})]]));
assert.equal(score(old),0);assert.match(old.get('storage-note').textContent,/updated/);
const resetStore=new Map([['unrelated','keep']]);const keep=boot(resetStore,{confirm:false});keep.correct();const before=resetStore.get(key);keep.get('reset').onclick();assert.equal(resetStore.get(key),before);
const clear=boot(resetStore);clear.get('reset').onclick();assert.equal(resetStore.get('unrelated'),'keep');assert.equal(score(clear),0);
const pending=boot();pending.wrong();pending.retry();const pendingReload=boot(pending.storage);assert.equal(pendingReload.get('feedback').hidden,true);pendingReload.correct();assert.equal(score(pendingReload),1);
console.log('PASS: deep links; blocked storage; corrupt/outdated saves; reset confirmation/scope; pending retry reload.');
