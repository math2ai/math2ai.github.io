(() => {
 'use strict';
 const course = JSON.parse(document.getElementById('course-data').textContent);
 const items = course.concepts, persistence = window.math2aiProgress;
 const el = id => document.getElementById(id);
 const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const notation = window.math2aiMath;
 const content = (text,key) => notation ? notation.html(text,key) : escape(text);
 const spoken = (text,key) => notation ? notation.label(text,key) : text;
 const write = (node,text,key) => notation ? notation.write(node,text,key) : (node.textContent = text);
 const byId = new Map(items.map(c => [c.legacyId,c]));
 const visits = new Map();
 function conceptLink(target,text,inline=false) {
  const c=byId.get(target);
  return `<a href="#lesson-${target}" data-concept-id="${target}"${inline ? ` class="concept-reference" title="Review ${escape(c.title)}"` : ''}>${escape(text)}</a>`;
 }
 function writeLesson(node,c,field) {
  const text=c[field] || '', mentions=c.connections?.mentions.filter(m=>m.field===field) || [];
  const used=new Set();
  const prose=part=>{
   const matches=[];
   for(const m of mentions) {
    if(used.has(m.target))continue;
    let start=part.indexOf(m.text);
    while(start>=0) {
     const end=start+m.text.length, word=ch=>ch && /[\p{L}\p{N}_]/u.test(ch);
     if(!word(part[start-1])&&!word(part[end])) {matches.push({start,end,m});break;}
     start=part.indexOf(m.text,start+1);
    }
   }
   let result='',end=0;
   for(const hit of matches.sort((a,b)=>a.start-b.start)) {
    if(hit.start<end)continue;
    result+=escape(part.slice(end,hit.start))+conceptLink(hit.m.target,hit.m.text,true);
    used.add(hit.m.target);end=hit.end;
   }
   return result+escape(part.slice(end));
  };
  node.textContent=text;
  node.innerHTML=notation ? notation.html(text,`c:${c.legacyId}:${field}`,prose) : prose(text);
 }
 const conceptMenu = window.math2aiConceptMenu?.({select:el('concept-select'),trigger:el('concept-trigger'),list:el('concept-options'),label:el('concept-label'),onChoose:index=>go(index)});
 const learning=window.math2aiLearning;
 let personal=learning?.status() || {owner:'loading',ready:false,values:{},message:''};
 const marker=c=>personal.values['concept:'+c.legacyId]==='revisit'?'revisit':'none';
 const markerLabel=value=>value==='revisit'?'Revisit later':'';
 const fresh = () => ({version:course.version, current:0, concepts:{}});
 const validIndex = n => Number.isInteger(n) && n >= 0 && n < items.length;
 let state = fresh(), storageMessage = '', owner = null, viewRevision = null, ready = false, initialRender = true;
 let selected = null, checked = false;
 // Review uses the same answer journal, with its own temporary question and draft.
 // It never changes the lesson's active question or shuffled order.
 let review = null, lessonDraft = null;
 const reviewPreferences = new Map();
 const reviewPrefix = 'math2ai-review-v1:' + JSON.parse(el('auth-config').textContent).supabaseUrl + ':' + course.version + ':';
 const object = v => v && typeof v === 'object' && !Array.isArray(v);
 const choice = n => Number.isInteger(n) && n >= 0 && n < 4;
 function savedRound(raw,qid,answer,pending=false) {
  const valid = object(raw) && raw.questionId === qid && Number.isInteger(raw.attempts) && raw.attempts >= 0 && raw.attempts <= 2 &&
   (raw.attempts === 0 ? raw.last === null : choice(raw.last));
  const r = valid ? {questionId:qid,attempts:raw.attempts,last:raw.last,pending:raw.pending ?? pending,draft:choice(raw.draft) ? raw.draft : null} :
   {questionId:qid,attempts:Math.min(answer?.attempts || 0,2),last:answer?.last ?? null,pending,draft:null};
  // A global reset also invalidates rounds saved while this tab was closed.
  if (!answer && r.attempts) { r.attempts=0; r.last=null; r.pending=true; r.draft=null; }
  r.pending=r.pending===true;
  return r;
 }
 // Progress is a convenience cache. Discard incompatible or malformed records.
 function restore(raw) {
  let old;
  try { old = JSON.parse(raw); } catch { storageMessage = 'Saved progress could not be read. Starting fresh.'; return; }
  if (!object(old)) return;
  if (old.version !== course.version) { storageMessage = 'The question bank has been updated. Practice progress starts fresh with this update.'; return; }
  const identity = Number.isInteger(old.currentConceptId) ? old.currentConceptId :
   (Number.isInteger(old.current) ? course.previousOrder?.[old.current] : null);
  const restoredIndex = items.findIndex(c => c.legacyId === identity);
  if (validIndex(restoredIndex)) state.current = restoredIndex;
  if (!object(old.concepts)) return;
  for (const c of items) {
   const p = old.concepts[c.legacyId];
   if (!object(p)) continue;
   const ids = new Set(c.questions.map(q => q.id)), answers = {};
   if (object(p.answers)) for (const q of c.questions) {
    const a = p.answers[q.id];
    if (object(a) && choice(a.first) && choice(a.last) && Number.isSafeInteger(a.attempts) && a.attempts > 0 && typeof a.solved === 'boolean') {
     answers[q.id] = {first:a.first, last:a.last, attempts:a.attempts, solved:a.solved || a.first === q.correct || a.last === q.correct};
    }
   }
   const active = ids.has(p.active) ? p.active : null;
   const remaining = Array.isArray(p.remaining) ? [...new Set(p.remaining.filter(id => ids.has(id) && id !== active))] : [];
   const rounds = {};
   if (object(p.rounds)) for (const q of c.questions) if (object(p.rounds[q.id])) rounds[q.id]=savedRound(p.rounds[q.id],q.id,answers[q.id]);
   const round = active ? savedRound(p.round || rounds[active],active,answers[active],p.pending === true) : null;
   if (active) rounds[active]=round;
   const order = Array.isArray(p.order) ? [...new Set(p.order.filter(id=>ids.has(id)))] : [];
   // Retain the active question and unseen order when upgrading older saves.
   if (order.length !== ids.size) {
    order.splice(0,order.length,...(active ? [...ids].filter(id=>id!==active&&!remaining.includes(id)).concat(active,remaining) : shuffle([...ids])));
   }
   state.concepts[c.legacyId] = {active, remaining, order, rounds, answers, round, pending:round?.pending ?? true};
  }
 }
 function save() {
  if (!review) {
   const p=progress(items[state.current]);
   if (p.round) { p.round.pending=p.pending; p.round.draft=checked ? null : selected; p.rounds[p.active]=p.round; }
  }
  state.currentConceptId = items[state.current].legacyId;
  persistence.saveView(state);
  rememberVisit();
 }
 function progress(c) {
  return state.concepts[c.legacyId] || (state.concepts[c.legacyId] = {active:null, remaining:[], order:[], rounds:{}, answers:{}, pending:true});
 }
 function shuffle(values) {
  const deck = values.slice();
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
 }
 function draw(c,step=1) {
  const p = progress(c);
  if (!p.order.length) p.order=shuffle(c.questions.map(q=>q.id));
  const index=p.active ? (p.order.indexOf(p.active)+step+p.order.length)%p.order.length : 0;
  p.active=p.order[index]; p.remaining=p.order.slice(index+1);
  p.round=currentRound(c,question(c)); p.pending=p.round.pending;
  restoreChoice(c);
 }
 function restoreChoice(c) {
  const p=progress(c), q=question(c), r=currentRound(c,q);
  checked=r.attempts>0 && (!p.pending || roundFinished(r,q));
  selected=checked ? r.last : r.draft ?? null;
 }
 function question(c) { return c.questions.find(q => q.id === progress(c).active); }
 // A practice round has two attempts. Lifetime answer history remains independent.
 // Starting a new question or review round does not erase earlier results.
 function currentRound(c,q) {
  if (review?.active?.q.id === q.id) return review.active.round;
  const p = progress(c);
  if (!p.round || p.round.questionId !== q.id) p.round = p.rounds[q.id] || savedRound(null,q.id,p.answers[q.id],!p.answers[q.id]);
  p.rounds[q.id]=p.round;
  return p.round;
 }
 function roundFinished(r,q) { return r.attempts >= 2 || r.attempts > 0 && r.last === q.correct; }
 function correctCount(c) {
  return Object.values(progress(c).answers).filter(a => a.solved).length;
 }
 function reviewFacts() {
  return items.map(c => {
   const answers = progress(c).answers;
   const tried = c.questions.filter(q => answers[q.id]);
   const missed = tried.filter(q => answers[q.id].last !== q.correct).length;
   const confident = tried.filter(q => answers[q.id].first === q.correct && answers[q.id].last === q.correct).length;
   const first = tried.filter(q => answers[q.id].first === q.correct).length;
   const latest = tried.length - missed;
   return {c, answers, tried:tried.length, first, latest, missed, confident,solid:confident >= 3 && !missed};
  });
 }
 function suggestedTopics() {
  const facts = reviewFacts(), missed = facts.filter(f => f.missed), tried = facts.filter(f => f.tried);
  return new Set((missed.length ? missed : tried.length ? tried : [{c:items[state.current]}]).map(f => f.c.legacyId));
 }
 function readReviewSelection() {
  let saved = reviewPreferences.get(owner);
  if (!saved) try { saved = JSON.parse(localStorage.getItem(reviewPrefix + owner)); } catch {}
  return Array.isArray(saved) ? new Set(saved.filter(id => items.some(c => c.legacyId === id))) : suggestedTopics();
 }
 function saveReviewSelection() {
  if (!ready) return;
  const ids = [...review.selection];
  reviewPreferences.set(owner,ids);
  try { localStorage.setItem(reviewPrefix + owner,JSON.stringify(ids)); } catch {}
 }
 function matchingTopics() {
  const search = review.search.trim().toLocaleLowerCase();
  return reviewFacts().filter(f => (!search || `${String(f.c.id).padStart(3,'0')} ${f.c.title} ${f.c.chapter}`.toLocaleLowerCase().includes(search)) &&
   (review.filter === 'all' || review.filter === 'bookmarked' && marker(f.c)==='revisit' || review.filter === 'practiced' && f.tried || review.filter === 'revisit' && f.missed ||
    review.filter === 'solid' && f.solid || review.filter === 'selected' && review.selection.has(f.c.legacyId)));
 }
 function selectionSignature() { return [...review.selection].sort((a,b) => a-b).join(','); }
 function reviewSelectionBar() {
  const n = review.selection.size;
  el('review-selection-count').textContent = `${n} ${n === 1 ? 'topic' : 'topics'} selected`;
  el('review-start').disabled = !ready || !n;
  el('review-start').textContent = review.active && review.signature === selectionSignature() ? 'Resume review' : 'Start review';
  el('review-scope').textContent = `${n} ${n === 1 ? 'topic' : 'topics'}`;
 }
 function reviewSummary() {
  reviewSelectionBar();
  if (review.stage !== 'choose') return;
  const topics = el('review-topics'), focus = topics.contains(document.activeElement) ? document.activeElement.id : null;
  // Retain disclosure state and keyboard focus when live stats change.
  for (const detail of review.filtered ? [] : topics.querySelectorAll('details')) {
   if (detail.open) review.opened.add(Number(detail.dataset.chapter)); else review.opened.delete(Number(detail.dataset.chapter));
  }
  const matches = matchingTopics();
  review.filtered = !!review.search.trim() || review.filter !== 'all';
  el('review-search').disabled = !ready; el('review-filter').disabled = !ready;
  el('review-suggested').disabled = !ready; el('review-clear').disabled = !ready || !review.selection.size;
  el('review-bookmarks').disabled=!ready || !personal.ready;
  el('review-personal-note').hidden=review.filter!=='bookmarked';
  el('review-no-matches').textContent=review.filter==='bookmarked'&&!review.search.trim()?'No concepts saved for later. Use Revisit later on any lesson.':'No topics match. Try a different search or filter.';
  el('review-loading').hidden = ready;
  el('review-no-matches').hidden = !ready || !!matches.length;
  topics.hidden = !ready;
  if (!ready) return;
  topics.innerHTML = course.chapters.map((chapter,index) => {
   const rows = matches.filter(f => f.c.chapter === chapter.title);
   if (!rows.length) return '';
   const totalSelected = items.filter(c => c.chapter === chapter.title && review.selection.has(c.legacyId)).length;
   const allSelected = rows.every(f => review.selection.has(f.c.legacyId));
   const open = review.search.trim() || review.filter !== 'all' || review.opened.has(index);
   return `<details class="review-chapter" data-chapter="${index}" ${open ? 'open' : ''}><summary id="review-heading-${index}"><span>${escape(chapter.title)}</span><span class="review-chapter-count">${totalSelected ? totalSelected + ' selected' : ''}</span></summary>
    <button type="button" class="review-chapter-select" id="review-chapter-${index}" data-chapter="${index}">${allSelected ? 'Deselect shown' : 'Select shown'}</button>
    <table class="review-table" aria-label="${escape(chapter.title)} topic statistics" aria-describedby="review-help"><thead><tr><th scope="col">Topic</th><th scope="col">Tried</th><th scope="col">Correct<br>first</th><th scope="col">Correct<br>latest</th></tr></thead><tbody>${rows.map(f => {
     const manual=markerLabel(marker(f.c));
     const label = f.solid ? 'Looking solid' : f.missed ? 'Worth revisiting' : !f.tried ? 'Not tried' : '';
     return `<tr><th scope="row"><div class="review-topic-label"><input type="checkbox" name="review-topic" id="review-topic-${f.c.legacyId}" value="${f.c.legacyId}" aria-label="Review ${String(f.c.id).padStart(3,'0')} · ${escape(f.c.title)}" ${review.selection.has(f.c.legacyId) ? 'checked' : ''}><span><a class="review-lesson" href="#lesson-${f.c.legacyId}" aria-label="Open ${escape(f.c.title)}">${String(f.c.id).padStart(3,'0')} · ${escape(f.c.title)}</a>${manual?`<span class="review-personal-status">${manual}</span>`:''}${label ? `<span class="review-topic-status${f.solid ? ' solid' : ''}">${label}</span>` : ''}</span></div></th>
      <td><span class="review-stat-label" aria-hidden="true">Tried</span>${f.tried}/${f.c.questions.length}</td><td><span class="review-stat-label" aria-hidden="true">Correct first</span>${f.tried ? f.first + '/' + f.tried : '—'}</td><td><span class="review-stat-label" aria-hidden="true">Correct latest</span>${f.tried ? f.latest + '/' + f.tried : '—'}</td></tr>`;
    }).join('')}</tbody></table></details>`;
  }).join('');
  if (focus) {
   const target = document.getElementById(focus);
   (target || el('review-filter')).focus({preventScroll:true});
  }
 }
 function drawReview() {
  const facts = reviewFacts().filter(f => review.selection.has(f.c.legacyId));
  let candidates = facts.flatMap(f => f.c.questions.map(q => ({f,q})));
  if (!candidates.length) { review.active = null; return; }
  if (candidates.every(({q}) => review.seen.has(q.id))) review.seen.clear();
  candidates = candidates.filter(({q}) => !review.seen.has(q.id));
  if (candidates.every(({f}) => review.concepts.has(f.c.legacyId))) review.concepts.clear();
  candidates = candidates.filter(({f}) => !review.concepts.has(f.c.legacyId));
  const priority = ({f,q}) => {
   const a = f.answers[q.id];
   if (a && a.last !== q.correct) return 0;
   if (!a && f.missed) return 1;
   if (a && a.first !== q.correct) return 2;
   return a ? 4 : 3;
  };
  const previous = review.active?.q.id;
  if (candidates.length > 1) candidates = candidates.filter(({q}) => q.id !== previous);
  const next = shuffle(candidates).sort((a,b) => priority(a)-priority(b))[0];
  review.active = {c:next.f.c,q:next.q,round:{questionId:next.q.id,attempts:0,last:null}};
  review.seen.add(next.q.id); review.concepts.add(next.f.c.legacyId);
  selected = null; checked = false;
 }
 function displayMode() {
  el('review-panel').hidden = !review;
  el('lesson-panel').hidden = !!review;
  el('lesson-pager').hidden = !!review;
  el('review-link').setAttribute('aria-current', review ? 'page' : 'false');
  el('review-back').href = `#lesson-${items[state.current].legacyId}`;
  el('review-chooser').hidden = !review || review.stage !== 'choose';
  el('review-session').hidden = !review || review.stage !== 'practice';
  document.querySelector('.skip').href = review ? '#review-title' : '#title';
 }
 function openReview(focus = true) {
  if (!ready) requestedReview = true;
  if (!review) {
   const p = progress(items[state.current]);
   lessonDraft = {selected,checked,active:p.active,answer:JSON.stringify(p.answers[p.active]),scroll:window.scrollY || 0};
   review = {stage:'choose',selection:ready ? readReviewSelection() : new Set(),search:'',filter:'all',
    opened:new Set([course.chapters.findIndex(ch => ch.title === items[state.current].chapter)]),active:null,seen:new Set(),concepts:new Set()};
   el('review-search').value = ''; el('review-filter').value = 'all';
   el('review-topics').innerHTML = '';
  }
  history.replaceState(null,'','#review');
  displayMode(); reviewSummary(); quiz();
  if (focus) { el('review-title').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
 }
 function returnToLesson() {
  requestedReview = false;
  const draft = lessonDraft;
  review = null; lessonDraft = null; displayMode(); render();
  const p = progress(items[state.current]);
  if (draft && draft.active === p.active && (!draft.checked || draft.answer === JSON.stringify(p.answers[p.active]))) {
   selected = draft.selected; checked = draft.checked; quiz();
  }
  // A remote change or review answer to this question must not restore stale feedback.
  history.replaceState(null,'',`#lesson-${items[state.current].legacyId}`);
  el('review-link').focus({preventScroll:true});
  window.scrollTo({top:draft?.scroll || 0,behavior:'instant'});
 }
 function sourceList(sources) {
  return sources.map(s => `<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer" title="${escape(s.title)}" aria-label="${escape(s.title)} (opens in a new tab)">${escape(s.label || 'Reading')}<span aria-hidden="true"> ↗</span></a>`).join('');
 }
 function navigation() {
  const c = items[state.current], correct = correctCount(c);
  el('concept-score').textContent = '✓';
  el('concept-score').hidden = correct === 0;
  el('concept-score').setAttribute('aria-label', 'Answered correctly');
  el('concept-score').title = 'Answered correctly';
  el('concept-select').innerHTML = course.chapters.map(ch => `<optgroup label="${escape(ch.title)}">${items.filter(item => item.chapter === ch.title).map(item => {
   const n = correctCount(item);
   return `<option value="${item.id - 1}">${String(item.id).padStart(3,'0')} · ${escape(item.title)}${n ? ' ✓' : ''}${markerLabel(marker(item))?' · '+markerLabel(marker(item)):''}</option>`;
  }).join('')}</optgroup>`).join('');
  el('concept-personal').textContent=markerLabel(marker(c));
  el('concept-personal').hidden=marker(c)==='none';
  el('mark-revisit').setAttribute('aria-pressed',String(marker(c)==='revisit'));
  el('mark-revisit').disabled=!personal.ready;
  el('concept-select').value = state.current;
  conceptMenu?.update(items.map(item=>({title:item.title,chapter:item.chapter,marker:markerLabel(marker(item)),text:`${String(item.id).padStart(3,'0')} · ${item.title}${correctCount(item) ? ' ✓' : ''}`})),state.current);
 }
 function quiz() {
  const c = review ? review.active?.c : items[state.current], q = review ? review.stage === 'practice' && review.active?.q : question(c);
  el('quiz-panel').hidden = !!review && !q;
  el('review-concept').hidden = !review || !q;
  const nextLabel = review ? 'Next review question' : 'Next question';
  el('another').setAttribute('aria-label',nextLabel);
  el('another').setAttribute('title',nextLabel);
  el('previous-question').hidden = !!review;
  el('previous-question').disabled = !ready;
  el('reset').disabled = !ready;
  if (!q) return;
  el('question-position').textContent = review ? 'Review question' : `Question ${progress(c).order.indexOf(q.id) + 1} of ${c.questions.length}`;
  const r = currentRound(c,q), finished = roundFinished(r,q);
  if (review) { el('review-concept').textContent = c.title; el('review-concept').href = `#lesson-${c.legacyId}`; }
  write(el('question'),q.question,`q:${q.id}:question`);
  el('question-group').setAttribute('aria-label',spoken(q.question,`q:${q.id}:question`));
  el('choices').innerHTML = q.options.map((o,i) => `<label class="option"><input type="radio" name="answer" aria-label="${escape(spoken(o,`q:${q.id}:option:${i}`))}" value="${i}" ${selected === i ? 'checked' : ''} ${checked || finished || !ready ? 'disabled' : ''}><span>${content(o,`q:${q.id}:option:${i}`)}</span></label>`).join('');
  el('check').disabled = !ready || selected === null || checked || finished;
  el('check').hidden = checked || finished;
  el('another').disabled = !ready;
  el('retry').disabled = !ready;
  el('reset').disabled = !ready;
  el('retry').hidden = !checked || finished || r.attempts !== 1;
  el('reset-question').hidden = !finished;
  el('reset-question').disabled = !ready;
  el('feedback').hidden = r.attempts === 0;
  if (r.attempts) {
   const correct = r.last === q.correct;
   const heading = correct ? 'Correct.' : finished ? 'Not quite. The correct answer is: ' + content(q.options[q.correct],`q:${q.id}:option:${q.correct}`) + '.' : checked ? 'Not quite.' : 'Try again.';
   el('feedback').innerHTML = `<strong>${heading}</strong><p>${content(finished ? q.feedback : q.retryFeedback,`q:${q.id}:${finished ? 'feedback' : 'retryFeedback'}`)}</p>`;
  }
  notation?.refresh(el('content'));
  el('next').disabled = false;
  el('next').textContent = state.current === items.length - 1 ? 'Back to start' : 'Next concept';
 }
 function render(focus = false) {
  const c = items[state.current], p = progress(c);
  if (!p.active) draw(c);
  restoreChoice(c);
  document.title = course.title;
  el('chapter').textContent = `${String(c.id).padStart(3,'0')} · ${c.chapter}`;
  for (const id of ['title','formula','metaphor']) write(el(id),c[id],`c:${c.legacyId}:${id}`);
  for (const id of ['definition','example','formulaNote']) writeLesson(el(id==='formulaNote'?'formula-note':id),c,id);
  el('formula-note').hidden = !c.formulaNote;
  el('previous').disabled = state.current === 0;
  el('concept-sources').hidden = !c.sources.length;
  el('concept-source-list').innerHTML = sourceList(c.sources);
  const applications=c.connections?.usedIn || [];
  el('concept-applications').hidden=!applications.length;
  el('concept-applications').innerHTML=applications.length ? '<span>Used in:</span>'+applications.map(id=>conceptLink(id,byId.get(id).title)).join('') : '';
  navigation(); quiz(); save();
  if (focus) { el('title').focus({preventScroll:true}); window.scrollTo({top:0, behavior:'instant'}); }
 }
 // History stores reading position and question identity only. Answers remain in
 // the live, account-specific journal, so Back cannot undo resets or sync updates.
 function rememberVisit(persist=true) {
  const c=items[state.current];
  if(!ready || review || location.hash!==`#lesson-${c.legacyId}`)return;
  const key=history.state?.math2aiVisit?.key || crypto.randomUUID();
  const visit={key,owner,conceptId:c.legacyId,questionId:progress(c).active,scroll:window.scrollY || 0};
  visits.set(key,visit);
  if(persist)history.replaceState({math2aiVisit:visit},'',location.hash);
 }
 // Scroll updates stay in memory; do not spam browser history writes on mobile.
 window.addEventListener('scroll',()=>rememberVisit(false),{passive:true});
 function go(index,visit=null) {
  if (!validIndex(index)) return;
  conceptMenu?.close();
  requestedReview = false;
  if (review && index === state.current) { returnToLesson(); return; }
  review = null; lessonDraft = null; displayMode();
  const c=items[index], restoreVisit=visit?.owner===owner && visit.conceptId===c.legacyId && c.questions.some(q=>q.id===visit.questionId);
  state.current=index;
  if(restoreVisit) {
   const p=progress(c);p.active=visit.questionId;
   p.round=currentRound(c,question(c));p.pending=p.round.pending;
  }
  history.replaceState(restoreVisit?{math2aiVisit:visit}:null,'',`#lesson-${c.legacyId}`);
  render(!restoreVisit);
  if(restoreVisit) {
   el('title').focus({preventScroll:true});
   window.scrollTo({top:Number.isFinite(visit.scroll)?Math.max(0,visit.scroll):0,behavior:'instant'});
  }
  rememberVisit();
 }
 el('lesson-panel').addEventListener('click',e=>{
  const link=e.target.closest('a[data-concept-id]');
  if(!link || !ready || e.defaultPrevented || e.button!==0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)return;
  const index=items.findIndex(c=>c.legacyId===Number(link.dataset.conceptId));
  if(!validIndex(index))return;
  e.preventDefault();save();rememberVisit();
  history.scrollRestoration='manual';
  history.pushState(null,'',`#lesson-${items[index].legacyId}`);
  go(index);
 });
 el('mark-revisit').onclick=()=>{
  const c=items[state.current];learning?.set('concept:'+c.legacyId,marker(c)==='revisit'?'none':'revisit');
 };
 el('review-bookmarks').onclick=()=>{
  if(!review||!ready)return;
  review.search='';review.filter='bookmarked';review.selection=new Set(items.filter(c=>marker(c)==='revisit').map(c=>c.legacyId));
  el('review-search').value='';el('review-filter').value='bookmarked';saveReviewSelection();reviewSummary();
 };
 el('review-search').addEventListener('input', e => { if (!review || !ready) return; review.search = e.target.value; reviewSummary(); });
 el('review-filter').onchange = e => { if (!review || !ready) return; review.filter = e.target.value; reviewSummary(); };
 el('review-topics').addEventListener('change', e => {
  if (!review || !ready || e.target.name !== 'review-topic') return;
  const id = Number(e.target.value);
  if (!items.some(c => c.legacyId === id)) return;
  if (e.target.checked) review.selection.add(id); else review.selection.delete(id);
  saveReviewSelection(); reviewSummary();
 });
 el('review-topics').addEventListener('click', e => {
  const button = e.target.closest('button[data-chapter]');
  if (!review || !ready || !button) return;
  const chapter = course.chapters[Number(button.dataset.chapter)];
  if (!chapter) return;
  const rows = matchingTopics().filter(f => f.c.chapter === chapter.title);
  const remove = rows.every(f => review.selection.has(f.c.legacyId));
  for (const f of rows) if (remove) review.selection.delete(f.c.legacyId); else review.selection.add(f.c.legacyId);
  saveReviewSelection(); reviewSummary();
 });
 el('review-suggested').onclick = () => { if (!review || !ready) return; review.selection = suggestedTopics(); saveReviewSelection(); reviewSummary(); };
 el('review-clear').onclick = () => { if (!review || !ready) return; review.selection.clear(); saveReviewSelection(); reviewSummary(); };
 el('review-start').onclick = () => {
  if (!review || !ready || !review.selection.size) return;
  const signature = selectionSignature();
  if (!review.active || signature !== review.signature) {
   review.active = null; review.seen.clear(); review.concepts.clear(); drawReview();
  }
  review.signature = signature; review.stage = 'practice'; saveReviewSelection();
  displayMode(); reviewSelectionBar(); quiz();
  el('review-title').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'});
 };
 el('review-change').onclick = () => {
  if (!review) return;
  review.stage = 'choose'; displayMode(); reviewSummary(); quiz();
  el('review-title').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'});
 };
 el('choices').addEventListener('change', e => {
  const value = Number(e.target.value);
  const c = review ? review.active?.c : items[state.current], q = review ? review.active?.q : question(c);
  if (ready && q && e.target.name === 'answer' && !checked && !roundFinished(currentRound(c,q),q) && choice(value)) { selected = value; el('check').disabled = false; if (!review) save(); }
 });
 el('quiz-form').addEventListener('submit', e => {
  e.preventDefault(); if (!ready || selected === null || checked) return;
  const c = review ? review.active?.c : items[state.current], q = review ? review.active?.q : question(c);
  if (!q) return;
  const r = currentRound(c,q);
  if (roundFinished(r,q)) return;
  const p = progress(c), old = p.answers[q.id];
  if (!persistence.record(q.id,selected)) return;
  p.answers[q.id] = {first:old ? old.first : selected, last:selected, attempts:old ? old.attempts + 1 : 1, solved:!!(old && old.solved) || selected === q.correct};
  r.attempts++; r.last = selected; r.pending=false; r.draft=null;
  checked = true;
  if (p.active === q.id) { p.pending = false; p.round = {...r}; p.rounds[q.id]=p.round; }
  save(); if (review) reviewSummary();
  navigation(); quiz(); el('feedback').focus({preventScroll:true});
 });
 el('retry').onclick = () => {
  const c = review ? review.active?.c : items[state.current], q = review ? review.active?.q : question(c);
  if (!ready || !q || !checked) return;
  const r = currentRound(c,q);
  if (r.attempts !== 1 || roundFinished(r,q)) return;
  selected = null; checked = false;
  if (!review) { progress(c).pending = true; save(); }
  quiz(); el('choices').querySelector('input').focus();
 };
 el('reset-question').onclick = () => {
  const c = review ? review.active?.c : items[state.current], q = review ? review.active?.q : question(c);
  if (!ready || !q) return;
  const r = currentRound(c,q);
  if (!roundFinished(r,q)) return;
  r.attempts = 0; r.last = null; selected = null; checked = false;
  if (!review) { progress(c).pending = true; save(); }
  quiz(); el('choices').querySelector('input').focus();
 };
 el('another').onclick = () => {
  if (!ready) return;
  if (review) { drawReview(); reviewSummary(); quiz(); return; }
  const c = items[state.current]; draw(c);
  // Browsing preserves each question's draft, feedback and retry budget.
  quiz(); save();
 };
 el('previous-question').onclick = () => {
  if (!ready || review) return;
  draw(items[state.current],-1); quiz(); save();
 };
 el('next').onclick = () => go((state.current + 1) % items.length);
 el('previous').onclick = () => go(state.current - 1);
 el('concept-select').onchange = e => go(Number(e.target.value));
 el('reset').onclick = async () => {
  if (!ready) return;
  const originalOwner = owner;
  const scope = persistence.status().account ? 'your account on all devices' : 'guest practice in this browser';
  if (window.confirm(`Clear all saved answers for ${scope}?`) && await persistence.reset() && owner === originalOwner) { review = null; lessonDraft = null; state = fresh(); storageMessage = ''; go(0); }
 };
 el('subtitle').textContent = course.subtitle;
 function hashIndex() {
  const match = location.hash.match(/^#(lesson|concept)-(\d+)$/);
  if (!match) return null;
  const identity = match[1] === 'lesson' ? +match[2] : course.previousOrder?.[+match[2] - 1];
  const index = items.findIndex(c => c.legacyId === identity);
  return validIndex(index) ? index : null;
 }
 const requestedIndex = hashIndex();
 let requestedReview = location.hash === '#review';
 window.addEventListener('hashchange', () => {
  if (location.hash === '#review') { openReview(); return; }
  const index = hashIndex();
  const stored=history.state?.math2aiVisit;
  if (index !== null) go(index,visits.get(stored?.key) || stored);
  else if (review) returnToLesson();
 });
 persistence.subscribe(update => {
  ready = update.ready;
  el('storage-note').textContent = update.message;
  el('save-description').textContent = update.account ? 'Answers sync to your account. Site updates may reset progress.' : 'Guest answers are saved in this browser. Sign in to save across devices.';
  if (owner !== update.owner || viewRevision !== update.viewRevision || initialRender) {
   visits.clear();
   review = null; lessonDraft = null;
   owner = update.owner;
   viewRevision = update.viewRevision;
   state = fresh();
   if (update.state) restore(JSON.stringify(update.state));
   if (initialRender && requestedIndex !== null) state.current = requestedIndex;
   if (ready) initialRender = false;
   history.replaceState(null,'',`#lesson-${items[state.current].legacyId}`);
   displayMode(); render();
   if (requestedReview && ready) { requestedReview = false; openReview(false); }
  } else {
   for (const c of items) {
    const p = progress(c);
    p.answers = update.state?.concepts[c.legacyId]?.answers || {};
    // A global reset must clear inactive lesson rounds as well as the visible one.
    for (const [qid,r] of Object.entries(p.rounds)) if (r.attempts && !p.answers[qid]) {
     r.attempts=0; r.last=null; r.pending=true; r.draft=null;
     if (qid===p.active) {
      p.round=r; p.pending=true;
      if (!review && c === items[state.current]) { selected=null; checked=false; }
     }
    }
   }
   if (review) {
    const a = review.active && progress(review.active.c).answers[review.active.q.id];
    if (review.active?.round.attempts && !a) { review.active.round.attempts = 0; review.active.round.last = null; selected = null; checked = false; }
    reviewSummary(); navigation(); quiz(); return;
   }
   // Other devices update answer history, not this round's choice, feedback or retry budget.
   navigation(); quiz();
  }
 });
 learning?.subscribe(update=>{
  personal=update;
  el('learning-note').textContent=[update.message,update.conflict].filter(Boolean).join(' ');
  el('learning-note').hidden=!el('learning-note').textContent;
  navigation();if(review)reviewSummary();
 });
})();
