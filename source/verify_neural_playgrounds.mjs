// Numerical and conceptual checks for course lessons 55 through 69. Independent
// finite differences, loops and covariance identities check editable behavior.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const math=createRequire(import.meta.url)('./vendor/mathjs-15.2.0/math.js');
vm.runInThisContext(read('playground-engine.js'));
const defs=JSON.parse(read('playgrounds.json')),course=JSON.parse(read('dist/curriculum.json'));
const expectedIds=[38,39,40,36,115,116,43,44,105,45,46,47,117,48,49];
assert.deepEqual(course.concepts.filter(c=>expectedIds.includes(c.legacyId)).map(c=>c.legacyId),expectedIds);
for(const id of expectedIds)assert.ok(defs[id],`Missing ${id}`);
const source=id=>defs[id].expression;
const decode=r=>r.kind==='matrix'?r.rows.map(row=>row.map(Number)):r.text==='Infinity'?Infinity:JSON.parse(r.text);
const run=s=>globalThis.math2aiPlaygroundEvaluate(s,math.create(math.all)).results.filter(r=>r.kind!=='plot').map(decode);
const probe=(s,e)=>run(s+'\n'+e).at(-1);
const replace=(s,from,to)=>{assert.ok(s.includes(from),from);return s.replace(from,to);};
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const sum=xs=>xs.reduce((a,b)=>a+b,0),mean=xs=>sum(xs)/xs.length;
const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
const norm=x=>Math.sqrt(dot(x,x));
const mse=(a,b)=>mean(a.map((x,i)=>(x-b[i])**2));

for(const x of [-2,0,2])for(const w of [-1,1,3])for(const target of [-3,6]) {
 const s=replace(source(38),'x = 2; w = 1; target = 6;',`x=${x}; w=${w}; target=${target};`);
 const [forward,backward,step]=run(s),loss=weight=>(weight*x-target)**2,eps=1e-5;
 near(forward.loss,loss(w));near(forward.prediction,w*x);
 near(backward.gradient,(loss(w+eps)-loss(w-eps))/(2*eps),1e-7);
 near(step.newWeight,w-.1*backward.gradient);near(step.newLoss,loss(step.newWeight));
 assert.equal(probe(s,'w'),w,'The gradient calculation never overwrites the original weight');
}
assert.ok(run(replace(source(38),'rate = 0.1','rate = 1'))[2].newLoss>16,'Large steps can overshoot');

const inputs=[1,2,3,4],targets=[0,.5,2,3];
for(const batch of [[1],[2],[1,2],[2,1],[3,4],[1,2,3,4]])for(const rate of [0,.1]) {
 let s=replace(source(39),'batch = [1, 2]',`batch = [${batch}]`);
 s=replace(s,'rate = 0.1',`rate = ${rate}`);
 const [step,losses]=run(s),x=batch.map(i=>inputs[i-1]),y=batch.map(i=>targets[i-1]);
 const loss=w=>mse(x.map(v=>w*v),y),eps=1e-5;
 near(step.meanGradient,(loss(1+eps)-loss(1-eps))/(2*eps),1e-7);
 near(step.updatedWeight,1-rate*step.meanGradient);
 near(losses.before,loss(1));near(losses.after,loss(step.updatedWeight));
}
for(const [N,B,epochs]of [[0,20,3],[1,20,3],[20,20,3],[21,20,3],[103,20,3],[100,20,0]]) {
 const result=run(replace(source(40),'N = 100; B = 20; epochs = 3;',`N=${N}; B=${B}; epochs=${epochs};`))[0];
 const batches=[];for(let start=0;start<N;start+=B)batches.push(Math.min(B,N-start));
 assert.deepEqual(result,{stepsPerEpoch:batches.length,totalUpdates:batches.length*epochs,finalBatchSize:batches.at(-1)||0});
}
for(const [N,B,epochs]of [[-1,20,3],[100,0,3],[100,1.5,3],[100,20,-1]])assert.match(run(replace(source(40),'N = 100; B = 20; epochs = 3;',`N=${N}; B=${B}; epochs=${epochs};`))[0],/positive batch size/);
for(const x of [-2,0,.75,1,2,3]) {
 const [network,linear]=run(replace(source(36),'x = 2;',`x = ${x};`));
 const h1=Math.max(0,2*x-1),h2=Math.max(0,h1-1);
 assert.deepEqual(network,{hidden1:h1,hidden2:h2,output:3*h2});
 assert.equal(linear.withoutRelu,6*x-6);
}
console.log('PASS: backprop and mini-batch finite differences, step overshoot, partial/empty epochs, and hidden-layer activation gates.');

for(const [signal,kernel,stride,padding,bias]of [
 [[1,2,3],[1,-1],1,0,0],[[1,2,3,4],[1,-1],2,0,0],
 [[1,2,3],[1,-1],1,1,.5],[[2,-1,4,0,5],[1,2,-1],2,2,-3],
 [[2],[3],1,0,1]
]) {
 let s=replace(source(115),'signal = [1, 2, 3]; kernel = [1, -1];',`signal=[${signal}]; kernel=[${kernel}];`);
 s=replace(s,'bias = 0; stride = 1; padding = 0;',`bias=${bias}; stride=${stride}; padding=${padding};`);
 const padded=[...Array(padding).fill(0),...signal,...Array(padding).fill(0)],expected=[];
 for(let i=0;i+kernel.length<=padded.length;i+=stride)expected.push(dot(kernel,padded.slice(i,i+kernel.length))+bias);
 assert.deepEqual(run(s)[0].flat(),expected);
}
for(const edit of [['stride = 1','stride = 0'],['stride = 1','stride = -1'],['kernel = [1, -1]','kernel = [1,2,3,4]']])assert.match(run(replace(source(115),...edit))[0],/positive integer stride/);
assert.throws(()=>run(replace(source(115),'padding = 0','padding = -1')));

const hop=(h,edges)=>h.map((v,i)=>{const neighbors=h.filter((_,j)=>edges[i][j]===1);return v+(neighbors.length?mean(neighbors):0);});
for(const [h,edges]of [
 [[1,2,4],[[0,1,1],[1,0,0],[1,0,0]]],
 [[1,2,4],[[0,1,0],[1,0,1],[0,1,0]]],
 [[1,2,4],[[0,0,0],[0,0,0],[0,0,0]]],
 [[-1,3],[[0,1],[1,0]]],[[5],[[0]]]
]) {
 const s=replace(source(116),'h = [1, 2, 4]; edges = [0, 1, 1; 1, 0, 0; 1, 0, 0];',`h=[${h}]; edges=${JSON.stringify(edges)};`);
 const [first,second]=run(s),after=hop(h,edges);
 assert.deepEqual(first,{before:h,afterOneHop:after});assert.deepEqual(second.flat(),hop(after,edges));
}
console.log('PASS: shared CNN filters, stride/padding/bias and invalid settings; simultaneous graph hops and isolated nodes.');

const softmax=z=>{const e=z.map(v=>Math.exp(v-Math.max(...z)));return e.map(v=>v/sum(e));};
for(const logits of [[0,Math.log(3)],[1000,1001],[-1000,-1001],[3,3,3],[-2,0,3],[0]]) {
 const s=replace(source(43),'logits = [0, log(3)]',`logits = [${logits}]`);
 const p=probe(s,'p').flat(),expected=softmax(logits);
 p.forEach((v,i)=>near(v,expected[i]));near(sum(p),1);
 const shifted=probe(replace(source(43),'logits = [0, log(3)]',`logits = [${logits.map(v=>v+500)}]`),'p').flat();
 shifted.forEach((v,i)=>near(v,p[i]));
}
const distributions=[[[1,0],[.9,.1]],[[1,0],[1,0]],[[0,1],[1,0]],[[.5,.5],[.5,.5]],[[.25,.75],[.6,.4]],[[1,0],[1e-300,1]]];
for(const [q,p]of distributions) {
 const s=replace(source(44),'q = [1, 0]; p = [0.9, 0.1];',`q=[${q}]; p=[${p}];`);
 const expected=sum(q.map((v,i)=>v===0?0:-v*Math.log(p[i]))),actual=run(s)[0];
 if(!Number.isFinite(expected))assert.equal(actual,Infinity);else near(actual,expected,1e-6);
}
for(const [p,q]of [[[1,0],[.5,.5]],[[1,0],[1,0]],[[1,0],[0,1]],[[.2,.8],[.6,.4]],[[.6,.4],[.2,.8]]]) {
 const s=replace(source(105),'p = [1, 0]; q = [0.5, 0.5];',`p=[${p}]; q=[${q}];`);
 const expected=sum(p.map((v,i)=>v===0?0:v*Math.log(v/q[i]))),actual=run(s)[0];
 if(!Number.isFinite(expected))assert.equal(actual,Infinity);else near(actual,expected,1e-6);
 assert.equal(run(s)[1],0,'Equal distributions have zero KL, including zero entries');
}
for(const id of [44,105])for(const invalid of ['[-0.1,1.1]','[0.1,0.1]','[]','[0.2,0.3,0.5]']) {
 const from=id===44?'p = [0.9, 0.1]':'q = [0.5, 0.5]';
 const to=(id===44?'p':'q')+' = '+invalid;
 assert.match(run(replace(source(id),from,to))[0],/matching probability lists/);
}
console.log('PASS: stable softmax and shift invariance; cross-entropy/KL zero terms, infinite loss, soft targets, and invalid distributions.');

const hidden=run(replace(source(45),'data = [2, 4, 6]','data = [2, 10, 6]'));
assert.deepEqual(hidden[0],{visible:[2,6],target:10,prediction:5,squaredError:25});
assert.deepEqual(hidden[1],{baselinePrediction:4,squaredError:36},'Hidden target never enters the baseline prediction');
assert.deepEqual(run(replace(source(45),'hidden = 2','hidden = 1'))[0].visible,[4,6]);
const dog=run(replace(source(46),'query = "cat"','query = "dog"'));
assert.deepEqual(dog[0].flat(),[.9,.1]);near(dog[1].toDog,0);near(dog[1].toRock,Math.sqrt(1.62),1e-6);
for(const [x,y,expected]of [[[1,0],[0,2],0],[[1,0],[-2,0],-1],[[2,2],[10,10],1],[[1,2,3],[-3,2,1],2/7]]) {
 const s=replace(source(47),'x = [1, 0]; y = [2, 0];',`x=[${x}]; y=[${y}];`);
 near(run(s)[0].similarity,expected);
}
assert.match(run(replace(source(47),'x = [1, 0]','x = [0, 0]'))[0],/nonzero/);
for(const scores of [[Math.log(4),0],[0,0],[4,1],[-1000,-1001]]) {
 const r=run(replace(source(117),'scores = [log(4), 0]',`scores = [${scores}]`));
 const p=softmax(scores);
 near(r[0].positiveProbability,p[0],1e-6);near(r[0].loss,-Math.log(p[0]),1e-6);
 near(r[1].positiveProbability,p[1],1e-6);near(r[1].loss,-Math.log(p[1]),1e-6);
}
console.log('PASS: masked-target isolation, embedding lookup/distances, cosine invariances, and contrastive score comparisons.');

for(const data of [
 [[-1,-1],[1,1]],[[9,19],[11,21]],[[-2,0],[0,1],[2,-1]],
 [[-2,3],[0,3],[2,3]],[[5,5],[5,5]],[[1,0],[-1,0],[0,1],[0,-1]],
 [[-1,-2,-3],[1,2,3]]
]) {
 const s=replace(source(48),'data = [-1, -1; 1, 1]',`data = ${JSON.stringify(data)}`);
 const {u,C}=probe(s,'{u:u,C:C}'),n=data.length,d=data[0].length;
 const mu=Array.from({length:d},(_,j)=>mean(data.map(row=>row[j])));
 const centered=data.map(row=>row.map((v,j)=>v-mu[j]));
 const covariance=Array.from({length:d},(_,i)=>Array.from({length:d},(_,j)=>mean(centered.map(row=>row[i]*row[j]))));
 C.forEach((row,i)=>row.forEach((v,j)=>near(v,covariance[i][j])));
 near(norm(u),1);
 const lambda=mean(centered.map(row=>dot(row,u)**2));
 C.forEach((row,i)=>near(dot(row,u),lambda*u[i]));
 if(d===2)near(lambda,(C[0][0]+C[1][1]+Math.sqrt((C[0][0]-C[1][1])**2+4*C[0][1]**2))/2);
 const coordinates=run(s)[2].flat();
 coordinates.forEach((v,i)=>near(v,dot(centered[i],u),1e-6));
 // No other tested unit direction may preserve more variance.
 for(let i=0;i<d;i++)assert.ok(mean(centered.map(row=>row[i]**2))<=lambda+1e-8);
}
console.log('PASS: PCA centering, independent covariance, maximal variance, projection, shifted/constant/tied data, and 3-D inputs.');

// Independent row-by-row arithmetic checks the matrix-based training code.
const defaultData=[[-2,-4],[-1,-2],[1,2],[2,4]];
const aeSource=(data,encoder,decoder,steps=0,rate=.04)=>{
 let s=replace(source(49),'data = [-2, -4; -1, -2; 1, 2; 2, 4]',`data = ${JSON.stringify(data)}`);
 s=replace(s,'encoder = [1; 0]; decoder = [[1, 1]]',`encoder = ${JSON.stringify(encoder.map(v=>[v]))}; decoder = ${JSON.stringify([decoder])}`);
 s=replace(s,'steps = 40',`steps = ${steps}`);s=replace(s,'rate = 0.04',`rate = ${rate}`);
 return replace(s,'probe = [[3, 6]]',`probe = ${JSON.stringify([data[0]])}`);
};
const aeLoss=(data,e,d)=>mean(data.map(x=>mse(x,d.map(v=>v*dot(e,x)))));
function aeStep(data,e,d,rate){
 const ge=e.map(()=>0),gd=d.map(()=>0),factor=2/(data.length*d.length);
 for(const x of data){
  const z=dot(e,x),err=d.map((v,j)=>z*v-x[j]);
  e.forEach((v,i)=>{ge[i]+=factor*x[i]*dot(d,err);});
  d.forEach((v,j)=>{gd[j]+=factor*z*err[j];});
 }
 return [e.map((v,i)=>v-rate*ge[i]),d.map((v,j)=>v-rate*gd[j])];
}
for(const [data,e,d]of [
 [defaultData,[1,0],[1,1]],[[[-1,3],[2,1]],[.5,-.2],[2,-1]],
 [[[1,2,3],[-2,1,0]],[.1,.2,.3],[2,1,0]],[[[0,0],[0,0]],[1,0],[1,2]],
 [[[2,5]],[1,0],[1,2]]
]){
 const s=aeSource(data,e,d),r=run(s),eps=1e-5;
 near(r[0].initialMSE,aeLoss(data,e,d));
 const ge=r[1].encoderGradient.flat(),gd=r[1].decoderGradient.flat();
 for(const [weights,gradient,isEncoder]of [[e,ge,true],[d,gd,false]])weights.forEach((v,i)=>{
  const plus=[...weights],minus=[...weights];plus[i]+=eps;minus[i]-=eps;
  const estimate=isEncoder?(aeLoss(data,plus,d)-aeLoss(data,minus,d))/(2*eps):(aeLoss(data,e,plus)-aeLoss(data,e,minus))/(2*eps);
  near(gradient[i],estimate,1e-7);
 });
 for(const steps of [1,2,10]){
  let ee=[...e],dd=[...d];for(let k=0;k<steps;k++)[ee,dd]=aeStep(data,ee,dd,.004);
  const actual=probe(aeSource(data,e,d,steps,.004),'{e:encoder,d:decoder,L:loss()}');
  actual.e.flat().forEach((v,i)=>near(v,ee[i]));actual.d.flat().forEach((v,i)=>near(v,dd[i]));
  near(actual.L,aeLoss(data,ee,dd));
 }
}
const trained=run(source(49));
assert.ok(trained[2].trainedMSE<2e-9);near(trained[3].reconstruction[0][0],3,1e-4);near(trained[3].reconstruction[0][1],6,1e-4);
const first=run(aeSource(defaultData,[1,0],[1,1],1));near(first[2].trainedMSE,.465625);
const unchanged=run(aeSource(defaultData,[1,0],[1,1],40,0));near(unchanged[2].trainedMSE,1.25);
const unseen=run(replace(source(49),'probe = [[3, 6]]','probe = [[3, 1]]'));
assert.deepEqual(unseen[2],trained[2],'A held-out input must never affect learned weights');
assert.ok(mse(unseen[3].reconstruction[0],[3,1])>1,'One learned direction cannot preserve off-line inputs');
const reordered=run(aeSource([...defaultData].reverse(),[1,0],[1,1],40));
assert.deepEqual(reordered[2],trained[2],'Full-batch updates are independent of row order');
assert.ok(run(aeSource(defaultData,[1,0],[1,1],1,1))[2].trainedMSE>1.25,'An excessive learning rate can increase loss');
console.log('PASS: autoencoder dataset gradients by finite differences, independent repeated updates in 2-D/3-D, held-out isolation, row order, first-step arithmetic, zero/large learning rates and bottleneck limitations.');
