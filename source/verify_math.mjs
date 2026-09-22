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

// Compare accessible cells with every source matrix, including those inside equations.
const normalize = s => s.replace(/<[^>]+>/g,'').replace(/\s/g,'').replaceAll('−','-').replaceAll('*','×');
const scriptDigits=Object.fromEntries([...('₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹')].map((c,i)=>[c,String(i%10)]));
const numbers=s=>(s.replace(/[₀-₉]+|[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,group=>' '+[...group].map(c=>scriptDigits[c]).join('')+' ').match(/\d+(?:\.\d+)?/g)||[]);
for (const f of data.fragments) {
 assert.match(f.html,/class="katex-mathml"/);
 assert.match(f.html,/class="katex-html" aria-hidden="true"/);
 const mathml=f.html.match(/<math\b[\s\S]*?<\/math>/)?.[0].replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g,'');
 const tables=[...mathml.matchAll(/<mtable\b[^>]*>(.*?)<\/mtable>/gs)];
 assert.equal(tables.length,f.matrices?.length||0,f.plain);
 for(const [i,matrix] of (f.matrices||[]).entries()) {
  const actual=[...tables[i][1].matchAll(/<mtr>(.*?)<\/mtr>/gs)].map(row=>[...row[1].matchAll(/<mtd\b[^>]*>(.*?)<\/mtd>/gs)].map(cell=>normalize(cell[1])));
  const expected=matrix.rowLists?matrix.rows.map(row=>['['+row.map(normalize).join(',')+']']):matrix.rows.map(row=>row.map(normalize));
  assert.deepEqual(actual,expected,f.plain);
 }
 // No numerical constants may be lost, duplicated or moved during authoring.
 assert.deepEqual(numbers(mathml.replace(/<[^>]+>/g,' ')),numbers(f.plain),f.plain);
 assert.doesNotMatch(f.tex,/[₀-₉₊₋₌ₐₑₒₓₕₖₗₘₙₛₜᵢᵣᵤᵥⱼ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿˣᴮᴴᴺᴼᵀᵃᵇᵈᵏᵐᵘᶻ]/,'scripts must use grouped TeX: '+f.plain);
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
for(const c of course.concepts)assert.ok(data.fields[`c:${c.legacyId}:formula`],c.title);
// Audit every teaching/question field, not just the display formula column.
const needsNotation=/[₀-₉₊₋₌ₐₑₒₓₕₖₗₘₙₛₜᵢᵣᵤᵥⱼ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿˣᴮᴴᴺᴼᵀᵃᵇᵈᵏᵐᵘᶻ̂̄=^_×∈≤≥∣∥‖∫∂∇√ΣΠ]/;
function covered(key,text) {
 const parts=data.fields[key]?.parts||[text];
 for(const part of parts)if(typeof part==='string')assert.doesNotMatch(part,needsNotation,`Unformatted notation in ${key}: ${part}`);
}
for(const c of course.concepts) {
 for(const f of ['definition','formula','formulaNote','example','metaphor'])covered(`c:${c.legacyId}:${f}`,c[f]||'');
 for(const q of c.questions) {
  for(const f of ['question','feedback','retryFeedback'])covered(`q:${q.id}:${f}`,q[f]);
  q.options.forEach((o,i)=>covered(`q:${q.id}:option:${i}`,o));
 }
}
const notation=JSON.parse(read('math-notation.json'));
const expression=(key,plain)=>notation.fields[key].find(p=>typeof p==='object'&&(!plain||p.plain===plain)).tex;
assert.match(expression('c:112:formula'),/F_\{m-1\}/);
assert.equal(expression('c:112:formulaNote','Fₘ₋₁'),String.raw`F_{m-1}`);
assert.match(expression('c:8:formula'),/\\sum_\{i=1\}\^\{n\}/);
assert.match(expression('q:8-01:question'),/\\sum\s*_\{i=1\}\^\{3\} i\^\{2\}/);
assert.match(expression('c:10:formula'),/\(AB\)_\{ij\}.*A_\{ik\}B_\{kj\}/);
assert.match(expression('c:36:formula','hₗ = φₗ(Wₗhₗ₋₁ + bₗ)'),/h_\{l-1\}/);
assert.match(expression('c:19:formula'),/\\lim_\{h\\to0\}\\frac/);
assert.match(expression('c:22:formula'),/\\int_a\^b.*\\lim_\{n\\to\\infty\}\\sum_\{i=1\}\^n/);
assert.match(expression('c:55:formula'),/\\sum_\{i=1\}\^\{n-k\}/);
assert.match(expression('c:68:formula'),/\\sum_\{k=0\}\^\{H-1\}/);
assert.match(expression('c:121:formula'),/\\sqrt\{\\bar\\alpha_t\}/);
assert.match(expression('c:70:formula'),/V\^\\pi.*\\mathbb\{E\}_\\pi/);
assert.match(expression('c:52:formula','zq = eₖ*'),/e_\{k\^\*\}/);
assert.match(expression('c:102:formula'),/\\mu_X.*\\mu_Y/);
assert.match(expression('c:42:formula'),/L_\{\\text\{data\}\}/);
assert.match(expression('c:57:formula'),/QK\^\{\\mathsf T\}/);
assert.match(expression('q:34-01:question','e^(−z) = 3'),/e\^\{-z\}/);
assert.match(expression('q:15-01:question'),/\\text\{hot\}\\mid \\text\{deep\}/);
const edited=structuredClone(course);edited.concepts[0].formula='x ∈ ℝ; x = 1';
assert.throws(()=>buildMath(edited),/Stale mathematical notation: c:1:formula/);
const boostFragment=data.fragments.find(f=>f.plain==='Fₘ₋₁');
assert.match(boostFragment.html,/<msub><mi>F<\/mi><mrow><mi>m<\/mi><mo>−<\/mo><mn>1<\/mn><\/mrow><\/msub>/);
const sumFragment=data.fragments.find(f=>f.plain===course.concepts.find(c=>c.legacyId===8).formula);
assert.match(sumFragment.html,/<munderover>/,'display sums place their bounds above and below');
assert.equal((css.match(/@font-face/g)||[]).length,data.fonts.length);
assert.doesNotMatch(css,/url\((?!data:font\/woff2;base64,)/);
const built = read('dist/index.html');
assert.deepEqual(JSON.parse(built.match(/id="math-data">(.*?)<\/script>/s)[1]),data);
assert.ok(built.includes(css));
assert.ok(!built.includes(read('vendor/katex-0.18.7/katex.js')),'KaTeX parser must not ship to browsers');
assert.doesNotMatch(built,/\/\*MATH_\w+\*\//);
console.log(`PASS: all 128 formula fields and ${Object.keys(data.fields).length} annotated fields render; ${data.fragments.length} distinct fragments preserve numbers, matrix cells and original fallback text; grouped scripts, limits, bundled fonts, MathML and build-only renderer.`);

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
