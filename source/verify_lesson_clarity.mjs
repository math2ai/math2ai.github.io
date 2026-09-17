// Formula notes are visible teaching, cleared when navigating, and safely typeset.
import assert from 'node:assert/strict';
import {bootBrowser,course,flush} from './progress-test-helpers.mjs';
import {buildMath} from './build_math.mjs';
const app=bootBrowser();await flush();
for(const c of course.concepts) {
 app.go(c.id-1);
 assert.equal(app.get('formula-note').textContent,c.formulaNote);
 assert.equal(app.get('formula-note').hidden,!c.formulaNote);
}
// Move back from a note-bearing lesson to one without a note; no stale teaching.
app.go(course.concepts.findIndex(c=>c.legacyId===104));
assert.match(app.get('formula-note').textContent,/low-rank approximation/);
app.go(course.concepts.findIndex(c=>c.legacyId===2));
assert.equal(app.get('formula-note').textContent,'');
assert.equal(app.get('formula-note').hidden,true);
app.close();
const sample=structuredClone(course);
sample.concepts[0].formulaNote='For example, [[1, 0], [0, 2]]; <plain text>.';
const {data}=buildMath(sample),entry=data.fields['c:1:formulaNote'];
assert.equal(entry.text,sample.concepts[0].formulaNote);
assert.ok(entry.parts.some(p=>typeof p==='number'));
assert.equal(entry.parts.map(p=>typeof p==='string'?p:data.fragments[p].plain).join(''),entry.text);
// Temperature premise: dividing by a smaller positive value expands score gaps.
for(const [a,b] of [[1,3],[-2,4],[-5,-1]]) {
 assert.ok(Math.abs(a/.5-b/.5)>Math.abs(a/2-b/2));
}
console.log('PASS: notes render for every lesson, clear on navigation, and preserve math/plain fallback text; temperature operation checked independently.');
