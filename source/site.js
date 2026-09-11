(()=>{'use strict';
 const course=JSON.parse(document.getElementById('course-data').textContent);
 const items=course.concepts, key='model-conversations-progress-v1';
 const el=id=>document.getElementById(id), escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let state={version:course.version,current:0,answers:{}},storageOK=true;
 try{
  const old=JSON.parse(localStorage.getItem(key));
  const legacy=old&&old.version==='1.0';
  if(old&&(old.version===course.version||old.version==='1.1'||legacy)&&old.answers&&typeof old.answers==='object'){
   const current=Number.isInteger(old.current)?Math.max(0,Math.min(99,old.current)):0;
   state.current=legacy?items.findIndex(c=>c.legacyId===current+1):current;
   for(const [id,a] of Object.entries(old.answers)){
    if(/^\d+$/.test(id)&&+id>=1&&+id<=100&&a&&Number.isInteger(a.first)&&a.first>=0&&a.first<4&&Number.isInteger(a.last)&&a.last>=0&&a.last<4&&Number.isInteger(a.attempts)&&a.attempts>0){
     const newId=legacy?items.find(c=>c.legacyId===+id).id:id;
     if(old.version!==course.version&&course.revisedQuestions.includes(+newId))continue;
     state.answers[newId]={first:a.first,last:a.last,attempts:a.attempts};
    }
   }
   if(legacy){
    const match=location.hash.match(/^#concept-(\d+)$/);
    const target=match?items.find(c=>c.legacyId===+match[1]):items[state.current];
    if(target)history.replaceState(null,'',`#concept-${target.id}`);
   }
  }
 }catch{storageOK=false;}
 let selected=null,checked=false;
 function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{storageOK=false;}el('storage-note').textContent=storageOK?'':'Progress works for this session, but this browser cannot save it locally.';}
 function sourceList(sources){return '<ul class="sources-list">'+sources.map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a></li>`).join('')+'</ul>';}
 function counts(){let checked=0,correct=0,first=0;for(const c of items){const a=state.answers[c.id];if(a){checked++;if(a.last===c.correct)correct++;if(a.first===c.correct)first++;}}return {checked,correct,first};}
 function navigation(){const n=counts();el('progress').value=n.checked;el('progress-text').textContent=`${n.checked}/100 checked · ${n.correct} correct`;el('concept-select').innerHTML=course.chapters.map(ch=>`<optgroup label="${escape(ch.title)}">${items.filter(c=>c.chapter===ch.title).map(c=>`<option value="${c.id-1}">${String(c.id).padStart(3,'0')} · ${escape(c.title)}${state.answers[c.id]?' · checked':''}</option>`).join('')}</optgroup>`).join('');el('concept-select').value=state.current;}
 function quiz(){const c=items[state.current];el('choices').innerHTML=c.options.map((o,i)=>`<label class="option"><input type="radio" name="answer" value="${i}" ${selected===i?'checked':''} ${checked?'disabled':''}><span>${escape(o)}</span></label>`).join('');el('check').disabled=selected===null||checked;el('retry').hidden=!checked;el('next').disabled=!checked;el('feedback').hidden=!checked;
 if(checked){const ok=selected===c.correct;el('feedback').innerHTML=`<strong>${ok?'Correct.':'The correct answer is: '+escape(c.options[c.correct])+'.'}</strong><p>${escape(c.feedback)}</p>`;}
 el('next').textContent=state.current===99?'Finish':'Next concept';el('question-hint').textContent=checked?'Read the explanation, then continue.':'Choose an answer, then check it.';
 }
 function render(focus=false){const c=items[state.current],a=state.answers[c.id];selected=a?a.last:null;checked=!!a;document.title=`${c.id}. ${c.title} | Mathematics to Model Conversations`;
 el('content').hidden=false;el('completion').hidden=true;el('chapter').textContent=`${String(c.id).padStart(3,'0')} / 100 · ${c.chapter}`;el('title').textContent=c.title;el('definition').textContent=c.definition;el('formula').textContent=c.formula;el('example').textContent=c.example;el('metaphor').textContent=c.metaphor;el('question').textContent=c.question;el('previous').disabled=state.current===0;el('concept-sources').hidden=!c.sources.length;el('concept-source-list').innerHTML=sourceList(c.sources);navigation();quiz();save();
 el('content').classList.remove('animate');void el('content').offsetWidth;el('content').classList.add('animate');if(focus){el('title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 }
 function go(index){state.current=Math.max(0,Math.min(99,index));history.replaceState(null,'',`#concept-${state.current+1}`);render(true);}
 function finish(){const n=counts();el('content').hidden=true;el('completion').hidden=false;el('completion').innerHTML=`<p class="chapter">Mathematics to Model Conversations</p><h1 tabindex="-1">${n.checked===100?'All 100 concepts checked.':'You reached concept 100.'}</h1><p>${n.checked} questions checked. ${n.correct} correct on the latest attempt. ${n.first} correct on the first attempt.</p><p>Return to any concept using the menu. A correct multiple-choice answer is a useful check; explaining the idea in your own words tests it further.</p><div class="quiz-actions"><button id="review">Review a question</button><button id="return-last">Return to concept 100</button></div>`;el('review').onclick=()=>{const first=items.findIndex(c=>!state.answers[c.id]||state.answers[c.id].last!==c.correct);go(first<0?0:first);};el('return-last').onclick=()=>go(99);el('completion').querySelector('h1').focus();window.scrollTo({top:0,behavior:'instant'});}
 el('choices').addEventListener('change',e=>{if(e.target.name==='answer'&&!checked){selected=Number(e.target.value);el('check').disabled=false;}});
 el('quiz-form').addEventListener('submit',e=>{e.preventDefault();if(selected===null||checked)return;const c=items[state.current],old=state.answers[c.id];state.answers[c.id]={first:old?old.first:selected,last:selected,attempts:old?old.attempts+1:1};checked=true;save();navigation();quiz();el('feedback').focus({preventScroll:true});});
 el('retry').onclick=()=>{selected=null;checked=false;quiz();el('choices').querySelector('input').focus();};
 el('next').onclick=()=>{if(!checked)return;if(state.current===99)finish();else go(state.current+1);};el('previous').onclick=()=>go(state.current-1);el('concept-select').onchange=e=>go(Number(e.target.value));
 el('reset').onclick=()=>{if(window.confirm('Clear all saved answers and return to concept 1 on this browser?')){state={version:course.version,current:0,answers:{}};go(0);}};
 el('about').textContent=course.about;el('context').textContent=course.context;el('background').textContent=course.background;el('mentor').textContent=course.mentor;el('all-sources').innerHTML=sourceList(course.sources);
 function hashIndex(){const match=location.hash.match(/^#concept-(\d+)$/);return match&&+match[1]>=1&&+match[1]<=100?+match[1]-1:null;}const initial=hashIndex();if(initial!==null)state.current=initial;window.addEventListener('hashchange',()=>{const index=hashIndex();if(index!==null){state.current=index;render(true);}});
 render();
})();
