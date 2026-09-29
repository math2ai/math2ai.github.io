// Searchable concept picker. Keep the native select if enhancement is unavailable.
(() => {
 'use strict';
 window.math2aiConceptMenu = ({select,trigger,popup,search,list,empty,onChoose}) => {
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let rows=[],visible=[],current=0,active=-1,opened=false,signature='';
  function close() {
   opened=false;popup.hidden=true;search.value='';
   trigger.setAttribute('aria-expanded','false');search.setAttribute('aria-expanded','false');
   search.removeAttribute('aria-activedescendant');
  }
  function place() {
   const box=trigger.getBoundingClientRect(),viewport=window.visualViewport;
   const top=viewport?.offsetTop || 0,bottom=top+(viewport?.height || window.innerHeight);
   const below=bottom-box.bottom-12,above=box.top-top-12,upwards=below<180 && above>below;
   popup.style.top=upwards?'auto':'calc(100% + 4px)';
   popup.style.bottom=upwards?'calc(100% + 4px)':'auto';
   popup.style.maxHeight=Math.max(80,Math.min(420,upwards?above:below))+'px';
  }
  function highlight(index,center=false) {
   active=visible.includes(index)?index:visible[0] ?? -1;
   const options=[...list.querySelectorAll('[role="option"]')];
   for(const option of options) {
    const focused=Number(option.dataset.index)===active;
    option.setAttribute('aria-selected',String(focused));
    option.classList.toggle('active',focused);
   }
   const option=options.find(option=>Number(option.dataset.index)===active);
   if(!option){search.removeAttribute('aria-activedescendant');return;}
   search.setAttribute('aria-activedescendant',option.id);
   const top=option.offsetTop,bottom=top+option.offsetHeight;
   if(center)list.scrollTop=top-(list.clientHeight-option.offsetHeight)/2;
   else if(top<list.scrollTop)list.scrollTop=top;
   else if(bottom>list.scrollTop+list.clientHeight)list.scrollTop=bottom-list.clientHeight;
  }
  function renderOptions() {
   const query=search.value.trim().toLocaleLowerCase();
   visible=rows.map((_,index)=>index).filter(index=>`${String(index+1).padStart(3,'0')} ${rows[index].title}`.toLocaleLowerCase().includes(query));
   let chapter='';
   list.innerHTML=visible.map((index,position)=>{
    const row=rows[index],heading=row.chapter!==chapter;
    const prefix=heading?`${position?'</div>':''}<div role="group" aria-label="${escape(row.chapter)}"><div class="concept-group" aria-hidden="true">${escape(row.chapter)}</div>`:'';
    chapter=row.chapter;
    return `${prefix}<div role="option" id="concept-option-${index}" data-index="${index}" aria-selected="false">${escape(row.text)}${row.marker?`<span class="menu-personal">${row.marker==='Revisit later'?'<svg viewBox="0 0 16 18" aria-hidden="true"><path d="M3 1h10v15l-5-3-5 3z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>':''}${escape(row.marker)}</span>`:''}</div>`;
   }).join('')+(visible.length?'</div>':'');
   empty.hidden=visible.length!==0;
  }
  function open(query='') {
   if(!rows.length)return;
   opened=true;search.value=query;popup.hidden=false;
   trigger.setAttribute('aria-expanded','true');search.setAttribute('aria-expanded','true');
   renderOptions();place();highlight(query?visible[0]:current,true);search.focus({preventScroll:true});
  }
  function choose() {
   if(!visible.includes(active))return;
   const index=active;
   close();onChoose(index);trigger.focus({preventScroll:true});
  }
  function update(nextRows,index) {
   const nextSignature=JSON.stringify(nextRows),changed=index!==current;
   rows=nextRows;current=index;
   trigger.textContent=(rows[current]?.text || '')+(rows[current]?.marker?' · '+rows[current].marker:'');
   trigger.setAttribute('aria-label','Choose a concept: '+trigger.textContent);
   if(changed)close();
   if(nextSignature!==signature || changed) {
    const scroll=list.scrollTop;
    renderOptions();signature=nextSignature;list.scrollTop=scroll;
   }
   if(opened)highlight(active);
   select.hidden=true;trigger.hidden=false;
  }
  trigger.addEventListener('click',()=>opened?close():open());
  trigger.addEventListener('keydown',event=>{
   if(event.isComposing || event.ctrlKey || event.metaKey || event.altKey)return;
   if(['Enter',' ','ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
    event.preventDefault();open();
    if(event.key==='Home')highlight(visible[0]);
    if(event.key==='End')highlight(visible.at(-1));
   } else if(event.key.length===1) {event.preventDefault();open(event.key);}
   else if(event.key==='Escape' && opened){event.preventDefault();close();}
  });
  search.addEventListener('input',()=>{
   renderOptions();highlight(search.value.trim()?visible[0]:current,true);
  });
  search.addEventListener('keydown',event=>{
   if(event.isComposing || event.ctrlKey || event.metaKey)return;
   const key=event.key;
   if(key==='Escape' || event.altKey && key==='ArrowUp') {
    event.preventDefault();close();trigger.focus({preventScroll:true});return;
   }
   if(key==='Enter'){event.preventDefault();choose();return;}
   if(['ArrowDown','ArrowUp','PageDown','PageUp'].includes(key) && !event.altKey) {
    event.preventDefault();
    const position=visible.indexOf(active),step={ArrowDown:1,ArrowUp:-1,PageDown:10,PageUp:-10}[key];
    highlight(visible[Math.max(0,Math.min(visible.length-1,position+step))]);
   }
   // Home/End edit the search text. Tab moves focus without choosing a lesson.
  });
  list.addEventListener('click',event=>{
   const option=event.target.closest('[role="option"]');
   if(!option||!list.contains(option)||!visible.includes(Number(option.dataset.index)))return;
   active=Number(option.dataset.index);choose();
  });
  // Keep the input focused so a mouse selection is handled before focus leaves.
  list.addEventListener('mousedown',event=>event.preventDefault());
  document.addEventListener('pointerdown',event=>{
   if(opened&&!trigger.contains(event.target)&&!popup.contains(event.target))close();
  });
  const focusOut=event=>{
   if(opened&&!trigger.contains(event.relatedTarget)&&!popup.contains(event.relatedTarget))close();
  };
  popup.addEventListener('focusout',focusOut);trigger.addEventListener('focusout',focusOut);
  const reposition=()=>{if(opened)place();};
  window.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition,{passive:true});
  window.visualViewport?.addEventListener('resize',reposition);
  window.visualViewport?.addEventListener('scroll',reposition);
  return {update,close};
 };
})();
