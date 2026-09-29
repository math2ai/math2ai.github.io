import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const math=createRequire(import.meta.url)('./vendor/mathjs-15.2.0/math.js');
vm.runInThisContext(read('playground-engine.js'));
const run=s=>globalThis.math2aiPlaygroundEvaluate(s,math.create(math.all)).results;
const chart=s=>run(s).find(r=>r.kind==='plot');
const defs=JSON.parse(read('playgrounds.json'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const ids=[5,17,19,30,102,38,39,36,43,44,48,49,150,149,154,155,151,160];
assert.deepEqual(Object.entries(defs).filter(([,d])=>d.plots).map(([id])=>Number(id)).sort((a,b)=>a-b),ids.toSorted((a,b)=>a-b));
for(const id of ids) {
 const c=chart(defs[id].expression);
 assert.ok(c&&c.xLabel&&c.yLabel,`Lesson ${id} has labeled axes`);
 assert.ok(c.series.every(s=>s.points.length&&s.label));
}
const basic=chart('plot([1,2], [3,4], {label:"Data", xLabel:"Time", yLabel:"Distance"})');
assert.deepEqual(basic.series,[{label:'Data',style:'line',points:[[1,3],[2,4]]}]);
assert.equal(basic.xLabel,'Time');assert.equal(basic.yLabel,'Distance');
assert.equal(chart('plot([1,2],[0,1],{style:"bar"})').series[0].style,'bar');
assert.equal(chart('plot([{x:[0,1], y:[0,1]}, {x:[2], y:[3], style:"points"}])').series.length,2);
assert.equal(run('plot([1],[2]);').length,0,'A semicolon suppresses a plot like other outputs');
assert.equal(run('{plot:true}')[0].kind,'text','Objects cannot impersonate a plot token');
assert.deepEqual(chart('x=[1,2]; p=plot(x,x); x[1]=99; p').series[0].points,[[1,1],[2,2]],'Plots snapshot values at the call');
for(const s of ['plot([],[])','plot([1],[1,2])','plot([1,i],[1,2])',
 'plot([1 cm],[2])','plot([Infinity],[1])','plot([1],[1e101])','plot([1],[2],{style:"html"})',
 'plot([1,2],[NaN,Infinity])','plot(1:1001,1:1001)',
 'plot([{x:[1],y:[1]},{x:[1],y:[1]},{x:[1],y:[1]},{x:[1],y:[1]},{x:[1],y:[1]},{x:[1],y:[1]},{x:[1],y:[1]}])',
 Array(7).fill('plot([1],[2])').join('\n')])assert.throws(()=>run(s),/plot/i,s);
assert.throws(()=>run('plot.constructor'),/access|property/i);
const gap=chart('plot([0,1,2],[1,1/0,3])');
assert.deepEqual(gap.series[0].points,[[0,1],[1,null],[2,3]]);assert.match(gap.note,/gaps/);

// Check the actual plotted numbers using independent equations, not screenshots.
const derivative=chart(defs[19].expression);
for(const [x,y]of derivative.series[0].points)near(y,x*x);
for(const [x,y]of derivative.series[1].points)near(y,9+6*(x-3));
const moved=chart(defs[19].expression.replace('x = 3;','x = -2;'));
for(const [x,y]of moved.series[1].points)near(y,4-4*(x+2));
const regression=chart(defs[30].expression);
assert.deepEqual(regression.series[0].points,[[1,6],[3,7],[5,14]]);
assert.deepEqual(regression.series[1].points,[[1,4],[5,12]]);
assert.deepEqual(regression.series[2].points,[[1,5],[5,13]]);
const fares=chart(defs[30].expression.replace('y = [6, 7, 14]','y = [6, 7, 17]'));
assert.deepEqual(fares.series[2].points,[[1,4.5],[5,15.5]]);
for(const [id,loss]of [[38,w=>(2*w-6)**2],[39,w=>(w*w+(2*w-.5)**2)/2]]) {
 const c=chart(defs[id].expression);
 for(const [x,y]of c.series[0].points)near(y,loss(x));
 for(const s of c.series.slice(1))for(const [x,y]of s.points)near(y,loss(x));
}
const batch=chart(defs[39].expression.replace('batch = [1, 2]','batch = [1]'));
for(const [x,y]of batch.series[0].points)near(y,x*x);
const network=chart(defs[36].expression);
for(const [x,y]of network.series[0].points)near(y,3*Math.max(0,Math.max(0,2*x-1)-1));
for(const [x,y]of network.series[1].points)near(y,6*x-6);
chart(defs[43].expression).series[0].points.forEach(([x,y],i)=>{assert.equal(x,i+1);near(y,[.25,.75][i]);});
assert.deepEqual(chart(defs[43].expression.replace('[0, log(3)]','[0, 0, 0]')).series[0].points,[[1,1/3],[2,1/3],[3,1/3]]);
for(const [p,loss]of chart(defs[44].expression).series[0].points)near(loss,-Math.log(p));
const pcaSource=defs[48].expression.replace('[-1, -1; 1, 1]','[-2, -1; 0, 1; 2, 0]');
const pca=chart(pcaSource),dir=pca.series[1].points[1],length=Math.hypot(...dir),u=dir.map(v=>v/length);
pca.series[0].points.forEach(([x,y],i)=>{
 const projection=pca.series[2].points[i],dot=x*u[0]+y*u[1];
 near(projection[0],dot*u[0]);near(projection[1],dot*u[1]);
 near((x-projection[0])*u[0]+(y-projection[1])*u[1],0);
});
assert.equal(pca.equal,true,'Geometric plots need equal units on both axes');
const autoPlots=run(defs[49].expression).filter(r=>r.kind==='plot');
assert.equal(autoPlots.length,2);
assert.equal(autoPlots[0].series[0].points.length,41);
near(autoPlots[0].series[0].points[0][1],1.25);near(autoPlots[0].series[0].points[1][1],.465625);
assert.ok(autoPlots[0].series[0].points.at(-1)[1]<2e-9);
const auto=autoPlots[1];
assert.deepEqual(auto.series[0].points,[[-2,-4],[-1,-2],[1,2],[2,4]]);
assert.deepEqual(auto.series[1].points,[[-2,-2],[-1,-1],[1,1],[2,2]]);
assert.equal(auto.equal,true);
auto.series[2].points.forEach(([x,y],i)=>{
 assert.ok(Math.hypot(x-auto.series[0].points[i][0],y-auto.series[0].points[i][1])<.0001);
});
console.log('PASS: plot API, limits, numeric/type errors, snapshot/suppression semantics, gaps, and independently checked example data/edits.');

// Test SVG geometry, accessible labels, literal text, and no nonfinite paths.
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={};this.textContent='';}
 setAttribute(k,v){this.attrs[k]=v;}
 append(...v){this.children.push(...v);}
 set innerHTML(v){throw Error('Never render expression values as HTML');}
}
const doc={createElement:t=>new Element(t),createElementNS:(ns,t)=>new Element(t),createTextNode:t=>{const e=new Element('#text');e.textContent=t;return e;}};
const context=vm.createContext({document:doc,window:{}});vm.runInContext(read('playground-plot.js'),context);
const render=c=>{const e=new Element('output');context.window.math2aiRenderPlot(c,e);return e;};
const walk=e=>[e,...e.children.flatMap(walk)];
for(const c of [basic,gap,pca,...ids.map(id=>chart(defs[id].expression)),
 chart('plot([1],[2])'),chart('plot([-1e99,1e99],[-1e99,1e99])'),chart('plot([0,0],[0,0],{equal:true})'),
 chart('plot([1,2],[0,0],{style:"bar"})'),chart('plot([1,2],[-2,-1],{style:"bar"})')]) {
 const tree=walk(render(c));
 assert.ok(tree.some(n=>n.tag==='svg'&&n.attrs.role==='img'));
 assert.ok(tree.some(n=>n.tag==='desc'&&n.textContent.includes('points')));
 for(const n of tree)for(const [key,value]of Object.entries(n.attrs))
  if(['x','y','x1','x2','y1','y2','cx','cy','d'].includes(key))assert.doesNotMatch(value,/NaN|Infinity/);
}
const paths=walk(render(gap)).filter(n=>n.tag==='path');
assert.equal((paths[0].attrs.d.match(/M/g)||[]).length,2,'A gap starts another path rather than drawing across it');
const equal=walk(render(chart('plot([0,1,0],[0,0,1],{equal:true,style:"points"})'))).filter(n=>n.tag==='circle');
near(Number(equal[1].attrs.cx)-Number(equal[0].attrs.cx),Number(equal[0].attrs.cy)-Number(equal[2].attrs.cy));
const malicious='<img src=x onerror=alert(1)>';
const literal=walk(render(chart(`plot([1],[2], {label:${JSON.stringify(malicious)}})`)));
assert.ok(literal.some(n=>n.textContent.includes(malicious)));assert.ok(literal.every(n=>n.tag!=='img'));
const bars=walk(render(chart('plot([1,2],[.25,.75],{style:"bar"})')));
assert.ok(bars.some(n=>n.tag==='text'&&n.textContent==='1'));assert.ok(bars.some(n=>n.tag==='text'&&n.textContent==='2'));
console.log('PASS: SVG finite geometry, gaps, equal aspect, accessible descriptions, discrete labels, and safe literal labels.');
