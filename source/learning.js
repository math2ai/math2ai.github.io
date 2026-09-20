// Personal choices have their own journal. They never write to quiz progress.
(() => {
 'use strict';
 const course=JSON.parse(document.getElementById('course-data').textContent);
 const config=JSON.parse(document.getElementById('auth-config').textContent);
 const ids=new Set(course.concepts.map(c=>String(c.legacyId)));
 const prefix='math2ai-learning-v1:'+(config.supabaseUrl || 'offline')+':'+course.version+':';
 const listeners=new Set(),memory=new Map();
 const uuid=()=>crypto.randomUUID(),empty=()=>({revision:0,fields:{}});
 let current=null,storageOK=true;
 const parse=raw=>{try{return JSON.parse(raw);}catch{return null;}};
 function read(key){if(memory.has(key))return memory.get(key);try{return localStorage.getItem(key);}catch{storageOK=false;return null;}}
 function write(key,value){try{localStorage.setItem(key,value);memory.delete(key);}catch{storageOK=false;memory.set(key,value);}}
 function remove(key){try{localStorage.removeItem(key);memory.delete(key);}catch{storageOK=false;memory.set(key,null);}}
 function keys(start){const all=new Set([...memory.keys()].filter(k=>k.startsWith(start)));try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(start))all.add(k);}}catch{storageOK=false;}return [...all];}
 const keyFor=(owner,suffix)=>prefix+owner+':'+suffix;
 const valid=(key,value)=>key.startsWith('concept:')&&ids.has(key.slice(8))&&['none','revisit','done'].includes(value);
 // Legacy preview 'done' records mean an unmarked concept. Keep their revision/operation
 // identity so a later bookmark can still sync and old queued removals remain effective.
 const bookmarkValue=value=>value==='done'?'none':value;
 const validOp=op=>op&&typeof op.id==='string'&&typeof op.key==='string'&&valid(op.key,op.value)&&Number.isSafeInteger(op.base)&&op.base>=0&&Number.isFinite(op.time);
 const journal=owner=>keys(keyFor(owner,'op:')).map(k=>parse(read(k))).filter(validOp);
 const transfers=()=>keys(prefix+'transfer:').map(k=>parse(read(k))).filter(t=>t&&typeof t.id==='string'&&typeof t.owner==='string'&&Array.isArray(t.sources)&&Array.isArray(t.operations));
 function guestOperations(){const claimed=new Set(transfers().flatMap(t=>t.sources));return journal('guest').filter(op=>!claimed.has(op.id));}
 function pending(ctx){return (ctx.user?[...journal(ctx.owner),...transfers().filter(t=>t.owner===ctx.owner).flatMap(t=>t.operations.filter(validOp))]:guestOperations()).sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));}
 function validated(value){
  if(!value||!Number.isSafeInteger(value.revision)||value.revision<0||!value.fields||Array.isArray(value.fields)||typeof value.fields!=='object')return null;
  const fields={};
  for(const [key,entry]of Object.entries(value.fields))if(entry&&valid(key,entry.value)&&Number.isSafeInteger(entry.revision)&&entry.revision>0&&entry.revision<=value.revision&&typeof entry.operation_id==='string')fields[key]={...entry};
  return {revision:value.revision,fields};
 }
 function cached(ctx){return validated(parse(read(keyFor(ctx.owner,'snapshot'))));}
 function snapshot(ctx,data){
  const value=validated(data);if(!value)throw Error('Invalid learning choices response');
  const stored=cached(ctx),best=stored&&stored.revision>value.revision?stored:value;
  if(ctx.snapshot.revision>best.revision)return;
  ctx.snapshot=best;write(keyFor(ctx.owner,'snapshot'),JSON.stringify(best));
 }
 function choices(ctx=current){
  const values={};if(!ctx)return values;
  for(const [key,entry]of Object.entries(ctx.snapshot.fields))values[key]=bookmarkValue(entry.value);
  for(const op of pending(ctx))values[op.key]=bookmarkValue(op.value);
  return values;
 }
 function status(){return {owner:current?.owner||'loading',ready:!!current,account:!!current?.user,values:choices(),message:!storageOK?(current?.user?'Personal choices cannot be saved in this browser. Keep this page open until account syncing finishes.':'Personal choices cannot be saved in this browser. They will be lost when this page closes.'):current?.message||'',conflict:current?.conflict||''};}
 function notify(){for(const fn of listeners)fn(status());}
 async function claimGuest(ctx){
  const run=()=>{
   if(current!==ctx)return;
   const operations=guestOperations();if(!operations.length)return;
   const latest=new Map(operations.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id)).map(op=>[op.key,op]));
   const transfer={id:uuid(),owner:ctx.owner,sources:operations.map(op=>op.id),operations:[...latest.values()].map(op=>({...op,base:0,parent:null}))};
   // A single durable claim hides these choices from guests and makes account retries recoverable.
   write(prefix+'transfer:'+transfer.id,JSON.stringify(transfer));notify();
  };
  if(navigator.locks?.request)await navigator.locks.request(prefix+'guest-claim',run);else run();
 }
 function acknowledge(ctx,ids){
  for(const id of ids)remove(keyFor(ctx.owner,'op:'+id));
  for(const transfer of transfers())if(transfer.owner===ctx.owner){
   transfer.operations=transfer.operations.filter(op=>validOp(op)&&!ids.has(op.id));
   if(transfer.operations.length)write(prefix+'transfer:'+transfer.id,JSON.stringify(transfer));
   else {for(const id of transfer.sources)remove(keyFor('guest','op:'+id));remove(prefix+'transfer:'+transfer.id);}
  }
 }
 async function sync(ctx=current){
  if(!ctx?.user||current!==ctx)return;
  if(ctx.running){ctx.again=true;return;}
  ctx.running=true;
  try{
   do{
    ctx.again=false;
    const batch=pending(ctx).slice(0,100);
    const {data,error}=await ctx.client.rpc('math2ai_learning_sync',{p_user_id:ctx.user,p_course_version:course.version,p_changes:batch.map(({id,key,value,base,parent})=>({id,key,value:bookmarkValue(value),base,parent:parent||null}))});
    if(current!==ctx)return;
    if(error)throw error;
    snapshot(ctx,data);
    if(!Array.isArray(data.accepted)||!Array.isArray(data.conflicts))throw Error('Missing learning choices acknowledgement');
    const acknowledged=new Set([...data.accepted,...data.conflicts]);
    if(batch.some(op=>!acknowledged.has(op.id)))throw Error('Incomplete learning choices acknowledgement');
    if(data.conflicts.length)ctx.conflict='A saved choice from another device was kept. You can change it again here.';
    acknowledge(ctx,acknowledged);ctx.message='';notify();
   }while(current===ctx&&(ctx.again||pending(ctx).length));
  }catch(error){if(current===ctx){ctx.message=['PGRST202','42P01','42883'].includes(error?.code)?'Personal choices are saved on this device. Account syncing is not available yet.':'Personal choices are saved on this device. Waiting to sync.';notify();}}
  finally{ctx.running=false;}
 }
 function setSession(client,session){
  const user=session?.user?.id||null,owner=user?'user:'+user:'guest';
  if(current?.owner===owner){if(user)setTimeout(()=>{if(current?.owner===owner)void sync();},0);return;}
  const old=current,ctx=current={owner,user,client,snapshot:empty(),running:false,again:false,message:user?'Loading personal choices…':'',conflict:''};
  if(old?.channel)setTimeout(()=>{void old.client.removeChannel(old.channel);},0);
  if(user)ctx.snapshot=cached(ctx)||empty();
  notify();
  if(user)setTimeout(async()=>{
   if(current!==ctx)return;
   await claimGuest(ctx);if(current!==ctx)return;
   void client.realtime.setAuth(session.access_token);
   ctx.channel=client.channel('math2ai-learning-'+user+'-'+uuid()).on('postgres_changes',{event:'*',schema:'public',table:'math2ai_learning',filter:'user_id=eq.'+user},event=>{if(event.new?.course_version===course.version)void sync(ctx);}).subscribe(state=>{if(state==='SUBSCRIBED')void sync(ctx);});
   void sync(ctx);
  },0);
 }
 function set(key,value){
  const ctx=current;if(!ctx||value==='done'||!valid(key,value))return false;
  const latest=cached(ctx);if(ctx.user&&latest&&latest.revision>ctx.snapshot.revision)ctx.snapshot=latest;
  if(choices(ctx)[key]===value)return true;
  const waiting=pending(ctx),previous=waiting.filter(op=>op.key===key).at(-1);
  const time=waiting.reduce((n,op)=>Math.max(n,Math.floor(op.time)+1),Date.now());
  const op={id:uuid(),key,value,base:ctx.snapshot.fields[key]?.revision||0,parent:previous?.id||null,time};
  write(keyFor(ctx.owner,'op:'+op.id),JSON.stringify(op));ctx.conflict='';
  if(ctx.user){ctx.message='Saving personal choices…';setTimeout(()=>{void sync(ctx);},0);}
  notify();return true;
 }
 window.math2aiLearning={setSession,set,status,sync:()=>sync(),subscribe(fn){listeners.add(fn);fn(status());return()=>listeners.delete(fn);}};
 window.addEventListener('storage',event=>{
  const ctx=current;if(!ctx||event.key!==null&&!event.key.startsWith(keyFor(ctx.owner,''))&&!event.key.startsWith(prefix+'transfer:'))return;
  if(event.key)memory.delete(event.key);else memory.clear();
  const value=ctx.user?cached(ctx):null;if(value&&value.revision>=ctx.snapshot.revision)ctx.snapshot=value;
  notify();
  if(ctx.user&&(event.key===null||event.key.includes(':op:')||event.key.startsWith(prefix+'transfer:')))void sync(ctx);
 });
 const resume=()=>{if(document.visibilityState==='hidden')return;if(current?.user)void sync();else notify();};
 window.addEventListener('online',resume);window.addEventListener('focus',resume);window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',resume);setInterval(resume,30000);
})();
