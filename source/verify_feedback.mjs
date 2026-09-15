// Exercise real UI handlers and answer persistence; no network or real accounts are used.
import assert from 'node:assert/strict';
import {bootBrowser,hub,course,flush,Server} from './progress-test-helpers.mjs';
const boot=async options=>{const app=bootBrowser(options);await flush();return app;};
const answer=(app,q=app.question())=>app.state().concepts[course.concepts.find(c=>c.questions.some(x=>x.id===q.id)).legacyId].answers[q.id];
const visibleText=app=>app.get('feedback').innerHTML.replace(/<[^>]*>/g,' ');
for(let i=0;i<course.concepts.length;i++) {
 // Keep each concept's fixture small; aggregate-course persistence has its own state tests.
 const all=await boot();
 all.go(i);
 for(let j=0;j<10;j++) {
  const q=all.question();
  all.wrong();
  assert.equal(all.get('retry').hidden,false,q.id);
  assert.equal(all.get('reset-question').hidden,true,q.id);
  assert.doesNotMatch(visibleText(all),/The correct answer is:/,q.id);
  assert.ok(q.retryFeedback.length>40 && q.retryFeedback!==q.feedback,q.id);
  const hint=all.get('feedback').innerHTML;
  all.retry();
  assert.equal(all.get('feedback').hidden,false,'first-mistake explanation stays available while retrying');
  assert.equal(all.get('check').hidden,false);
  assert.match(all.get('choices').innerHTML,/name="answer"/);
  all.wrong();
  assert.match(visibleText(all),/The correct answer is:/,q.id);
  assert.notEqual(all.get('feedback').innerHTML,hint,q.id);
  assert.equal(all.get('retry').hidden,true,q.id);
  assert.equal(all.get('reset-question').hidden,false,q.id);
  assert.equal(answer(all,q).attempts,2,q.id);
  all.retry();all.correct();
  assert.equal(answer(all,q).attempts,2,'invoking hidden controls cannot create a third attempt');
  const before=answer(all,q);
  all.resetQuestion();
  assert.deepEqual(answer(all,q),before,'question reset keeps lifetime history');
  assert.equal(all.get('feedback').hidden,true);
  all.correct();
  assert.equal(answer(all,q).attempts,3,q.id);
  assert.equal(answer(all,q).first,before.first,q.id+' must retain its first answer');
  assert.equal(answer(all,q).solved,true);
  assert.equal(all.get('retry').hidden,true);
  assert.equal(all.get('reset-question').hidden,false);
  if(j<9)all.another();
 }
 all.close();
}
console.log('PASS: all 1,280 questions have staged feedback; two wrong attempts lock the round; reset retains history; successful practice still marks completion.');

const shared=hub();let app=await boot({shared});const q=app.question();app.wrong();app.retry();app.close();
app=await boot({shared});assert.equal(app.question().id,q.id);assert.match(visibleText(app),/Try again/);
app.wrong();app.close();app=await boot({shared});
assert.equal(app.get('retry').hidden,true);assert.equal(app.get('reset-question').hidden,false);
app.retry();app.correct();assert.equal(answer(app,q).attempts,2);
app.go(1);app.go(0);assert.equal(app.get('retry').hidden,true);
app.resetQuestion();app.close();app=await boot({shared});
assert.equal(app.get('feedback').hidden,true);assert.equal(answer(app,q).attempts,2);
app.wrong();app.retry();app.correct();assert.equal(answer(app,q).attempts,4);assert.equal(answer(app,q).solved,true);
app.resetQuestion();assert.equal(app.get('concept-score').hidden,false,'resetting practice does not remove earned completion');
app.close();
console.log('PASS: retry budget and reset survive lesson navigation and reload; history and completion survive question resets.');

const review=await boot();review.review();review.startReview();const rq=review.question();
review.wrong();review.retry();review.changeTopics();review.startReview();assert.match(visibleText(review),/Try again/);
review.wrong();review.retry();review.correct();assert.equal(answer(review,rq).attempts,2);
review.changeTopics();review.startReview();assert.equal(review.get('retry').hidden,true);
review.resetQuestion();review.correct();assert.equal(answer(review,rq).attempts,3);review.close();
console.log('PASS: review uses the same two-attempt feedback flow and retains its round when changing/resuming topics.');

const server=new Server(),visitor=await boot({configured:true});visitor.signout();await flush();
visitor.wrong();visitor.retry();const vq=visitor.question();visitor.signin(server,'learner');await flush();
assert.equal(visitor.question().id,vq.id);assert.match(visibleText(visitor),/Try again/);
visitor.wrong();await flush();assert.equal(visitor.get('retry').hidden,true);
visitor.signout();await flush();assert.equal(visitor.get('feedback').hidden,true);
visitor.signin(server,'learner');await flush();assert.equal(visitor.get('retry').hidden,true);
assert.equal(visitor.get('reset-question').hidden,false);assert.equal(server.data('learner',course.version).answers[vq.id].attempts,2);
const peer=await boot({configured:true});peer.signin(server,'learner');await flush();
peer.correct();await flush();assert.equal(visitor.get('retry').hidden,true,'a remote answer does not reopen a closed local round');
assert.match(visibleText(visitor),/The correct answer is:/);
visitor.resetQuestion();visitor.wrong();await flush();
assert.equal(visitor.get('retry').hidden,false,'a fresh round has a fresh budget despite lifetime attempts');
visitor.go(1);visitor.wrong();visitor.retry();visitor.wrong();await flush();
visitor.go(0);
await peer.reset();await flush();assert.equal(visitor.get('feedback').hidden,true);assert.equal(visitor.get('concept-score').hidden,true);
visitor.go(1);assert.equal(visitor.get('feedback').hidden,true,'a remote global reset also clears inactive lesson rounds');
assert.equal(server.calls.filter(c=>c.name==='math2ai_reset').length,1,'only explicit Clear saved answers resets account history');
visitor.close();peer.close();
console.log('PASS: guest signup, sign-out/in, independent devices and explicit global reset preserve the intended attempt/history separation.');

const reopenServer=new Server(),closedStorage=hub();let closed=await boot({configured:true,shared:closedStorage});
closed.signin(reopenServer,'learner');await flush();closed.wrong();closed.retry();closed.wrong();await flush();closed.close();
const resetPeer=await boot({configured:true});resetPeer.signin(reopenServer,'learner');await flush();await resetPeer.reset();await flush();
closed=await boot({configured:true,shared:closedStorage});closed.signin(reopenServer,'learner');await flush();closed.close();
closed=await boot({configured:true,shared:closedStorage});closed.signin(reopenServer,'learner');await flush();
assert.equal(closed.get('feedback').hidden,true,'a cached old round cannot return after a remote reset and two reloads');
assert.equal(closed.get('reset-question').hidden,true);closed.wrong();assert.equal(closed.get('retry').hidden,false);
closed.close();resetPeer.close();
console.log('PASS: a reset received after reopening a closed tab removes old round feedback and restores both attempts.');

const frozenStorage=hub(),frozenTime=1800000000000;
let fast=await boot({shared:frozenStorage,now:frozenTime});const fq=fast.question(),wrong=(fq.correct+1)%4;
fast.wrong();fast.retry();fast.wrong();fast.close();
fast=await boot({shared:frozenStorage,now:frozenTime-1000});fast.resetQuestion();fast.correct();
assert.equal(answer(fast,fq).first,wrong,'rapid answers and a backward clock must not reorder the first answer');
assert.equal(answer(fast,fq).last,fq.correct);assert.equal(answer(fast,fq).attempts,3);
const times=[...frozenStorage.storage.entries()].filter(([key])=>key.includes(':attempt:')).map(([,value])=>JSON.parse(value).time);
assert.deepEqual(times,[frozenTime,frozenTime+1,frozenTime+2]);fast.close();
console.log('PASS: rapid attempts, reloads and backward clock changes preserve first/latest answer order.');
