import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const definitions=JSON.parse(read('playgrounds.json'));
const display=value=>Array.isArray(value)?{kind:'matrix',rows:value.map(v=>[String(v)]),note:''}:{kind:'text',text:String(value),note:''};
const success=value=>({ok:true,results:[display(value)]});
function boot({available=true,throws=false}={}) {
 const nodes=new Map(),workers=[],timeouts=new Map(),revoked=[],windowEvents={};let nextTimer=0;
 class Element {
  constructor(){this.children=[];this.handlers={};this.dataset={};this.attributes={};this.style={};this.value='';this.hidden=false;this.open=false;this.clientWidth=320;this.ownText='';}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;this.ownText='';}
  set textContent(v){this.ownText=v;this.children=[];}
  set innerHTML(v){throw Error('Calculation output must never be rendered as HTML');}
  get textContent(){return this.ownText+this.children.map(n=>n.textContent||'').join('');}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.handlers[k]=fn;}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 get('playground-data').textContent=JSON.stringify(definitions);
 for(const key of ['library','engine','worker'])get('playground-'+key).textContent='inert '+key;
 class TestWorker {
  constructor(url){if(throws)throw Error('blocked');this.url=url;this.terminated=false;workers.push(this);}
  postMessage(value){this.sent=value;}
  terminate(){this.terminated=true;}
 }
 let created=0;
 const context=vm.createContext({console,JSON,Map,Number,Math,Object,String,Blob,
  URL:{createObjectURL:()=>`blob:test-${++created}`,revokeObjectURL:url=>revoked.push(url)},
  Worker:available?TestWorker:undefined,
  document:{getElementById:get,createElement:()=>new Element(),createElementNS:()=>new Element(),createTextNode:v=>{const n=new Element();n.textContent=v;return n;}},
  setTimeout(fn,delay){const id=++nextTimer;timeouts.set(id,{fn,delay});return id;},clearTimeout:id=>timeouts.delete(id),
  addEventListener:(event,fn)=>windowEvents[event]=fn});
 context.window=context;
 Object.defineProperty(context,'localStorage',{get(){throw Error('Playground accessed answer storage');}});
 vm.runInContext(read('playground-plot.js'),context);
 vm.runInContext(read('playground.js'),context);
 return {get,workers,revoked,timeouts,windowEvents,api:context.math2aiPlayground,
  tick(delay){const match=[...timeouts.entries()].find(([,t])=>t.delay===delay);assert.ok(match,'Expected a '+delay+'ms timer');timeouts.delete(match[0]);match[1].fn();},
  enter(){get('explore-expression').handlers.keydown({key:'Enter',ctrlKey:true,preventDefault(){}});},
  input(text){get('explore-expression').value=text;get('explore-expression').handlers.input();},
  reply(worker,data){worker.onmessage({data});}};
}
const app=boot();
app.api.show(1);
assert.equal(app.workers.length,0,'Lessons without code never start a worker');
assert.equal(app.get('explore').hidden,true);
app.api.show(5);
assert.equal(app.workers.length,1,'The supplied example runs when its lesson opens');
assert.equal(app.get('explore').hidden,false);
assert.equal(app.workers[0].sent,definitions['5'].expression);
app.reply(app.workers[0],success([4,6]));
assert.equal(app.get('explore-result').textContent,'46','Only the numeric output, without a repeated expression or heading');
assert.equal(app.get('explore-status').textContent,'');
assert.equal(app.get('explore-result').hidden,false);
assert.equal(app.workers[0].terminated,true);
assert.equal(app.revoked.length,1);

app.input('x=[3,4]\n-1*x');
assert.equal(app.get('explore-result').textContent,'','Never leave an old result under edited code');
assert.equal(app.workers.length,1,'Wait for a pause in typing');
app.input('x=[3,4]\n-2*x');
assert.equal(app.timeouts.size,1,'Further typing replaces the pending calculation');
app.tick(300);
assert.equal(app.workers.length,2);
const stale=app.workers.at(-1);
app.api.show(5);
assert.equal(stale.terminated,false);
assert.equal(app.workers.length,2);
assert.equal(app.get('explore-expression').value,'x=[3,4]\n-2*x');

app.api.show(9);
assert.equal(stale.terminated,true);
assert.equal(app.workers.at(-1).sent,definitions['9'].expression);
app.reply(stale,success(999));
assert.equal(app.get('explore-result').textContent,'','Ignore a previous lesson response');
app.reply(app.workers.at(-1),success(23));
assert.equal(app.get('explore-result').textContent,'23');
app.api.show(5);
assert.equal(app.get('explore-expression').value,'x=[3,4]\n-2*x','Navigation keeps the edited code');
app.reply(app.workers.at(-1),success([-6,-8]));

app.input('1+');app.tick(300);
app.reply(app.workers.at(-1),{ok:false,error:'Unexpected end of expression.'});
assert.equal(app.get('explore-result').hidden,true);
assert.match(app.get('explore-status').textContent,/Unexpected/);
app.input('2+2');app.tick(300);
app.reply(app.workers.at(-1),success(4));
assert.equal(app.get('explore-result').textContent,'4');
assert.equal(app.get('explore-status').textContent,'');

app.input('2+3');app.enter();
assert.equal(app.timeouts.size,1,'Keyboard evaluation cancels debounce, leaving only the deadline');
const timed=app.workers.at(-1);app.tick(3500);
assert.equal(timed.terminated,true);
assert.match(app.get('explore-status').textContent,/too long/);
app.reply(timed,success(123));
assert.equal(app.get('explore-result').textContent,'','A late reply cannot overwrite the timeout');
app.input('2+4');app.tick(300);
app.workers.at(-1).onerror({preventDefault(){}});
assert.match(app.get('explore-status').textContent,/could not start/);

app.input('5+6');app.api.suspend();
assert.equal(app.timeouts.size,0,'Review cancels even an evaluation that has not started');
app.api.show(5);
assert.equal(app.workers.at(-1).sent,'5+6','Return from Review resumes the same code');
const beforeHide=app.workers.at(-1);
app.windowEvents.pagehide();
assert.equal(beforeHide.terminated,true);
app.reply(beforeHide,success(11));
assert.equal(app.get('explore-result').textContent,'');
const count=app.workers.length;
app.get('lesson-panel').hidden=true;app.windowEvents.pageshow({persisted:true});
assert.equal(app.workers.length,count,'Do not run a hidden lesson after restoring Review');
app.get('lesson-panel').hidden=false;app.windowEvents.pageshow({persisted:true});
assert.equal(app.workers.length,count+1,'Resume after a back/forward cache restoration');
app.reply(app.workers.at(-1),{ok:true,results:[display(11),display([1,2])]});
assert.equal(app.get('explore-result').children.length,2,'Additional calculations show their outputs in order');

app.input('sqrt(-1)');app.tick(300);
app.reply(app.workers.at(-1),success('i'));
assert.equal(app.get('explore-result').textContent,'i');
app.input('"<img src=x onerror=alert(1)>"');app.tick(300);
app.reply(app.workers.at(-1),success('"<img src=x onerror=alert(1)>"'));
assert.equal(app.get('explore-result').textContent,'"<img src=x onerror=alert(1)>"','Strings stay literal text');
app.input('[i,2 cm]');app.tick(300);
app.reply(app.workers.at(-1),success(['i','2 cm']));
assert.equal(app.get('explore-result').textContent,'i2 cm','Matrix cells accept formatted nonnumeric values');
app.input('ones(40)');app.tick(300);
const partial=display([1,1]);partial.note='Showing 2 of 40 entries.';
app.reply(app.workers.at(-1),{ok:true,results:[partial]});
assert.match(app.get('explore-result').textContent,/Showing 2 of 40/);
app.input('a=2;');app.tick(300);
app.reply(app.workers.at(-1),{ok:true,results:[]});
assert.equal(app.get('explore-result').textContent,'','Suppressed outputs remain empty');

app.input('');
assert.equal(app.timeouts.size,0,'Empty code waits quietly for input');
assert.equal(app.get('explore-status').textContent,'');
const beforeEmpty=app.workers.length;app.enter();
assert.equal(app.workers.length,beforeEmpty);
app.api.show(9);app.api.show(5);
assert.equal(app.get('explore-expression').value,'','Even an intentionally empty draft is preserved');
app.input('3+4');app.api.show(1);
assert.equal(app.timeouts.size,0,'Leaving a lesson cancels queued edits');
assert.equal(app.get('explore').hidden,true);
assert.equal(app.get('explore-result').textContent,'');
assert.equal(new Set(app.revoked).size,app.workers.length,'Every worker URL is revoked exactly once');
for(const options of [{available:false},{throws:true}]) {
 const fallback=boot(options);fallback.api.show(5);
 assert.match(fallback.get('explore-status').textContent,/unavailable/);
 assert.equal(fallback.timeouts.size,0);
 assert.equal(fallback.get('explore-result').attributes['aria-busy'],'false');
}
console.log('PASS: automatic results, debounce, rich text/matrices, literal strings, preview notes, drafts, stale replies, errors, timeout, Review/page restore, missing workers, and URL cleanup. No answer-storage access.');

const plotApp=boot();plotApp.api.show(19);
const plotResponse={ok:true,results:[{kind:'plot',series:[{label:'Curve',style:'line',points:[[0,0],[1,1],[2,4]]}],xLabel:'x',yLabel:'y',equal:false,note:''}]};
plotApp.reply(plotApp.workers.at(-1),plotResponse);
assert.match(plotApp.get('explore-result').textContent,/Curve/);
assert.equal(plotApp.get('explore-status').textContent,'');
plotApp.input('plot([1],[2])');
assert.equal(plotApp.get('explore-result').textContent,'','Editing removes the old plot immediately');
plotApp.tick(300);const pendingPlot=plotApp.workers.at(-1);plotApp.api.show(5);
plotApp.reply(pendingPlot,plotResponse);
assert.equal(plotApp.get('explore-result').textContent,'','Old plots cannot appear under a different concept');
plotApp.get('explore-reset').handlers.click();
assert.equal(plotApp.workers.at(-1).sent,definitions[5].expression,'Reset uses the original plotting code');
console.log('PASS: plot rendering through the controller, edit clearing, stale-plot rejection, and reset.');
