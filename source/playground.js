(() => {
 'use strict';
 const get=id=>document.getElementById(id),panel=get('explore');
 if(!panel)return;
 const definitions=JSON.parse(get('playground-data').textContent),drafts=new Map();
 const source=get('explore-expression'),status=get('explore-status'),output=get('explore-result');
 let current=null,worker=null,workerUrl=null,deadline=null,pending=null,generation=0,suspended=false;
 function stop() {
  generation++;
  clearTimeout(pending);pending=null;clearTimeout(deadline);deadline=null;
  if(worker)worker.terminate();worker=null;
  if(workerUrl)URL.revokeObjectURL(workerUrl);workerUrl=null;
  output.setAttribute('aria-busy','false');
 }
 function clearResult() {output.replaceChildren();output.hidden=true;status.textContent='';}
 function text(tag,value,parent) {const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
 function result(entry) {
  const row=document.createElement('span');row.className='explore-result-row';output.append(row);
  if(entry.kind==='text')text('span',entry.text,row);
  else if(entry.kind==='plot'){row.className+=' explore-plot-row';window.math2aiRenderPlot(entry,row);}
  else {
   const rows=entry.rows;
   const wrapper=document.createElement('span');wrapper.className='explore-matrix';
   const table=document.createElement('table');table.setAttribute('aria-label',rows.map((r,i)=>'Row '+(i+1)+': '+r.join(', ')).join('; '));
   const tbody=document.createElement('tbody');
   for(const values of rows){const tr=document.createElement('tr');for(const v of values)text('td',v,tr);tbody.append(tr);}
   table.append(tbody);wrapper.append(table);row.append(wrapper);
  }
  if(entry.note)text('span',entry.note,output).className='explore-output-note';
 }
 function run() {
  if(!current||suspended)return;
  stop();clearResult();drafts.set(current,source.value);
  if(!source.value.trim())return;
  const token=generation;
  output.setAttribute('aria-busy','true');status.textContent='Calculating…';
  try {
   if(typeof Worker!=='function')throw new Error('unavailable');
   const blob=new Blob([get('playground-library').textContent,'\n',get('playground-engine').textContent,'\n',get('playground-worker').textContent],{type:'text/javascript'});
   workerUrl=URL.createObjectURL(blob);worker=new Worker(workerUrl);
   worker.onmessage=event=>{
    if(token!==generation)return;
    stop();
    if(event.data.ok) {
     status.textContent='';output.hidden=false;
     for(const entry of event.data.results)result(entry);
    } else status.textContent=event.data.error;
   };
   worker.onerror=event=>{
    event.preventDefault();if(token!==generation)return;stop();
    status.textContent='This calculation could not start. Edit the code to try again.';
   };
   deadline=setTimeout(()=>{if(token!==generation)return;stop();status.textContent='This calculation took too long. Try a smaller expression.';},3500);
   worker.postMessage(source.value);
  } catch {
   stop();status.textContent='Live calculations are unavailable in this browser. The worked example above is still available.';
  }
 }
 function resizeEditor() {source.rows=Math.min(12,Math.max(3,source.value.split('\n').length));}
 function change(id) {
  id=String(id);
  if(id===current) {
   // Account/quiz updates must not reset a draft or restart an active calculation.
   if(suspended){suspended=false;panel.hidden=false;run();}
   return;
  }
  if(current)drafts.set(current,source.value);
  stop();current=Object.hasOwn(definitions,id)?id:null;suspended=false;
  panel.hidden=!current;clearResult();
  if(!current)return;
  source.value=drafts.get(current)??definitions[current].expression;resizeEditor();run();
 }
 function suspend() {suspended=true;stop();clearResult();}
 get('explore-reset').addEventListener('click',()=>{
  if(!current||suspended)return;
  source.value=definitions[current].expression;resizeEditor();run();
 });
 source.addEventListener('input',()=>{
  stop();clearResult();resizeEditor();
  if(!current||suspended)return;
  drafts.set(current,source.value);
  // Wait for a pause in typing; never show an old answer for newly edited code.
  if(source.value.trim())pending=setTimeout(run,300);
 });
 source.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();run();}});
 window.addEventListener('pagehide',suspend);
 window.addEventListener('pageshow',event=>{
  if(event.persisted&&current&&!get('lesson-panel').hidden){suspended=false;run();}
 });
 window.math2aiPlayground={show:change,suspend};
})();
