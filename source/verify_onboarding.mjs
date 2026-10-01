// First-visit welcome, per-question feedback link and link-preview tags.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bootBrowser,hub,course,flush,Server} from './progress-test-helpers.mjs';
const boot=async options=>{const app=bootBrowser(options);await flush();return app;};

// A new visitor sees the welcome until the first answer; it does not return on reload.
const shared=hub();let app=await boot({shared});
assert.equal(app.get('welcome').hidden,false);
assert.equal(app.get('welcome-count').textContent,course.concepts.length);
app.go(40);assert.equal(app.get('welcome').hidden,false,'a deep or later lesson still orients a new visitor');
app.wrong();assert.equal(app.get('welcome').hidden,true,'any recorded answer ends the welcome');
app.close();app=await boot({shared});assert.equal(app.get('welcome').hidden,true);
app.close();

// Hide is remembered on this device, survives reloads and blocked storage does not break it.
const hiddenStore=hub();app=await boot({shared:hiddenStore});
app.get('welcome-hide').onclick();assert.equal(app.get('welcome').hidden,true);
app.go(3);assert.equal(app.get('welcome').hidden,true);
assert.deepEqual(app.state().concepts[1]?.answers||{},{},'hiding records no answer');
app.close();app=await boot({shared:hiddenStore});assert.equal(app.get('welcome').hidden,true);app.close();
const blocked=await boot({readBlocked:true,writeBlocked:true});
assert.equal(blocked.get('welcome').hidden,false);
blocked.get('welcome-hide').onclick();assert.equal(blocked.get('welcome').hidden,true);blocked.close();

// Signing in to an account that already has answers removes the welcome; signing out restores the guest view.
const server=new Server(),learner=await boot({configured:true});learner.signin(server,'learner');await flush();
assert.equal(learner.get('welcome').hidden,false);
learner.correct();await flush();assert.equal(learner.get('welcome').hidden,true);
const second=await boot({configured:true});assert.equal(second.get('welcome').hidden,true,'nothing flashes while saved answers are still loading');
second.signin(server,'learner');await flush();assert.equal(second.get('welcome').hidden,true);
second.signout();await flush();assert.equal(second.get('welcome').hidden,false);
learner.close();second.close();
console.log('PASS: welcome shows for new visitors and deep links, ends on the first answer or Hide, survives reload and blocked storage, and follows the account.');

// The feedback link names the visible lesson and question, in lessons and in Review.
const report=app=>new URL(app.get('report-link').href);
const check=(app,concept,question)=>{
 const url=report(app),label=`${String(concept.id).padStart(3,'0')} · ${concept.title}`;
 assert.equal(url.origin+url.pathname,'https://github.com/math2ai/math2ai.github.io/issues/new');
 assert.deepEqual([...url.searchParams.keys()],['title','body']);
 assert.equal(url.searchParams.get('title'),'Feedback: '+label);
 const body=url.searchParams.get('body');
 assert.ok(body.startsWith(`Lesson: ${label} (https://math2ai.github.io/#lesson-${concept.legacyId})\nQuestion: ${question.id}\n`),body);
 assert.doesNotMatch(body,/user|account|@|answer/i,'no account or answer data is placed in the link');
};
for(const index of [0,9,33,course.concepts.length-1]) {
 const visitor=await boot();visitor.go(index);
 check(visitor,visitor.current(),visitor.question());
 visitor.another();check(visitor,visitor.current(),visitor.question());
 visitor.close();
}
const reviewer=await boot();reviewer.go(5);reviewer.wrong();reviewer.review();reviewer.startReview();
const reviewed=reviewer.question();
check(reviewer,course.concepts.find(c=>c.questions.some(q=>q.id===reviewed.id)),reviewed);reviewer.close();
const signed=await boot({configured:true});signed.signin(new Server(),'00000000-0000-4000-8000-000000000009');await flush();
assert.doesNotMatch(signed.get('report-link').href,/00000000/);signed.close();
console.log('PASS: feedback link carries only the lesson and question, updates with question navigation, and works in Review.');

const html=fs.readFileSync(new URL('dist/index.html',import.meta.url),'utf8'),head=html.slice(0,html.indexOf('</head>'));
const meta=name=>head.match(new RegExp(`<meta property="${name}" content="([^"]*)">`))?.[1];
assert.equal(meta('og:url'),'https://math2ai.github.io/');
assert.ok(meta('og:title').startsWith('math2ai')&&meta('og:description').length>60);
const image=meta('og:image');assert.match(image,/^https:\/\/math2ai\.github\.io\/source\/assets\/[\w-]+\.jpg$/);
const file=new URL(image.replace('https://math2ai.github.io/source/','./'),import.meta.url);
assert.ok(fs.statSync(file).size>10000,'the preview image must exist in the published repository');
assert.match(head,/<meta name="twitter:card" content="summary_large_image">/);
assert.match(head,/<link rel="canonical" href="https:\/\/math2ai\.github\.io\/">/);
assert.match(html,/<a id="report-link"[^>]*target="_blank" rel="noopener noreferrer"/);
console.log('PASS: link-preview tags point at the live site and an image that ships with it.');
