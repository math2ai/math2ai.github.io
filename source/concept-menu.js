// Select-only combobox. Keep the native select available if enhancement fails.
(() => {
 'use strict';
 window.math2aiConceptMenu = ({select,trigger,list,label,onChoose}) => {
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let rows=[],current=0,active=0,opened=false,signature='',buffer='',typedAt=0;
  function close() {
   opened=false;list.hidden=true;trigger.setAttribute('aria-expanded','false');
   trigger.removeAttribute('aria-activedescendant');buffer='';
  }
  function place() {
   const box=trigger.getBoundingClientRect(),below=window.innerHeight-box.bottom-12,above=box.top-12;
   const upwards=below<180 && above>below;
   list.style.top=upwards?'auto':'calc(100% + 4px)';
   list.style.bottom=upwards?'calc(100% + 4px)':'auto';
   list.style.maxHeight=Math.max(40,Math.min(420,upwards?above:below))+'px';
  }
  function highlight(index,center=false) {
   active=Math.max(0,Math.min(rows.length-1,index));
   const options=list.querySelectorAll('[role="option"]');
   for(const option of options) {
    const focused=Number(option.dataset.index)===active;
    option.setAttribute('aria-selected',String(focused));
    option.classList.toggle('active',focused);
   }
   const option=options[active];
   if(!option)return;
   trigger.setAttribute('aria-activedescendant',option.id);
   const top=option.offsetTop,bottom=top+option.offsetHeight;
   if(center)list.scrollTop=top-(list.clientHeight-option.offsetHeight)/2;
   else if(top<list.scrollTop)list.scrollTop=top;
   else if(bottom>list.scrollTop+list.clientHeight)list.scrollTop=bottom-list.clientHeight;
  }
  function open() {
   if(!rows.length)return;
   opened=true;list.hidden=false;trigger.setAttribute('aria-expanded','true');
   place();highlight(current,true);trigger.focus({preventScroll:true});
  }
  function choose() {
   const index=active;
   close();onChoose(index);trigger.focus({preventScroll:true});
  }
  function update(nextRows,index) {
   const nextSignature=JSON.stringify(nextRows),changed=index!==current;
   rows=nextRows;current=index;
   trigger.textContent=(rows[current]?.text || '')+(rows[current]?.marker?' · '+rows[current].marker:'');
   if(nextSignature!==signature) {
    const scroll=list.scrollTop;
    let chapter='';
    list.innerHTML=rows.map((row,i)=>{
     const heading=row.chapter!==chapter;
     const prefix=heading?`${i?'</div>':''}<div role="group" aria-label="${escape(row.chapter)}"><div class="concept-group" aria-hidden="true">${escape(row.chapter)}</div>`:'';
     chapter=row.chapter;
     return `${prefix}<div role="option" id="concept-option-${i}" data-index="${i}" aria-selected="false">${escape(row.text)}${row.marker?`<span class="menu-personal">${row.marker==='Revisit later'?'<svg viewBox="0 0 16 18" aria-hidden="true"><path d="M3 1h10v15l-5-3-5 3z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>':''}${escape(row.marker)}</span>`:''}</div>`;
    }).join('')+'</div>';
    signature=nextSignature;
    list.scrollTop=scroll;
   }
   if(changed)close();
   else if(opened)highlight(active);
   select.hidden=true;trigger.hidden=false;
  }
  trigger.addEventListener('click',()=>opened?close():open());
  trigger.addEventListener('keydown',event=>{
   const key=event.key;
   if(key==='Escape'){if(opened){event.preventDefault();close();}return;}
   if(key==='Tab'){if(opened)choose();return;}
   if(['Enter',' ','ArrowDown','ArrowUp','Home','End','PageDown','PageUp'].includes(key)) {
    event.preventDefault();
    if(!opened){open();if(key==='Home')highlight(0);if(key==='End')highlight(rows.length-1);return;}
    if(key==='Enter'||key===' '||event.altKey&&key==='ArrowUp'){choose();return;}
    const next=key==='Home'?0:key==='End'?rows.length-1:active+({ArrowDown:1,ArrowUp:-1,PageDown:10,PageUp:-10}[key]||0);
    highlight(next);return;
   }
   if(key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey) {
    event.preventDefault();if(!opened)open();
    const now=Date.now();buffer=(now-typedAt<750?buffer:'')+key.toLowerCase();typedAt=now;
    if([...buffer].every(c=>c===buffer[0]))buffer=buffer[0];
    const start=buffer.length===1?active+1:active;
    for(let offset=0;offset<rows.length;offset++) {
     const index=(start+offset)%rows.length,row=rows[index];
     if(row.title.toLowerCase().startsWith(buffer)||row.text.toLowerCase().startsWith(buffer)) {highlight(index);break;}
    }
   }
  });
  list.addEventListener('click',event=>{
   const option=event.target.closest('[role="option"]');
   if(!option||!list.contains(option))return;
   active=Number(option.dataset.index);choose();
  });
  document.addEventListener('pointerdown',event=>{
   if(opened&&!trigger.contains(event.target)&&!list.contains(event.target))close();
  });
  trigger.addEventListener('blur',()=>{if(opened)close();});
  // Prevent a mouse press from moving DOM focus away before the option click.
  list.addEventListener('mousedown',event=>event.preventDefault());
  label.addEventListener('click',event=>{if(!trigger.hidden){event.preventDefault();trigger.focus();}});
  window.addEventListener('resize',()=>{if(opened){place();highlight(active,true);}});
  window.addEventListener('scroll',()=>{if(opened)close();},{passive:true});
  return {update,close};
 };
})();
