import assert from 'node:assert/strict';
import {bootBrowser,hub,Server,course,flush} from './progress-test-helpers.mjs';
const A='00000000-0000-4000-8000-000000000001', B='00000000-0000-4000-8000-000000000002';
const marked=(app,title)=>app.get('concept-select').innerHTML.includes(title+' ✓');
const server=new Server(),shared=hub();
const first=bootBrowser({shared,configured:true}), stale=bootBrowser({shared,configured:true});
first.signin(server,A);stale.signin(server,A);await flush();
first.correct();await flush();
assert.ok(marked(stale,'Scalar'),'Other tab updates without refresh');
first.go(4);first.correct();await flush();
assert.ok(marked(first,'Vector'));assert.ok(marked(stale,'Vector'));
stale.signout();await flush();
assert.ok(!marked(stale,'Scalar'));assert.ok(!marked(stale,'Vector'));
assert.ok(marked(first,'Scalar'));assert.ok(marked(first,'Vector'));
stale.signin(server,A);await flush();
assert.ok(marked(stale,'Scalar'));assert.ok(marked(stale,'Vector'));
const otherDevice=bootBrowser({configured:true});otherDevice.signin(server,A);await flush();
assert.ok(marked(otherDevice,'Scalar'));assert.ok(marked(otherDevice,'Vector'));
otherDevice.go(1);otherDevice.correct();await flush();assert.ok(marked(first,'Variable'));
console.log('PASS: account checkmarks disappear on sign-out, return on sign-in, and update live across tabs and independent device storage.');

// A tab that misses all browser and realtime events cannot replace other answers with its stale copy.
shared.paused=true;
const release=server.holdNext();
first.go(2);first.correct();await flush();
stale.go(3);stale.correct();await flush();release();await flush();
await first.engine.sync();await stale.engine.sync();
for(const title of ['Scalar','Variable','Function','Units','Vector'])assert.ok(marked(first,title),title);
shared.paused=false;
const target=first.question().id,before=server.data(A,course.version).answers[target].attempts;
server.loseReply=true;first.another();const retried=first.question().id;first.correct();await flush();
await first.engine.sync();await flush();
assert.equal(server.data(A,course.version).answers[retried].attempts,1);
assert.equal(server.data(A,course.version).answers[target].attempts,before);
console.log('PASS: simultaneous stale-tab saves merge; retry after a lost response records an attempt only once.');

// Deferred account-A responses must never populate guest or account-B views.
const delayed=server.holdNext();otherDevice.go(5);otherDevice.correct();await flush();
otherDevice.signout();await flush();delayed();await flush();assert.ok(!marked(otherDevice,'Scalar'));
otherDevice.signin(server,B);await flush();assert.ok(!marked(otherDevice,'Scalar'));assert.ok(!marked(otherDevice,'Matrix'));
otherDevice.go(6);otherDevice.correct();await flush();assert.ok(marked(otherDevice,'Tensor'));assert.ok(!marked(first,'Tensor'));
otherDevice.signout();await flush();otherDevice.go(7);otherDevice.correct();assert.ok(marked(otherDevice,'Summation'));
otherDevice.signin(server,A);await flush();assert.ok(marked(otherDevice,'Matrix'));assert.ok(marked(otherDevice,'Summation'));
otherDevice.signout();await flush();assert.ok(!marked(otherDevice,'Summation'));assert.ok(!marked(otherDevice,'Matrix'));
console.log('PASS: account switches and late responses preserve ownership; guest answers move into the account on sign-in.');

// Offline operations survive reload, deduplicate, and flush only into their original account.
server.offline=true;first.go(8);first.correct();await flush();
const offlineReload=bootBrowser({configured:true,shared});offlineReload.signin(server,A);await flush();assert.ok(marked(offlineReload,'Dot product'));
server.offline=false;offlineReload.emit('online');await flush();assert.ok(server.data(A,course.version).answers[offlineReload.question().id]);
console.log('PASS: offline answers survive reload and reconcile when the connection returns.');

// Clearing uses an epoch; a device returning with offline writes from before the clear cannot restore them.
const isolated=bootBrowser({configured:true});isolated.signin(server,A);await flush();
server.offline=true;isolated.go(9);isolated.correct();await flush();
server.offline=false;await first.reset();await flush();
await isolated.engine.sync();await flush();
assert.equal(Object.keys(server.data(A,course.version).answers).length,0);
for(const app of [first,stale,offlineReload,isolated])assert.ok(!marked(app,'Scalar'));
assert.ok(!marked(isolated,'Matrix multiplication'));
assert.ok(server.data(B,course.version).answers[course.concepts[6].questions.find(q=>server.data(B,course.version).answers[q.id])?.id]);
isolated.correct();await flush();assert.ok(marked(first,'Matrix multiplication'));
console.log('PASS: reset reaches other devices, rejects pre-reset offline attempts, and leaves other accounts intact.');

const guestShared=hub(),g1=bootBrowser({shared:guestShared}),g2=bootBrowser({shared:guestShared});await flush();
g1.correct();g2.go(4);g2.correct();await flush();
assert.ok(marked(g1,'Vector'));assert.ok(marked(g2,'Scalar'));
await g1.reset();await flush();assert.ok(!marked(g2,'Scalar'));assert.ok(!marked(g2,'Vector'));
console.log('PASS: guest tabs merge independent answers and receive explicit resets.');

const blocked=bootBrowser({readBlocked:true,writeBlocked:true});await flush();blocked.correct();
assert.ok(marked(blocked,'Scalar'));assert.match(blocked.get('storage-note').textContent,/cannot save/);
const unavailable=new Server();unavailable.offline=true;const noCache=bootBrowser({configured:true});noCache.signin(unavailable,A);await flush();
assert.equal(noCache.get('check').disabled,true);assert.equal(noCache.get('another').disabled,true);
assert.match(noCache.get('storage-note').textContent,/Could not load/);
noCache.signout();await flush();noCache.correct();assert.ok(marked(noCache,'Scalar'));
console.log('PASS: failed initial account load cannot overwrite cloud state; guest practice works with unavailable storage.');

const importedServer=new Server(),originalQ=course.concepts[0].questions[0];
const legacy=JSON.stringify({version:course.version,current:0,currentConceptId:1,concepts:{1:{active:originalQ.id,pending:false,remaining:[],answers:{[originalQ.id]:{first:originalQ.correct,last:(originalQ.correct+1)%4,attempts:3,solved:true}}}}});
const imported=bootBrowser({configured:true,shared:hub(new Map([['model-conversations-progress-v1',legacy]]))});
imported.signin(importedServer,A);await flush();
assert.ok(marked(imported,'Scalar'));assert.equal(importedServer.data(A,course.version).answers[originalQ.id].attempts,3);
assert.equal(imported.storage.get('model-conversations-progress-v1'),legacy);
imported.signout();await flush();assert.ok(!marked(imported,'Scalar'));
imported.signin(importedServer,B);await flush();assert.ok(!marked(imported,'Scalar'));
imported.signin(importedServer,A);await flush();assert.equal(importedServer.data(A,course.version).answers[originalQ.id].attempts,3);
console.log('PASS: legacy answers are claimed once after account resolution, retain attempt totals and a recovery copy, and do not leak to guest or another account.');

importedServer.loseReply=true;await imported.reset();await flush();
assert.equal(importedServer.data(A,course.version).epoch,1);
imported.correct();await flush();await imported.reset();await flush();
assert.equal(importedServer.data(A,course.version).epoch,2);
assert.equal(Object.keys(importedServer.data(A,course.version).answers).length,0);
console.log('PASS: an unacknowledged reset is reconciled, so a later new reset can clear newly earned answers.');

// Follow the actual acquisition flow: try ten questions first, then create/sign into an account.
const signupServer=new Server(),signupHub=hub();let visitor=bootBrowser({configured:true,shared:signupHub});
visitor.signout();await flush();
for(let i=0;i<10;i++){visitor.go(i);visitor.correct();}
const questionBefore=visitor.question().id,questionTextBefore=visitor.get('question').textContent;
// Google returns in a newly loaded document, with no in-memory guest session.
visitor.close();visitor=bootBrowser({configured:true,shared:signupHub});
visitor.signin(signupServer,A);
for(let i=0;i<10;i++)assert.ok(marked(visitor,course.concepts[i].title),'Guest marks remain visible while the account loads');
await flush();
for(let i=0;i<10;i++)assert.ok(marked(visitor,course.concepts[i].title));
assert.equal(visitor.question().id,questionBefore);assert.equal(visitor.get('question').textContent,questionTextBefore);
assert.match(visitor.get('feedback').innerHTML,/Correct/);
assert.equal(Object.keys(signupServer.data(A,course.version).answers).length,10);
assert.ok(Object.values(signupServer.data(A,course.version).answers).every(a=>a.attempts===1));
visitor.signout();await flush();assert.ok(!marked(visitor,'Scalar'));
visitor.signin(signupServer,B);await flush();assert.equal(Object.keys(signupServer.data(B,course.version).answers).length,0);
visitor.signin(signupServer,A);await flush();assert.ok(Object.values(signupServer.data(A,course.version).answers).every(a=>a.attempts===1));
const remoteSignup=bootBrowser({configured:true});remoteSignup.signin(signupServer,A);await flush();
assert.ok(marked(remoteSignup,'Scalar'));assert.ok(marked(remoteSignup,'Matrix multiplication'));
console.log('PASS: ten guest answers survive signup immediately, retain the current question/feedback, sync to a second device, and transfer to only one account.');

// Existing account progress is merged, including different attempts at the same question.
const returningHub=hub(),returning=bootBrowser({configured:true,shared:returningHub});returning.signout();await flush();
returning.go(10);returning.correct();
returning.go(0);const row=signupServer.data(A,course.version);
for(let i=0;i<10&&!row.answers[returning.question().id];i++)returning.another();
const guestQ=returning.question(),priorAttempts=row.answers[guestQ.id]?.attempts||0;
assert.ok(priorAttempts>0);returning.wrong();
returning.signin(signupServer,A);await flush();
assert.ok(marked(returning,'Transpose'));assert.ok(marked(returning,'Matrix multiplication'));assert.ok(marked(returning,'Scalar'));
assert.equal(row.answers[guestQ.id].attempts,priorAttempts+1);
assert.equal(row.answers[guestQ.id].last,(guestQ.correct+1)%4);
returning.signout();await flush();returning.signin(signupServer,A);await flush();
assert.equal(row.answers[guestQ.id].attempts,priorAttempts+1);
console.log('PASS: guest attempts merge with existing account history without removing earlier correct answers or double-counting subsequent logins.');

// Two tabs can finish the same Google redirect; they must claim and send each guest operation only once.
const concurrentServer=new Server(),concurrentHub=hub();
const c1=bootBrowser({configured:true,shared:concurrentHub}),c2=bootBrowser({configured:true,shared:concurrentHub});
c1.signout();c2.signout();await flush();c1.correct();c2.go(4);c2.correct();await flush();
c1.signin(concurrentServer,A);c2.signin(concurrentServer,A);await flush();
assert.equal(Object.keys(concurrentServer.data(A,course.version).answers).length,2);
assert.ok(Object.values(concurrentServer.data(A,course.version).answers).every(a=>a.attempts===1));
console.log('PASS: simultaneous sign-in in two tabs claims guest work once.');

// A failed fetch or upload keeps the transfer durable and owned, even across logout/reload/account switches.
const interruptedServer=new Server(),interruptedHub=hub();let interrupted=bootBrowser({configured:true,shared:interruptedHub});
interrupted.signout();await flush();interrupted.go(4);interrupted.correct();const transferredQuestion=interrupted.question().id;
interruptedServer.offline=true;interrupted.signin(interruptedServer,A);await flush();assert.ok(marked(interrupted,'Vector'));
interrupted.signout();await flush();assert.ok(!marked(interrupted,'Vector'));
interrupted.signin(interruptedServer,B);await flush();assert.ok(!marked(interrupted,'Vector'));
interrupted.close();interrupted=bootBrowser({configured:true,shared:interruptedHub});
interruptedServer.offline=false;interruptedServer.loseReply=true;interrupted.signin(interruptedServer,A);await flush();
await interrupted.engine.sync();await flush();
assert.ok(marked(interrupted,'Vector'));assert.equal(interruptedServer.data(A,course.version).answers[transferredQuestion].attempts,1);
assert.equal(Object.keys(interruptedServer.data(B,course.version).answers).length,0);
console.log('PASS: failed guest transfers survive reload and account switching, then resume into the original account without duplicates.');

// Once a guest transfer has been bound to an account epoch, a reset must also discard that transfer.
const clearingServer=new Server(),clearingHub=hub(),waiting=bootBrowser({configured:true,shared:clearingHub});
waiting.signout();await flush();waiting.correct();clearingServer.failWrites=true;waiting.signin(clearingServer,A);await flush();assert.ok(marked(waiting,'Scalar'));
const clearRemote=bootBrowser({configured:true});clearRemote.signin(clearingServer,A);await flush();await clearRemote.reset();await flush();
clearingServer.failWrites=false;await waiting.engine.sync();await flush();assert.ok(!marked(waiting,'Scalar'));
waiting.signout();await flush();assert.ok(!marked(waiting,'Scalar'));waiting.signin(clearingServer,A);await flush();
assert.equal(Object.keys(clearingServer.data(A,course.version).answers).length,0);
console.log('PASS: clearing an account cannot be undone by an interrupted guest transfer or another sign-in.');

const batchServer=new Server(),batchVisitor=bootBrowser({configured:true});batchVisitor.signout();await flush();
for(let i=0;i<13;i++){batchVisitor.go(i);for(let j=0;j<10;j++){batchVisitor.correct();if(j<9)batchVisitor.another();}}
batchVisitor.signin(batchServer,A);await flush();await batchVisitor.engine.sync();await flush();
const batchAnswers=batchServer.data(A,course.version).answers;
assert.equal(Object.keys(batchAnswers).length,130);assert.ok(Object.values(batchAnswers).every(a=>a.attempts===1));
batchVisitor.signout();await flush();batchVisitor.signin(batchServer,A);await flush();
assert.equal(Object.values(batchAnswers).reduce((n,a)=>n+a.attempts,0),130);
console.log('PASS: guest banks larger than one upload batch transfer completely without repeated attempts.');
