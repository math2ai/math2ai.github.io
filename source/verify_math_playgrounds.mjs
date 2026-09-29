// Independently check the editable mathematical examples, including edits that
// break the assumptions in their initial, hand-computable worked examples.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const math=createRequire(import.meta.url)('./vendor/mathjs-15.2.0/math.js');
vm.runInThisContext(read('playground-engine.js'));
const definitions=JSON.parse(read('playgrounds.json'));
const ids=[7,10,13,103,104,14,16,17,102,106,18,19];
assert.ok(Object.keys(definitions).length>=20);
for(const id of ids)assert.ok(definitions[id],`Missing requested playground ${id}`);
const source=id=>definitions[id].expression;
// The browser starts a fresh worker/library per edit. Match that lifecycle so
// configuration and random-generator state cannot leak between test runs.
const run=s=>globalThis.math2aiPlaygroundEvaluate(s,math.create(math.all)).results.filter(r=>r.kind!=='plot');
const parsed=r=>r.kind==='matrix'?r.rows.map(row=>row.map(Number)):JSON.parse(r.text);
const last=s=>parsed(run(s).at(-1));
const probe=(s,expression)=>last(s+'\n'+expression);
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const mean=xs=>sum(xs)/xs.length;
const squares=xs=>sum(xs.map(x=>x*x));

// Tensor shape counts all positions, even zeros and repeated values. Indexing
// is table/row/column with one-based indices in the expression language.
for(const shape of [[1,2,3],[4,2,5],[2,3,4]]) {
 const s=source(7).replace('ones(2, 3, 4)',`zeros(${shape})`);
 assert.deepEqual(parsed(run(s)[0]),{shape,axes:3,entries:shape.reduce((a,b)=>a*b,1)});
}
for(let table=1;table<=2;table++)for(let row=1;row<=2;row++)for(let col=1;col<=2;col++) {
 assert.equal(parsed(run(source(7).replace('T[2, 1, 2]',`T[${table}, ${row}, ${col}]`))[1]),(table-1)*4+(row-1)*2+col);
}
assert.throws(()=>run(source(7).replace('T[2, 1, 2]','T[3, 1, 2]')),/index|range/i);

// Check rectangular multiplication with an independent triple loop; the
// inspected row-column dot product must still work when inner dimensions change.
for(const [A,B]of [
 [[[2,-1,0],[0,3,4]],[[1,2],[5,-2],[0,3]]],
 [[[1,2,3]],[[4],[5],[6]]],
 [[[1,0],[0,1]],[[3,-4,5],[6,7,-8]]]
]) {
 const literal=a=>JSON.stringify(a); // Preserve a single row as a 2-D matrix.
 const s=source(10).replace('[1, 2; 3, 4]',literal(A)).replace('[[5], [6]]',literal(B));
 const expected=A.map(row=>B[0].map((_,j)=>sum(row.map((v,k)=>v*B[k][j]))));
 const results=run(s);
 assert.deepEqual(parsed(results[0]),expected);
 near(parsed(results[1]),expected[0][0]);
 assert.deepEqual(parsed(results[2]),[[A.length],[B[0].length]]);
}
assert.throws(()=>run(source(10).replace('[[5], [6]]','[[5], [6], [7]]')),/dimension|size|length/i);

for(const [x,y]of [[[0,0],[0,0]],[[-3,4],[1,1]],[[1,2,3],[-1,5,9]]]) {
 const s=source(13).replace('x = [0, 0]; y = [3, 4];',`x=[${x}]; y=[${y}];`);
 const results=run(s),expected=y.map((v,i)=>(v-x[i])**2);
 assert.deepEqual(parsed(results[0]),expected.map(x=>[x]));
 near(parsed(results[1]),Math.sqrt(sum(expected)));
 near(parsed(results[2]),Math.sqrt(sum(expected)));
}
console.log('PASS: tensor shape/entry/index semantics, rectangular row-column products, and distance edits.');

// Check eigenpairs by multiplication, not by a particular normalization/sign.
for(const [A,expected]of [
 [[[2,1],[1,2]],[1,3]],[[[-2,0],[0,3]],[-2,3]],
 [[[4,0],[0,4]],[4,4]],[[[0,0],[0,0]],[0,0]]
]) {
 const s=source(103).replace('[2, 0; 0, 3]','['+A.map(row=>row.join(',')).join(';')+']');
 const solution=last(s);
 assert.deepEqual([...solution.values].sort((a,b)=>a-b),expected);
 for(const {value,vector:v}of solution.eigenvectors) {
  assert.ok(squares(v)>0);
  A.forEach((row,i)=>near(sum(row.map((x,j)=>x*v[j])),value*v[i],1e-8));
 }
}
assert.equal(parsed(run(source(103).replace('v = [1, 0]','v = [0, 0]'))[0]),'An eigenvector must be nonzero.');
assert.equal(parsed(run(source(103).replace('v = [1, 0]','v = [2, 0]'))[0]).mismatch,0);
assert.equal(parsed(run(source(103).replace('v = [1, 0]','v = [1, 1]'))[0]).mismatch,1);

// This is the lesson's diagonal SVD, not a claimed general decomposition.
// Its rank-at-most-one approximation must discard the smaller squared stretch,
// retain the correct axis and sign, and retain only one direction on a tie.
for(const d of [[3,1],[1,3],[-3,1],[1,-3],[-2,2],[0,4],[0,0]]) {
 const results=run(source(104).replace('d = [3, 1]',`d = [${d}]`));
 assert.deepEqual(parsed(results[2]).flat(),d.map(Math.abs).sort((a,b)=>b-a));
 const a1=parsed(results[3]);
 assert.ok(a1.flat().filter(x=>x!==0).length<=1);
 assert.equal(a1[0][1],0);assert.equal(a1[1][0],0);
 near((d[0]-a1[0][0])**2+(d[1]-a1[1][1])**2,Math.min(d[0]**2,d[1]**2));
 assert.deepEqual(parsed(results[4]),[[d[0]*2],[d[1]*5]]);
 assert.deepEqual(parsed(results[5]),[[a1[0][0]*2],[a1[1][1]*5]]);
}
console.log('PASS: eigenpair residuals, repeated/negative/zero eigenvalues, and diagonal SVD axis/sign/tie handling.');

for(const sides of [1,3,6,8,11]) {
 const results=run(source(14).replace('sides = 6',`sides = ${sides}`)).map(parsed);
 const p=Math.floor(sides/2)/sides;
 near(results[0],p);near(results[1],p*p);
}
assert.equal(parsed(run(source(14).replace('face % 2 == 0','face >= 1'))[0]),1);
for(const [outcomes,p]of [[[0,10],[.8,.2]],[[-4,2,8],[.25,.5,.25]],[[5,5],[0,1]]]) {
 const s=source(16).replace('outcomes = [0, 10]',`outcomes = [${outcomes}]`).replace('p = [0.5, 0.5]',`p = [${p}]`);
 const result=last(s),contributions=outcomes.map((x,i)=>x*p[i]);
 assert.deepEqual(result.contributions,contributions);near(result.expected,sum(contributions));
}
for(const p of [[.5,.6],[-.2,1.2],[0,0]])assert.match(last(source(16).replace('p = [0.5, 0.5]',`p = [${p}]`)),/nonnegative and add to 1/);
assert.throws(()=>run(source(16).replace('p = [0.5, 0.5]','p = [0.2, 0.3, 0.5]')),/dimension|size|length/i);
for(const values of [[2,6],[12,16],[4,12],[-2,2,6],[5,5,5]]) {
 const result=last(source(17).replace('values = [2, 6]',`values = [${values}]`));
 const mu=mean(values),v=mean(values.map(x=>(x-mu)**2));
 near(result.mean,mu);near(result.variance,v);near(result.standardDeviation,Math.sqrt(v));
}
for(const [x,y]of [[[1,3],[6,2]],[[1,3],[20,60]],[[11,13],[-5,-1]],[[1,2,3],[1,4,2]]]) {
 const result=last(source(102).replace('x = [1, 3]; y = [2, 6];',`x = [${x}]; y = [${y}];`));
 const dx=x.map(v=>v-mean(x)),dy=y.map(v=>v-mean(y));
 const cov=mean(dx.map((v,i)=>v*dy[i]));
 near(result.covariance,cov);
 near(result.correlation,cov/Math.sqrt(mean(dx.map(v=>v*v))*mean(dy.map(v=>v*v))));
}
assert.match(last(source(102).replace('x = [1, 3]','x = [2, 2]')).correlation,/Undefined/);
assert.match(last(source(102).replace('y = [2, 6]','y = [4, 4]')).correlation,/Undefined/);
console.log('PASS: exact probabilities, weighted expectations, invalid distributions, population variance, and covariance/correlation boundaries.');

// Check actual random draws and recompute their mean independently. Do not
// assume that a larger sample always brings an individual estimate closer.
const mc=source(106);
const draws=s=>probe(s,'draws').flat();
const shortRun=mc.replace('n = 1000','n = 24'),original=draws(shortRun);
assert.deepEqual(draws(shortRun),original,'The same seed reproduces all 24 draws');
assert.notDeepEqual(draws(shortRun.replace('"math2ai"','"different-seed"')),original);
for(const n of [1,10,1000]) {
 const s=mc.replace('n = 1000',`n = ${n}`),samples=draws(s),summary=last(s);
 // Probe through an object to avoid the deliberate 32-row display preview.
 const counts=probe(s,'isZero(v)=v==0; isTwo(v)=v==2; isFour(v)=v==4; isSix(v)=v==6; {zero: count(filter(draws, isZero)), two: count(filter(draws, isTwo)), four: count(filter(draws, isFour)), six: count(filter(draws, isSix))}');
 assert.equal(sum(Object.values(counts)),n);
 near(summary.estimate,(2*counts.two+4*counts.four+6*counts.six)/n);
 assert.equal(summary.samples,n);assert.equal(summary.exact,3);
 assert.ok(samples.every(x=>[0,2,4,6].includes(x)));
}
assert.equal(last(mc.replace('outcomes = [0, 2, 4, 6]','outcomes = [7, 7]')).estimate,7);
// Broad deterministic sanity bounds catch wrong endpoint/index/mean handling.
const large=last(mc.replace('n = 1000','n = 50000'));
near(large.estimate,3,.025);
console.log('PASS: seeded Monte Carlo repeats, changed seed, draw support/counts, independent averages, and constant rewards.');

for(const [base,exponent]of [[2,0],[2,-3],[4,.5],[10,2],[.5,3]]) {
 const result=parsed(run(source(18).replace('base = 2; exponent = 3;',`base = ${base}; exponent = ${exponent};`))[0]);
 near(result.power,base**exponent);near(result.recoveredExponent,exponent);
}
for(const h of [1,.1,.01,.001,-.01]) {
 const result=parsed(run(source(19).replace('h = 0.01',`h = ${h}`))[0]);
 near(result.change,6*h+h*h);near(result.slope,6+h);
}
assert.equal(parsed(run(source(19).replace('h = 0.01','h = 0'))[0]),'Use a nonzero interval h.');
for(const [expression,x,expected]of [['x^3',2,12],['5*x+2',-2,5],['sin(x)',0,1],['x^2',-3,-6]]) {
 const s=source(19).replace('"x^2"',JSON.stringify(expression)).replace('x = 3;',`x = ${x};`);
 near(last(s),expected);
}
console.log('PASS: exponent/log inverses, finite-interval slopes from both sides, edited symbolic derivatives, and zero-interval guard.');
