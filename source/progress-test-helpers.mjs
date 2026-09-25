import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {buildMath} from './build_math.mjs';
export const root = new URL('.',import.meta.url);
export const course = JSON.parse(fs.readFileSync(new URL('dist/curriculum.json',root),'utf8'));
const mathData = JSON.stringify(buildMath(course).data);
export const flush = async () => { for (let i=0;i<12;i++) await new Promise(r=>setTimeout(r,1)); };
export function hub(storage=new Map()) {
 const clients=[],queues=new Map();
 const locks={request(name,fn){const next=(queues.get(name)||Promise.resolve()).then(fn);queues.set(name,next.catch(()=>{}));return next;}};
 return {storage,paused:false,clients,locks,
  connect(dispatch,{readBlocked=false,writeBlocked=false}={}) {
   const client={dispatch};clients.push(client);
   const changed=(key,newValue,oldValue)=>{if(newValue!==oldValue&&!this.paused)for(const c of clients)if(c!==client)queueMicrotask(()=>c.dispatch('storage',{key,newValue,oldValue}));};
   return {get length(){return storage.size;},key:i=>[...storage.keys()][i]??null,
    getItem(k){if(readBlocked)throw Error('blocked');return storage.get(k)??null;},
    setItem(k,v){if(writeBlocked)throw Error('blocked');v=String(v);const old=storage.get(k)??null;storage.set(k,v);changed(k,v,old);},
    removeItem(k){if(writeBlocked)throw Error('blocked');const old=storage.get(k)??null;storage.delete(k);changed(k,null,old);}};
  }
 };
}
export function bootBrowser({shared=hub(),configured=false,hash='',readBlocked=false,writeBlocked=false,confirm=true,seed=7,now,learning=false}={}) {
 const elements=new Map(),events={},timers=new Set();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',hidden:false,disabled:false,value:'',handlers:{},attributes:{},
   setAttribute(k,v){this.attributes[k]=v;},classList:{toggle(){}},focus(){},contains(){return false;},querySelectorAll(){return [];},addEventListener(k,fn){this.handlers[k]=fn;},querySelector(){return {focus(){}};}});
  return elements.get(id);
 };
 const emit=(name,event={})=>{for(const fn of events[name]||[])fn(event);};
 const on=(name,fn)=>(events[name]||=[]).push(fn);
 get('course-data').textContent=JSON.stringify(course);
 get('math-data').textContent=mathData;
 get('auth-config').textContent=JSON.stringify(configured?{supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_test'}:{supabaseUrl:'',publishableKey:''});
 const location={hash};const math=Object.create(Math);
 const entries=[{state:null,hash}],clone=v=>v==null?null:JSON.parse(JSON.stringify(v));let position=0;
 const history={
  get state(){return clone(entries[position].state);},get length(){return entries.length;},scrollRestoration:'auto',
  replaceState(state,_title,url){entries[position]={state:clone(state),hash:url};location.hash=url;},
  pushState(state,_title,url){entries.splice(++position,entries.length,{state:clone(state),hash:url});location.hash=url;},
  go(step){const next=position+step;if(next<0||next>=entries.length)return;const old=location.hash;position=next;location.hash=entries[position].hash;emit('popstate',{state:history.state});if(old!==location.hash)emit('hashchange');}
 };
 math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 const clock=now===undefined ? Date : class extends Date {static now(){return now;}};
 const context=vm.createContext({URL,JSON,Math:math,Date:clock,crypto:webcrypto,navigator:{locks:shared.locks},
  localStorage:shared.connect(emit,{readBlocked,writeBlocked}),location,
  document:{getElementById:get,querySelector:()=>get('skip'),title:'',visibilityState:'visible',addEventListener:on},
  history,
  setTimeout(fn,ms){const id=setTimeout(fn,ms);id.unref();timers.add(id);return id;},clearTimeout,
  setInterval(){return 0;},clearInterval,queueMicrotask,
  scrollY:0,scrollTo({top}){context.scrollY=top;},confirm:()=>confirm,addEventListener:on,console});
 context.window=context;
 vm.runInContext(fs.readFileSync(new URL('math-display.js',root),'utf8'),context);
 if(learning)vm.runInContext(fs.readFileSync(new URL('learning.js',root),'utf8'),context);
 vm.runInContext(fs.readFileSync(new URL('progress.js',root),'utf8'),context);
 vm.runInContext(fs.readFileSync(new URL('site.js',root),'utf8'),context);
 const app={get,shared,storage:shared.storage,events,emit,history,math:context.math2aiMath,engine:context.math2aiProgress,learning:context.math2aiLearning,
  state:()=>JSON.parse(JSON.stringify(context.math2aiProgress.load())),
  current:()=>course.concepts.find(c=>c.title===get('title').textContent),
  question:()=> (get('review-panel').hidden ? app.current() : course.concepts.find(c=>c.title===get('review-concept').textContent))?.questions.find(q=>q.question===get('question').textContent),
  review(){app.hash('#review');},back(){app.hash(get('review-back').href);},
  startReview(){get('review-start').onclick();},changeTopics(){get('review-change').onclick();},
  selectTopic(id,checked=true){get('review-topics').handlers.change({target:{name:'review-topic',value:String(id),checked}});},
  clearTopics(){get('review-clear').onclick();},suggestTopics(){get('review-suggested').onclick();},
  searchReview(value){get('review-search').handlers.input({target:{value}});},
  filterReview(value){get('review-filter').onchange({target:{value}});},
  selectChapter(index){get('review-topics').handlers.click({target:{closest:()=>({dataset:{chapter:String(index)}})}});},
  draft(index){get('choices').handlers.change({target:{name:'answer',value:String(index)}});},
  scroll:top=>{context.scrollY=top;emit('scroll');},scrollPosition:()=>context.scrollY,
  followConcept(id,modifiers={}){let prevented=false;get('lesson-panel').handlers.click({target:{closest:()=>({dataset:{conceptId:String(id)}})},button:0,...modifiers,preventDefault(){prevented=true;}});return prevented;},
  browserBack:()=>history.go(-1),browserForward:()=>history.go(1),
  answer(index){get('choices').handlers.change({target:{name:'answer',value:String(index)}});get('quiz-form').handlers.submit({preventDefault(){}});},
  correct(){app.answer(app.question().correct);},wrong(){app.answer((app.question().correct+1)%4);},
  another(){get('another').onclick();},previousQuestion(){get('previous-question').onclick();},retry(){get('retry').onclick();},resetQuestion(){get('reset-question').onclick();},next(){get('next').onclick();},
  go(index){get('concept-select').onchange({target:{value:String(index)}});},
  hash(value){history.pushState(null,'',value);emit('hashchange');},reset:()=>get('reset').onclick(),
  signin(server,user){const client=server.client(user);context.math2aiProgress.setSession(client,{user:{id:user},access_token:'test-token'});},
  signout(){context.math2aiProgress.setSession(null,null);},
  close(){for(const id of timers)clearTimeout(id);}
 };
 return app;
}
export class Server {
 constructor(){this.rows=new Map();this.listeners=[];this.calls=[];this.offline=false;this.nextGate=null;this.loseReply=false;}
 holdNext(){let release;const wait=new Promise(r=>release=r);this.nextGate=wait;return release;}
 data(user,version){const key=user+':'+version;if(!this.rows.has(key))this.rows.set(key,{epoch:0,revision:0,answers:{},operations:new Set()});return this.rows.get(key);}
 snapshot(row){return JSON.parse(JSON.stringify({epoch:row.epoch,revision:row.revision,answers:row.answers}));}
 client(user){
  const server=this;
  return {realtime:{async setAuth(){}},removeChannel(channel){channel.active=false;return Promise.resolve();},
   channel(){const channel={active:true,on(_kind,_config,fn){this.fn=fn;return this;},subscribe(fn){server.listeners.push({user,channel});queueMicrotask(()=>fn('SUBSCRIBED'));return this;}};return channel;},
   async rpc(name,args){
    server.calls.push({user,name,args});
    const gate=server.nextGate;server.nextGate=null;if(gate)await gate;
    if(server.offline || (server.failWrites && args.p_attempts?.length))return {error:{message:'offline'}};
    if(args.p_user_id!==user)return {error:{code:'42501'}};
    const row=server.data(user,args.p_course_version);let changed=false;
    if(name==='math2ai_reset'){
     if(!row.operations.has(args.p_request_id)){row.operations.add(args.p_request_id);row.epoch++;row.revision++;row.answers={};changed=true;}
    } else if(name==='math2ai_sync') {
     if(args.p_epoch===row.epoch)for(const op of args.p_attempts){
      if(row.operations.has(op.id))continue;row.operations.add(op.id);
      const a=row.answers[op.question_id];row.answers[op.question_id]={first:a?a.first:op.answer,last:op.answer,attempts:(a?.attempts||0)+1,choices:(a?.choices||0)|(1<<op.answer)};changed=true;
     }
     if(changed)row.revision++;
    } else throw Error('Unexpected RPC '+name);
    const data=server.snapshot(row);
    if(changed)for(const {user:other,channel} of server.listeners)if(user===other&&channel.active)queueMicrotask(()=>channel.fn({new:{course_version:args.p_course_version}}));
    if(server.loseReply){server.loseReply=false;return {error:{message:'reply lost after commit'}};}
    return {data,error:null};
   }
  };
 }
}
