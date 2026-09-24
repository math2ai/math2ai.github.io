// Browse real questions without erasing drafts, feedback or the two-attempt limit.
import assert from 'node:assert/strict';
import {bootBrowser,hub,course,flush,Server} from './progress-test-helpers.mjs';
const boot=async options=>{const app=bootBrowser(options);await flush();return app;};
const attempts=(app,q)=>app.state().concepts[app.current().legacyId].answers[q.id]?.attempts||0;
const shared=hub();let app=await boot({shared});
assert.equal(app.get('another').attributes['aria-label'],'Next question');
assert.equal(app.get('question-position').textContent,'Question 1 of 10');
const first=app.question(),ids=[first.id];
app.draft(2);app.another();const second=app.question();ids.push(second.id);
assert.equal(app.get('question-position').textContent,'Question 2 of 10');
app.wrong();const hint=app.get('feedback').innerHTML;
app.previousQuestion();assert.equal(app.question().id,first.id);
assert.equal(app.get('question-position').textContent,'Question 1 of 10');
assert.match(app.get('choices').innerHTML,/value="2" checked/,'unsubmitted choice survives browsing');
app.another();assert.equal(app.question().id,second.id);assert.equal(app.get('feedback').innerHTML,hint);
app.retry();app.draft(second.correct);app.another();ids.push(app.question().id);
app.previousQuestion();assert.match(app.get('feedback').innerHTML,/Try again/);
assert.match(app.get('choices').innerHTML,new RegExp(`value="${second.correct}" checked`));
app.wrong();assert.equal(attempts(app,second),2);
app.previousQuestion();app.another();app.correct();
assert.equal(attempts(app,second),2,'back/forward cannot bypass the attempt limit');
app.close();app=await boot({shared});
assert.equal(app.question().id,second.id);assert.match(app.get('feedback').innerHTML,/The correct answer is:/);
assert.equal(app.get('question-position').textContent,'Question 2 of 10','reload keeps the question number');
app.previousQuestion();assert.equal(app.question().id,first.id);assert.match(app.get('choices').innerHTML,/value="2" checked/);
app.another();app.resetQuestion();app.another();app.previousQuestion();
assert.equal(app.get('feedback').hidden,true,'an explicit reset stays reset when revisited');
app.correct();assert.equal(attempts(app,second),3);
app.previousQuestion();app.another();assert.match(app.get('feedback').innerHTML,/Correct\./);
assert.equal(attempts(app,second),3,'browsing never records an answer');
app.another();assert.equal(app.question().id,ids[2]);
for(let i=3;i<10;i++){app.another();ids.push(app.question().id);}
assert.equal(new Set(ids).size,10);
app.another();assert.equal(app.question().id,first.id,'next wraps through the same ten questions');
assert.equal(app.get('question-position').textContent,'Question 1 of 10');
app.previousQuestion();assert.equal(app.question().id,ids[9],'previous wraps to the last question');
assert.equal(app.get('question-position').textContent,'Question 10 of 10');
for(let i=8;i>=0;i--){app.previousQuestion();assert.equal(app.question().id,ids[i]);}
app.go(1);app.go(0);assert.equal(app.question().id,first.id);
app.review();app.startReview();assert.equal(app.get('previous-question').hidden,true);
assert.equal(app.get('question-position').textContent,'Review question');
assert.equal(app.get('another').attributes['aria-label'],'Next review question');
const reviewQuestion=app.question().id;app.previousQuestion();assert.equal(app.question().id,reviewQuestion);
app.back();assert.equal(app.get('previous-question').hidden,false);assert.equal(app.question().id,first.id);
app.close();
console.log('PASS: previous/next, wraparound, per-question drafts and rounds, explicit reset, reload and review isolation.');

// Account transitions keep the whole local set of rounds, not just the current one.
const server=new Server(),visitor=await boot({configured:true});visitor.signout();await flush();
const q1=visitor.question();visitor.wrong();visitor.retry();visitor.another();const q2=visitor.question();visitor.correct();
visitor.signin(server,'learner');await flush();visitor.previousQuestion();
assert.equal(visitor.question().id,q1.id);assert.match(visitor.get('feedback').innerHTML,/Try again/);
visitor.signout();await flush();assert.equal(visitor.get('feedback').hidden,true);
visitor.signin(server,'learner');await flush();visitor.another();assert.equal(visitor.question().id,q2.id);
assert.match(visitor.get('feedback').innerHTML,/Correct\./);
const peer=await boot({configured:true});peer.signin(server,'learner');await flush();await peer.reset();await flush();
assert.equal(visitor.get('feedback').hidden,true);visitor.previousQuestion();assert.equal(visitor.get('feedback').hidden,true);
visitor.wrong();assert.equal(visitor.get('retry').hidden,false,'remote reset clears inactive question rounds');
visitor.close();peer.close();
console.log('PASS: guest signup, sign-out/in and remote reset preserve ownership and clear all affected question rounds.');

// Old active/remaining saves migrate without losing the current answer or next item.
const c=course.concepts[0],q=c.questions[3],next=c.questions[4];
const legacy={version:course.version,currentConceptId:c.legacyId,concepts:{[c.legacyId]:{
 active:q.id,remaining:[next.id,...c.questions.slice(5).map(q=>q.id)],pending:false,
 answers:{[q.id]:{first:q.correct,last:q.correct,attempts:1,solved:true}}
}}};
const migrated=await boot({shared:hub(new Map([['model-conversations-progress-v1',JSON.stringify(legacy)]]))});
assert.equal(migrated.question().id,q.id);assert.match(migrated.get('feedback').innerHTML,/Correct\./);
migrated.another();assert.equal(migrated.question().id,next.id);migrated.previousQuestion();assert.equal(migrated.question().id,q.id);
assert.equal(new Set(migrated.state().concepts[c.legacyId].order).size,10);migrated.close();
console.log('PASS: older saves retain their active question, next question and earned answers.');
