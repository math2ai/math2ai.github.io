// Typeset content must retain its meaning, and failures must preserve readable notation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildMath,parseMatrix,matrixTex} from './build_math.mjs';

const read = name => fs.readFileSync(new URL(name,import.meta.url),'utf8').replaceAll('\r\n','\n');
const course = JSON.parse(read('dist/curriculum.json'));
const before = JSON.stringify(course), {css,data} = buildMath(course);
assert.equal(JSON.stringify(course),before,'typesetting must never mutate questions or answers');
assert.deepEqual(parseMatrix('[[1, -2.5], [3, 4]]').rows,[['1','-2.5'],['3','4']]);
assert.deepEqual(parseMatrix('[[1, 2], []]').rows,[['1','2'],[]]);
assert.equal(parseMatrix('[[1], [2, 3]]').rectangular,false);
for (const raw of ['[[x, y]]','[[1,,2]]','[[<script>]]',String.raw`[[\input{evil}]]`,'[[1],2]']) assert.equal(parseMatrix(raw),null,raw);
assert.equal(matrixTex(parseMatrix('[[1, 2], [3, 4]]')),String.raw`\begin{bmatrix}1 & 2\\3 & 4\end{bmatrix}`);
assert.equal(matrixTex(parseMatrix('[[1, 2], []]')),String.raw`\left[\begin{array}{l}\left[1,\,2\right]\\\left[\right]\end{array}\right]`);

// Compare the accessible table's actual cells with every source matrix, including arithmetic.
const normalize = s => s.replace(/<[^>]+>/g,'').replace(/\s/g,'').replaceAll('−','-').replaceAll('*','×');
for (const f of data.fragments) {
 assert.match(f.html,/class="katex-mathml"/);
 assert.match(f.html,/class="katex-html" aria-hidden="true"/);
 const table = f.html.match(/<mtable\b[^>]*>(.*?)<\/mtable>/s)?.[1];
 assert.ok(table,f.plain);
 const actual = [...table.matchAll(/<mtr>(.*?)<\/mtr>/gs)].map(row=>[...row[1].matchAll(/<mtd\b[^>]*>(.*?)<\/mtd>/gs)].map(cell=>normalize(cell[1])));
 const expected = f.rowLists ? f.rows.map(row=>['['+row.map(normalize).join(',')+']']) : f.rows.map(row=>row.map(normalize));
 assert.deepEqual(actual,expected,f.plain);
 assert.doesNotMatch(f.html,/<script|onerror=|<a\s|<img\s/i);
}
const irregular = course.concepts.flatMap(c=>c.questions).find(q=>q.id==='6-05');
for (let i=0;i<4;i++) {
 const field = data.fields[`q:${irregular.id}:option:${i}`];
 assert.ok(data.fragments[field.parts.find(p=>typeof p==='number')].rowLists,'all rectangularity choices must share a notation style');
}
for (const field of Object.values(data.fields)) {
 assert.equal(field.parts.map(p=>typeof p==='string'?p:data.fragments[p].plain).join(''),field.text);
}
assert.equal((css.match(/@font-face/g)||[]).length,data.fonts.length);
assert.doesNotMatch(css,/url\((?!data:font\/woff2;base64,)/);
const built = read('dist/index.html');
assert.deepEqual(JSON.parse(built.match(/id="math-data">(.*?)<\/script>/s)[1]),data);
assert.ok(built.includes(css));
assert.ok(!built.includes(read('vendor/katex-0.18.7/katex.js')),'KaTeX parser must not ship to browsers');
assert.doesNotMatch(built,/\/\*MATH_\w+\*\//);
console.log(`PASS: ${data.fragments.length} distinct matrices preserve every cell and uneven row; all choices use consistent notation; bundled fonts, MathML and build-only renderer.`);

// Small isolated DOM fixture for fallback/readiness and keyboard-overflow behavior.
const code = read('math-display.js');
const fieldKey = 'c:6:formula', text = data.fields[fieldKey].text;
function boot({load,metadata=JSON.stringify(data)}={}) {
 const fallback={hidden:false},rendered={hidden:true},attributes={};
 const fragment={scrollWidth:400,clientWidth:240,querySelector:s=>s==='.math-fallback'?fallback:rendered,
  setAttribute:(k,v)=>{attributes[k]=v;},removeAttribute:k=>{delete attributes[k];}};
 const events={};
 const context=vm.createContext({document:{getElementById:()=>({textContent:metadata}),
  querySelectorAll:()=>[fragment],fonts:load?{load}:undefined},addEventListener:(event,fn)=>{events[event]=fn;}});
 context.window=context;vm.runInContext(code,context);
 return {api:context.math2aiMath,fallback,rendered,fragment,attributes,events};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
for (const load of [undefined,()=>Promise.reject(Error('font unavailable')),()=>Promise.resolve([]),()=>Promise.resolve([{status:'error'}]),()=>new Promise(()=>{})]) {
 const app=boot({load});await flush();
 assert.equal(app.fallback.hidden,false);assert.equal(app.rendered.hidden,true);
 assert.match(app.api.html(text,fieldKey),/class="math-rendered" hidden/);
}
// Independent successful fixture: all face requests resolve after content is already present.
const pending=[];const success=boot({load:()=>new Promise(resolve=>pending.push(resolve))});
assert.equal(success.fallback.hidden,false);
pending.forEach(resolve=>resolve([{status:'loaded'}]));await flush();
assert.equal(success.fallback.hidden,true);assert.equal(success.rendered.hidden,false);
assert.match(success.api.html(text,fieldKey),/class="math-fallback" hidden/);
assert.equal(success.attributes.tabindex,'0');
success.fragment.scrollWidth=200;success.events.resize();
assert.equal(success.attributes.tabindex,undefined);
assert.equal(success.api.label('[[1, 2], []]','q:6-05:option:0'),'array with 2 rows; row 1: 1, 2; row 2: empty');
assert.equal(success.api.label(text,fieldKey),'A ∈ ℝᵐˣⁿ;   A = matrix with 2 rows and 3 columns; row 1: 1, 2, 3; row 2: 4, 5, 6');
assert.equal(success.api.html('<new text>',fieldKey),'&lt;new text&gt;','stale content must stay readable and escaped');
for (const metadata of ['{bad json','{}',JSON.stringify({...data,fragments:[]})]) {
 assert.equal(boot({metadata}).api.html(text,fieldKey),text,'missing/corrupt metadata must fall back');
 assert.equal(boot({metadata}).api.label(text,fieldKey),text);
}
console.log('PASS: pending, missing, failed and undeclared fonts keep original notation; loaded fonts enable math; stale/missing metadata falls back; wide matrices support keyboard scrolling.');
