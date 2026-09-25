// Editorial coverage and real navigation handlers, including live answer state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bootBrowser,course,flush,Server} from './progress-test-helpers.mjs';
const authored=JSON.parse(fs.readFileSync(new URL('concept-links.json',import.meta.url),'utf8'));
const byId=new Map(course.concepts.map(c=>[c.legacyId,c]));
assert.equal(Object.keys(authored).length,128);
const boot=async options=>{const app=bootBrowser(options);await flush();return app;};
const app=await boot();let backwards=0,forwards=0;
const stripLinks=s=>s.replace(/<a\b[^>]*>/g,'').replaceAll('</a>','');
const targets=s=>[...s.matchAll(/data-concept-id="(\d+)"/g)].map(m=>+m[1]);
for(const c of course.concepts) {
 app.go(c.id-1);
 const spec=authored[c.legacyId];
 assert.deepEqual(c.connections,{mentions:spec.mentions,usedIn:spec.usedIn});
 const seen=new Set();
 for(const field of ['definition','example','formulaNote']) {
  const html=app.get(field==='formulaNote'?'formula-note':field).innerHTML;
  const links=spec.mentions.filter(m=>m.field===field);
  assert.deepEqual(targets(html).sort((a,b)=>a-b),links.map(m=>m.target).sort((a,b)=>a-b),c.title+' '+field);
  assert.equal(stripLinks(html),app.math.html(c[field]||'',`c:${c.legacyId}:${field}`),'links must preserve prose and typeset math');
  for(const link of links) {
   assert(byId.get(link.target).id<c.id,'inline links point to earlier lessons');
   assert(!seen.has(link.target),'only link each prerequisite once per lesson');seen.add(link.target);
   assert(html.includes(`href="#lesson-${link.target}"`),'use stable concept IDs');
  }
 }
 backwards+=seen.size;forwards+=spec.usedIn.length;
 assert(seen.size<=3 && spec.usedIn.length<=2);
 assert.equal(app.get('concept-applications').hidden,!spec.usedIn.length);
 assert.deepEqual(targets(app.get('concept-applications').innerHTML),spec.usedIn);
 for(const id of spec.usedIn)assert(byId.get(id).id>c.id);
 for(let i=0;i<10;i++) {
  for(const id of ['question','choices','feedback','formula'])assert(!app.get(id).innerHTML.includes('data-concept-id'),id+' must not gain links');
  app.another();
 }
}
app.close();

const nav=await boot({hash:'#lesson-38'});
nav.another();nav.wrong();nav.retry();nav.draft(nav.question().correct);
const original=nav.question(),hint=nav.get('feedback').innerHTML;
nav.scroll(610);
for(const mod of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]) {
 assert.equal(nav.followConcept(21,mod),false,'modified clicks retain browser behavior');
 assert.equal(nav.current().legacyId,38);
}
assert(nav.followConcept(21));assert.equal(nav.current().legacyId,21);assert.equal(nav.scrollPosition(),0);
nav.another();const chainQuestion=nav.question();nav.scroll(220);
nav.followConcept(19);nav.scroll(130);
nav.browserBack();assert.equal(nav.current().legacyId,21);assert.equal(nav.question().id,chainQuestion.id);assert.equal(nav.scrollPosition(),220);
nav.browserForward();assert.equal(nav.current().legacyId,19);assert.equal(nav.scrollPosition(),130);
nav.browserBack();
// Revisit the original concept in a new history entry and browse another question.
nav.followConcept(38);nav.another();assert.notEqual(nav.question().id,original.id);
nav.browserBack();nav.browserBack();
assert.equal(nav.current().legacyId,38);assert.equal(nav.question().id,original.id);
assert.equal(nav.scrollPosition(),610);assert.equal(nav.get('feedback').innerHTML,hint);
assert.match(nav.get('choices').innerHTML,new RegExp(`value="${original.correct}" checked`),'retry draft survives the detour');
nav.correct();await flush();
assert.equal(nav.state().concepts[38].answers[original.id].attempts,2,'navigation does not record attempts');
nav.followConcept(21);nav.browserBack();assert.equal(nav.get('retry').hidden,true);assert.match(nav.get('feedback').innerHTML,/Correct/);
// Review retains its separate draft and selection behavior.
nav.review();nav.back();assert.equal(nav.current().legacyId,38);assert.equal(nav.question().id,original.id);
nav.close();

// Restoring a history position must never resurrect answers cleared elsewhere.
const signed=await boot({configured:true,hash:'#lesson-38'}),server=new Server();
signed.signin(server,'alice');await flush();signed.go(byId.get(38).id-1);signed.correct();await flush();
signed.followConcept(21);await signed.engine.reset();await flush();signed.browserBack();
assert.equal(signed.current().legacyId,38);assert.equal(signed.get('feedback').hidden,true);
assert.equal(Object.keys(signed.state().concepts[38]?.answers||{}).length,0);
signed.followConcept(21);signed.signout();await flush();signed.browserBack();
assert.equal(Object.keys(signed.state().concepts[38]?.answers||{}).length,0,'Back cannot restore another account’s answers');
signed.close();
console.log(`Reviewed all 128 concepts: ${backwards} prerequisite links, ${forwards} selected later applications. History, drafts, reset and account isolation passed.`);
