import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {Worker} from 'node:worker_threads';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const require=createRequire(import.meta.url),math=require('./vendor/mathjs-15.2.0/math.js');
vm.runInThisContext(read('playground-engine.js'));
// A fresh library matches the disposable browser worker, including RNG state.
const evaluate=source=>globalThis.math2aiPlaygroundEvaluate(source,math.create(math.all));
const numbers=source=>evaluate(source).results.filter(r=>r.kind!=='plot');
const output=source=>numbers(source).at(-1);
const shown=source=>{const r=output(source);return r.kind==='matrix'?r.rows:r.text;};
const numeric=source=>Number(shown(source));
const vector=source=>shown(source).map(row=>Number(row[0]));
const unpack=(r,expected)=>Array.isArray(expected)?(Array.isArray(expected[0])?r.rows.map(row=>row.map(Number)):r.rows.map(row=>Number(row[0]))):typeof expected==='string'&&!r.text.startsWith('"')?r.text:JSON.parse(r.text);
const data=JSON.parse(read('playgrounds.json')),course=JSON.parse(read('dist/curriculum.json'));
for(const [id,d]of Object.entries(data)) {
 assert.ok(course.concepts.some(c=>c.legacyId===Number(id)));
 const all=evaluate(d.expression).results,results=all.filter(r=>r.kind!=='plot');
 assert.equal(all.filter(r=>r.kind==='plot').length,d.plots||0,'Declared plots must render');
 assert.equal(results.length,d.expected.length,'Every supplied output is checked');
 for(let i=0;i<results.length;i++) {
  const result=unpack(results[i],d.expected[i]);
  assert.deepEqual(result,d.expected[i],`Lesson ${id}, output ${i+1}`);
 }
 const first=unpack(results[0],d.expected[0]);
 assert.deepEqual(first,{
  '150':[5,6],'149':{length:5,unit:[.6,.8]},'154':{dotProduct:0,lengthU:2.236068,lengthV:2.236068},
  '155':{coefficient:2,projection:[2,2],residual:[1,-1],perpendicularCheck:0},'151':[5,10],
  '152':[0,0],'153':[4,2],'156':[[3],[2]],'159':{rank:1,oppositeCornerDifference:0},
  '160':{approximation:[[6,0],[0,0]],squaredError:4},'5':[4,6],'6':[[1,2,3],[4,5,6]],'7':{shape:[2,3,4],axes:3,entries:24},
  '8':12,'9':23,'10':[[17],[39]],'11':[[1],[2],[3]],'12':[2,6],
  '13':[9,16],'14':.5,'16':{contributions:[0,5],expected:5},'17':[-2,2],
  '18':{power:8,recoveredExponent:3},'19':{change:.0601,slope:6.01},
  '30':{prediction:[4,8,12],residual:[2,-1,2],MSE:3},'31':2.5,
  '102':{covariance:2,correlation:1},'103':{Av:[2,0],scaled:[2,0],mismatch:0},
  '104':[3,0],'106':3,
  '38':{prediction:2,loss:16},'39':{gradients:[2,6],meanGradient:4,updatedWeight:.6},
  '40':{stepsPerEpoch:5,totalUpdates:15,finalBatchSize:20},
  '36':{hidden1:3,hidden2:2,output:6},'115':[-1,-1],
  '116':{before:[1,2,4],afterOneHop:[4,3,5]},'43':[.25,.75],
  '44':.105361,'105':.693147,
  '45':{visible:[2,6],target:4,prediction:5,squaredError:1},'46':[1,0],
  '47':{dot:2,lengths:[1,2],similarity:1},
  '117':{positiveProbability:.8,loss:.223144},
  '48':{mean:[0,0],covariance:[[1,1],[1,1]]},
  '49':{initialMSE:1.25,initialReconstruction:[[-2,-2],[-1,-1],[1,1],[2,2]]}
 }[id],'The first output reproduces a calculation in the worked example');
}
assert.deepEqual(vector(data['5'].expression.replace('k = 2','k = 3')),[6,9]);
assert.equal(numeric(data['9'].expression.replace('[4, 5]','[3, -2]')),0);
assert.deepEqual(vector(data['12'].expression.replace('[1, 2]','[3, -1]')),[6,-3]);
assert.equal(numeric(data['6'].expression.replace('A[2, 3]','A[1, 2]')),2);
assert.deepEqual(evaluate(data['8'].expression.replace('[2, 4, 6]','[0, 3, 9]')).results.map(r=>Number(r.text)),[12,4]);
assert.deepEqual(shown(data['11'].expression.replace('[[1, 2, 3]]','[1, 2; 3, 4; 5, 6]')),[['1','3','5'],['2','4','6']]);
assert.equal(numeric(data['31'].expression.replace('[2, 5]','[3, 3]')),0);
assert.equal(numeric(data['31'].expression.replace('[2, 5]','[1, 7]')),10,'Doubling both errors quadruples MSE');

// Check fitted regression through independent least-squares conditions rather
// than copying the centered-data formula used in the editable example.
const regression=data['30'].expression;
const trips=(x,y)=>regression.replace('x = [1, 3, 5]; y = [6, 7, 14];',`x = [${x}]; y = [${y}];`);
const fit=(x,y)=>JSON.parse(shown(trips(x,y)));
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
assert.deepEqual(fit([1,3,5],[6,7,14]),{rate:2,start:3,MSE:2});
assert.deepEqual(fit([1,3,5],[6,7,17]),{rate:2.75,start:1.75,MSE:4.5});
assert.deepEqual(fit([0,2],[3,7]),{rate:2,start:3,MSE:0});
assert.deepEqual(fit([1,3,5],[8,8,8]),{rate:0,start:8,MSE:0});
assert.deepEqual(fit([5,3,1],[14,7,6]),{rate:2,start:3,MSE:2});
assert.deepEqual(fit([1,3,5],[11,12,19]),{rate:2,start:8,MSE:2});
near(fit([1000,3000,5000],[6,7,14]).rate,.002);
// Editing a trial line changes its predictions/residuals/MSE, not the fitted
// optimum. Compute its objective independently without the supplied mse function.
for(const [w,b]of [[2,2],[2,3],[1,3],[-2,4],[0,9]]) {
 const source=regression.replace('w = 2; b = 2;',`w = ${w}; b = ${b};`);
 const [trial,best]=numbers(source).map(r=>JSON.parse(r.text));
 const prediction=[1,3,5].map(x=>w*x+b),residual=[6,7,14].map((y,i)=>y-prediction[i]);
 assert.deepEqual(trial.prediction,prediction);assert.deepEqual(trial.residual,residual);
 near(trial.MSE,residual.reduce((s,r)=>s+r*r,0)/3);
 assert.deepEqual(best,{rate:2,start:3,MSE:2});
 assert.ok(trial.MSE>=best.MSE);
}
for(const [x,y]of [
 [[1,3,5],[6,7,14]],[[1,3,5],[6,7,17]],[[2,4,7,9],[8,6,4,3]],
 [[1,1,3],[2,4,8]],[[1,2,3,4],[3,6,5,9]],[[1,3,5],[8,8,8]]
]) {
 const {rate,start,MSE}=fit(x,y),residual=y.map((v,i)=>v-(rate*x[i]+start));
 near(residual.reduce((s,v)=>s+v,0),0);
 near(residual.reduce((s,v,i)=>s+v*x[i],0),0);
 const error=(w,b)=>y.reduce((s,v,i)=>s+(v-w*x[i]-b)**2,0),best=error(rate,start);
 near(MSE,best/y.length);
 for(const dw of [-2,-1,-.25,0,.25,1,2])for(const db of [-2,-1,-.25,0,.25,1,2]) {
  assert.ok(error(rate+dw,start+db)>=best-1e-9,'A neighboring line must not fit better');
 }
}
// Constant distances cannot identify a slope; show a useful edit instruction.
assert.equal(JSON.parse(shown(trips([2,2,2],[6,7,14]))),'Use at least two different distances.');
assert.throws(()=>evaluate(trips([1,3,5],[6,7])),/dimension|size|length/i);
console.log('PASS: worked examples, trial predictions/residuals/MSE, regression edits and least-squares optimality, shape errors, and declared fit boundary.');
// Native visibility: assignments print unless suppressed with a semicolon.
assert.deepEqual(evaluate('# Start\nx=2\nx+1;\nx+2\n# End').results.map(r=>r.text),['2','4']);
assert.deepEqual(evaluate('x=2;\nx+1;').results,[]);
assert.equal(shown('x=2'),'2');
assert.throws(()=>evaluate('x'),/Undefined symbol x/);

// Independently computed arithmetic, including negatives and rectangular maps.
let seed=73019;
const number=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%17-8;};
for(let i=0;i<250;i++) {
 const x=[number(),number(),number()],w=[number(),number(),number()],k=number();
 const a=Array.from({length:2},()=>Array.from({length:3},number));
 assert.deepEqual(vector(`${k} * [${x}]`),x.map(v=>k*v).map(v=>v||0));
 assert.equal(numeric(`dot([${x}], [${w}])`),x.reduce((s,v,j)=>s+v*w[j],0));
 assert.deepEqual(vector(`[${a.map(r=>r.join(',')).join(';')}] * [${x}]`),a.map(row=>row.reduce((s,v,j)=>s+v*x[j],0)));
}
console.log('PASS: original examples and 750 independently computed vector/dot/matrix cases.');

const cases=[
 ['A=[1,2,3;4,5,6]; transpose(A)',[['1','4'],['2','5'],['3','6']]],
 ["[1,2;3,4]'",[['1','3'],['2','4']]],
 ['inv([1,2;3,4])',[['-2','1'],['1.5','-0.5']]],
 ['det([1,2;3,4])','-2'],
 ['lusolve([2,0;0,4],[6,8])',[['3'],['2']]],
 ['A=[1,2;3,4]; A[2,1]=9; A',[['1','2'],['9','4']]],
 ['[10,20,30,40][2:3]',[['20'],['30']]],
 ['f(x)=x^2+1; map(1:4,f)',[['2'],['5'],['10'],['17']]],
 ['f(x)=x^2','f(x)'],
 ['f(x)=x^2; f(12)','144'],
 ['sin(pi/2) + cos(0)','2'],
 ['sum(1:100)','5050'],
 ['mean([2,4,6])','4'],
 ['5 > 2 and 1 < 3','true'],
 ['x=-4; x<0 ? -x : x','4'],
 ['2(3+4)','14'],
 ['sqrt(-1)','i'],
 ['[i,1+i] * 2',[['2i'],['2 + 2i']]],
 ['2 inch to cm','5.08 cm'],
 ['fraction(1,3) + fraction(1,6)','1/2'],
 ['bignumber("12345678901234567890") + bignumber(1)','1.2345678901234567891e+19'],
 ['derivative("x^3", "x")','3 * x ^ 2'],
 ['simplify("2*x+x")','3 * x'],
 ['evaluate("2^10")','1024'],
 ['parse("x^2")','x ^ 2'],
 ['{answer: 42, unit: "m"}','{"answer": 42, "unit": "m"}'],
 ['"<img src=x onerror=alert(1)>"','"<img src=x onerror=alert(1)>"'],
 ['[]','[]'],
 ['[[[1,2]]]','[[[1, 2]]]'],
 ['1/0','Infinity'],
 ['0/0','NaN'],
 ['2^20','1.048576e+6'],
 ['1e13','1e+13'],
 ['('.repeat(30)+'1'+')'.repeat(30),'1'],
 [Array.from({length:25},(_,i)=>`a=${i};`).join('\n')+'\na','24'],
 ['# '+'a'.repeat(2500)+'\n2+2','4']
];
for(const [expression,expected]of cases)assert.deepEqual(shown(expression),expected,expression);
assert.equal(shown('ones(12,12)').length,12,'Remove the former 8-entry limit');
const preview=output('ones(40,50)');
assert.equal(preview.rows.length,32);assert.equal(preview.rows[0].length,32);
assert.match(preview.note,/32 × 32 of 40 × 50/);
assert.equal(numeric('A=ones(40,50); sum(A)'),2000,'Display limits do not change calculation values');
assert.match(output('"'+'a'.repeat(3000)+'"').note,/shortened/);
const many=evaluate(Array.from({length:101},(_,i)=>String(i)).join('\n'));
assert.equal(many.results.length,101);assert.match(many.results.at(-1).text,/first 100 of 101/);
console.log(`PASS: ${cases.length} native-language cases, larger inputs, and bounded previews without changing results.`);

// Use math.js's native syntax/type errors and parser protections, not a whitelist.
const rejected=['1+','[1,2;3]','dot([1,2],[1])','[1,2;3,4]*[1,2,3]',
 'fetch("https://example.com")','localStorage.getItem("token")','self.postMessage(1)',
 'a={}; a.constructor','a={}; a.__proto__','f(x)=x; f.constructor'];
for(const expression of rejected)assert.throws(()=>evaluate(expression),undefined,expression);
console.log('PASS: native syntax/shape errors and no JavaScript globals or prototype access.');

// Actual structured cloning must work for every rich output, including functions
// and symbolic nodes that cannot themselves be sent across a worker boundary.
const worker=new Worker(`const {parentPort}=require('node:worker_threads');
globalThis.self=globalThis;globalThis.math=require(${JSON.stringify(fileURLToPath(new URL('vendor/mathjs-15.2.0/math.js',import.meta.url)))});
self.postMessage=value=>parentPort.postMessage(value);
${read('playground-engine.js')}
${read('playground-worker.js')}
parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});
const ask=expression=>new Promise((resolve,reject)=>{
 const cleanup=()=>{worker.off('message',success);worker.off('error',failure);clearTimeout(deadline);};
 const success=value=>{cleanup();resolve(value);},failure=error=>{cleanup();reject(error);};
 const deadline=setTimeout(()=>failure(Error('Worker did not reply')),5000);
 worker.once('message',success);worker.once('error',failure);worker.postMessage(expression);
});
try {
 for(const d of Object.values(data))assert.deepEqual(await ask(d.expression),{ok:true,...evaluate(d.expression)});
 for(const [expression]of cases)assert.deepEqual(await ask(expression),{ok:true,...evaluate(expression)},expression);
 assert.equal((await ask('1+')).ok,false);
 assert.equal((await ask('x')).ok,false);
 assert.equal((await ask('2+2')).results[0].text,'4');
}finally{await worker.terminate();}
console.log('PASS: real worker messaging for rich types, fresh scope, errors, and recovery.');

const html=read('dist/index.html');
assert.match(html,/<script type="text\/plain" id="playground-library">/);
assert.match(html,/<div class="explore" id="explore" hidden>/);
assert.match(html,/<a class="explore-docs" href="https:\/\/mathjs.org\/docs\/expressions\/syntax.html" target="_blank" rel="noopener noreferrer"/);
assert.doesNotMatch(html,/<textarea id="explore-expression"[^>]*maxlength/);
assert.ok(!/id="explore-(?:toggle|title|explanation|suggestion|run|stop|plot|calculation)"/.test(html));
assert.ok(!/\/\*PLAYGROUND_/.test(html));
for(const name of ['playground.js','playground-engine.js','playground-worker.js','playground-plot.js']) {
 assert.ok(!/localStorage|sessionStorage|math2aiProgress|\.record\(|\.rpc\(|fetch\(/.test(read(name)),name+' must not access saved answers or network');
}
console.log('PASS: embedded library, subtle documentation link, minimal cell, and no progress/network calls.');
