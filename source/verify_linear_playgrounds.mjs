// Independent geometry, basis reconstruction, rank and truncation checks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const read=n=>fs.readFileSync(new URL(n,import.meta.url),'utf8');
const m=createRequire(import.meta.url)('./vendor/mathjs-15.2.0/math.js');
vm.runInThisContext(read('playground-engine.js'));
const defs=JSON.parse(read('playgrounds.json'));
const run=(id,from,to)=>globalThis.math2aiPlaygroundEvaluate(from?defs[id].expression.replace(from,to):defs[id].expression,m.create(m.all)).results;
const decode=r=>r.kind==='matrix'?r.rows.map(row=>row.map(Number)):JSON.parse(r.text);
const first=(...args)=>decode(run(...args).find(r=>r.kind!=='plot'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
for(const v of [[-6,8],[1,0],[0,-2],[.3,.4],[0,0]]) {
 const r=first(149,'v = [3, 4]',`v = [${v}]`);
 if(v.every(x=>x===0)){assert.match(r,/no unit direction/);continue;}
 near(r.length,Math.hypot(...v));near(Math.hypot(...r.unit),1);
 v.forEach((x,i)=>near(r.unit[i]*r.length,x));
}
for(const [a,b]of [[-2,3],[0,0],[.5,-2],[3,1]]) {
 const r=run(150,'a = 2; b = 3;',`a = ${a}; b = ${b};`);
 const result=decode(r[0]).flat();assert.deepEqual(result,[a+b,2*b]);
 assert.deepEqual(r.find(r=>r.kind==='plot').series[1].points.at(-1),result);
}
for(const x of [[2,-3],[0,0],[-4,2],[1,5]])for(const u of [[1,0],[1,2],[-2,-4]]) {
 const r=first(155,'x = [3, 1]; u = [1, 1];',`x = [${x}]; u = [${u}];`);
 near(dot(r.residual,u),0);
 x.forEach((v,i)=>near(r.projection[i]+r.residual[i],v));
 const error=dot(r.residual,r.residual);
 for(const shift of [-2,-.1,0,.1,2]) {
  const d=x.map((v,i)=>v-(r.coefficient+shift)*u[i]);
  assert.ok(dot(d,d)>=error-1e-9,'Projection minimizes distance along this line');
 }
}
assert.match(first(155,'u = [1, 1]','u = [0, 0]'),/nonzero/);
assert.equal(run(155,'u = [1, 1]','u = [0, 0]').filter(r=>r.kind==='plot').length,0);
const line=run(151).find(r=>r.kind==='plot');
for(const [x,y]of line.series[0].points)assert.equal(y,2*x);
const plane=run(151,'v = [2, 4]','v = [0, 1]').find(r=>r.kind==='plot');
assert.equal(new Set(plane.series[0].points.map(p=>JSON.stringify(p))).size,25);
assert.ok(plane.series[0].points.some(([x,y])=>y!==2*x));
for(const c of [[0,0],[-2,3],[.5,-.5]]) {
 const r=run(153,'c = [3, 1]',`c = [${c}]`).map(decode);
 assert.deepEqual(r[0].flat(),[c[0]+c[1],c[0]-c[1]]);
 assert.deepEqual(r[1].flat(),c);assert.deepEqual(r[2].flat(),[0,0]);
}
for(const b of [[0,0],[-2,4],[10,2]]) {
 const r=run(156,'b = [5, 1]',`b = [${b}]`).map(decode),x=r[0].flat();
 near(x[0]+x[1],b[0]);near(x[0]-x[1],b[1]);
 assert.deepEqual(r[1].residual,[[0],[0]]);
}
// Dependency proof in three stored coordinates; rank check uses a distinct
// column proportionality calculation, not the source's opposite-corner rule.
assert.deepEqual(first(152),[[0],[0]]);
for(const [a,rank]of [[[[0,0],[0,0]],0],[[[0,2],[0,4]],1],[[[1,2],[2,5]],2],[[[-1,2],[2,-4]],1],[[[1,0],[0,1]],2]]) {
 const r=first(159,'A = [1, 2; 2, 4]',`A = [${a[0]};${a[1]}]`);assert.equal(r.rank,rank);
}
for(const s of [[6,2],[1,7],[4,4],[0,0],[0,2],[3,0]]) {
 const r=run(160,'s = [6, 2]',`s = [${s}]`),obj=decode(r[0]);
 const a=obj.approximation,original=[[s[0],0],[0,s[1]]];
 const error=original.reduce((sum,row,i)=>sum+row.reduce((t,v,j)=>t+(v-a[i][j])**2,0),0);
 near(obj.squaredError,error);near(error,Math.min(...s)**2);
 assert.ok(a[0][0]===0||a[1][1]===0,'at most one independent direction');
 assert.deepEqual(r.find(r=>r.kind==='plot').series[0].points,[[0,s[0]**2+s[1]**2],[1,error],[2,0]]);
}
assert.match(first(160,'s = [6, 2]','s = [-6, 2]'),/nonnegative/);
console.log('PASS: edited vector geometry, zero guards, sampled spans, coordinate recovery, equation substitution, rank boundaries and truncation error plots.');
