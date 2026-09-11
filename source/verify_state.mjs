// Execute the actual app event handlers against a minimal in-memory DOM substitute.
// This checks state transitions without a browser or any external package.
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('.',import.meta.url),course=JSON.parse(fs.readFileSync(new URL('dist/curriculum.json',root),'utf8'));
const js=fs.readFileSync(new URL('site.js',root),'utf8');
function boot(storage=new Map(),blocked=false,hash=''){
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',hidden:false,disabled:false,value:'',handlers:{},classList:{add(){},remove(){}},focus(){},addEventListener(n,f){this.handlers[n]=f;},querySelector(){return {focus(){}}}});return elements.get(id);};
 get('course-data').textContent=JSON.stringify(course);
 const location={hash},window={scrollTo(){},confirm:()=>true,addEventListener(){}};
 const sandbox={document:{getElementById:get,title:''},window,location,history:{replaceState(_a,_b,h){location.hash=h;}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return storage.get(k)||null;},setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v);}}};
 vm.runInNewContext(js,sandbox,{timeout:3000});
 return {get,storage,answer(i){get('choices').handlers.change({target:{name:'answer',value:String(i)}});get('quiz-form').handlers.submit({preventDefault(){}});},next(){get('next').onclick();},go(i){get('concept-select').onchange({target:{value:String(i)}});}};
}
const a=boot();assert.equal(a.get('title').textContent,'Scalar');assert.equal(a.get('next').disabled,true);a.next();assert.equal(a.get('title').textContent,'Scalar');
for(let i=0;i<100;i++){
 const c=course.concepts[i];assert.equal(a.get('title').textContent,c.title);
 if(i===6){a.answer((c.correct+1)%4);assert.match(a.get('feedback').innerHTML,/correct answer/);a.get('retry').onclick();assert.equal(a.get('next').disabled,true);}
 a.answer(c.correct);assert.equal(a.get('next').disabled,false);a.next();
}
assert.equal(a.get('progress').value,100);assert.match(a.get('completion').innerHTML,/100 correct on the latest attempt/);assert.match(a.get('completion').innerHTML,/99 correct on the first attempt/);
const saved=JSON.parse(a.storage.get('model-conversations-progress-v1'));assert.equal(saved.answers['7'].attempts,2);
const reload=boot(a.storage);assert.equal(reload.get('title').textContent,course.concepts[99].title);assert.equal(reload.get('next').disabled,false);
reload.go(0);assert.equal(reload.get('title').textContent,'Scalar');assert.equal(reload.get('next').disabled,false);
const offline=boot(new Map(),true);assert.match(offline.get('storage-note').textContent,/cannot save/);offline.answer(course.concepts[0].correct);offline.next();assert.equal(offline.get('title').textContent,'Variable');
const corrupt=new Map([['model-conversations-progress-v1','{"version":"1.0","current":999,"answers":{"1":{"first":99,"last":0,"attempts":1}}}']]);const repaired=boot(corrupt);assert.equal(repaired.get('progress').value,0);
const hash=boot(new Map(),false,'#concept-50');assert.equal(hash.get('title').textContent,course.concepts[49].title);
console.log('PASS: full 100-concept answer/next flow, incorrect answer and retry, first/latest scoring, completion, reload, direct navigation, blocked storage, corrupt state, deep link.');

// Reordering must retain the same concepts, selections and attempt history.
const legacyAnswers=Object.fromEntries(course.concepts.map(c=>[c.legacyId,{first:c.legacyId===36?(c.correct+1)%4:c.correct,last:c.correct,attempts:c.legacyId===36?2:1}]));
const prior=new Map([['model-conversations-progress-v1',JSON.stringify({version:'1.0',current:35,answers:legacyAnswers})]]);
const migrated=boot(prior,false,'#concept-36');
assert.equal(migrated.get('title').textContent,'Deep neural network');
assert.equal(migrated.get('progress').value,98);
const upgraded=JSON.parse(prior.get('model-conversations-progress-v1'));
assert.equal(upgraded.version,course.version);
for(const c of course.concepts){if(course.revisedQuestions.includes(c.id))assert.equal(upgraded.answers[c.id],undefined);else assert.deepEqual(upgraded.answers[c.id],legacyAnswers[c.legacyId]);}
const migratedReload=boot(prior);assert.equal(migratedReload.get('title').textContent,'Deep neural network');
migratedReload.get('reset').onclick();assert.equal(migratedReload.get('progress').value,0);
console.log('PASS: legacy reordering preserves 98 unchanged questions and drops only the two rewritten questions.');

const v11Answers=Object.fromEntries(course.concepts.map(c=>[c.id,{first:c.correct,last:c.correct,attempts:1}]));
const v11=new Map([['model-conversations-progress-v1',JSON.stringify({version:'1.1',current:6,answers:v11Answers})]]);
const v12=boot(v11);assert.equal(v12.get('title').textContent,'Tensor');assert.equal(v12.get('progress').value,98);assert.equal(v12.get('next').disabled,true);
v12.answer(course.concepts[6].correct);assert.equal(v12.get('progress').value,99);
v12.go(76);assert.equal(v12.get('next').disabled,true);v12.answer(course.concepts[76].correct);assert.equal(v12.get('progress').value,100);
assert.equal(boot(v11).get('progress').value,100);
console.log('PASS: version 1.1 migration resumes the same concept, requires new answers to revised questions, and retains progress after answering and reload.');
