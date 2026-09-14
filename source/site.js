(() => {
 'use strict';
 const course = JSON.parse(document.getElementById('course-data').textContent);
 const items = course.concepts, persistence = window.math2aiProgress;
 const el = id => document.getElementById(id);
 const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fresh = () => ({version:course.version, current:0, concepts:{}});
 const validIndex = n => Number.isInteger(n) && n >= 0 && n < items.length;
 let state = fresh(), storageMessage = '', owner = null, viewRevision = null, ready = false, initialRender = true;
 let selected = null, checked = false;
 // Review uses the same answer journal, with its own temporary question and draft.
 // It never changes the lesson's active question or randomized deck.
 let review = null, lessonDraft = null;
 const reviewPreferences = new Map();
 const reviewPrefix = 'math2ai-review-v1:' + JSON.parse(el('auth-config').textContent).supabaseUrl + ':' + course.version + ':';
 const object = v => v && typeof v === 'object' && !Array.isArray(v);
 const choice = n => Number.isInteger(n) && n >= 0 && n < 4;
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
   state.concepts[c.legacyId] = {active, remaining, answers, pending:p.pending === true};
  }
 }
 function save() {
  state.currentConceptId = items[state.current].legacyId;
  persistence.saveView(state);
 }
 function progress(c) {
  return state.concepts[c.legacyId] || (state.concepts[c.legacyId] = {active:null, remaining:[], answers:{}, pending:true});
 }
 function shuffle(values) {
  const deck = values.slice();
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
 }
 function draw(c) {
  const p = progress(c);
  if (!p.remaining.length) {
   p.remaining = shuffle(c.questions.map(q => q.id));
   // Even at a cycle boundary, never immediately repeat the current question.
   if (p.remaining[0] === p.active) [p.remaining[0], p.remaining[1]] = [p.remaining[1], p.remaining[0]];
  }
  p.active = p.remaining.shift(); p.pending = true;
 }
 function question(c) { return c.questions.find(q => q.id === progress(c).active); }
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
   (review.filter === 'all' || review.filter === 'practiced' && f.tried || review.filter === 'revisit' && f.missed ||
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
     const label = f.solid ? 'Looking solid' : f.missed ? 'Worth revisiting' : !f.tried ? 'Not tried' : '';
     return `<tr><th scope="row"><label class="review-topic-label" for="review-topic-${f.c.legacyId}"><input type="checkbox" name="review-topic" id="review-topic-${f.c.legacyId}" value="${f.c.legacyId}" aria-label="Review ${String(f.c.id).padStart(3,'0')} · ${escape(f.c.title)}" ${review.selection.has(f.c.legacyId) ? 'checked' : ''}><span>${String(f.c.id).padStart(3,'0')} · ${escape(f.c.title)}${label ? `<span class="review-topic-status${f.solid ? ' solid' : ''}">${label}</span>` : ''}</span></label></th>
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
  review.active = {c:next.f.c,q:next.q};
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
  return '<ul class="sources-list">' + sources.map(s => `<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a></li>`).join('') + '</ul>';
 }
 function navigation() {
  const c = items[state.current], correct = correctCount(c);
  el('concept-score').textContent = '✓';
  el('concept-score').hidden = correct === 0;
  el('concept-score').setAttribute('aria-label', 'Answered correctly');
  el('concept-score').title = 'Answered correctly';
  el('concept-select').innerHTML = course.chapters.map(ch => `<optgroup label="${escape(ch.title)}">${items.filter(item => item.chapter === ch.title).map(item => {
   const n = correctCount(item);
   return `<option value="${item.id - 1}">${String(item.id).padStart(3,'0')} · ${escape(item.title)}${n ? ' ✓' : ''}</option>`;
  }).join('')}</optgroup>`).join('');
  el('concept-select').value = state.current;
 }
 function quiz() {
  const c = review ? review.active?.c : items[state.current], q = review ? review.stage === 'practice' && review.active?.q : question(c);
  el('quiz-panel').hidden = !!review && !q;
  el('review-concept').hidden = !review || !q;
  el('another').textContent = review ? 'Next review question' : 'Another question';
  el('reset').disabled = !ready;
  if (!q) return;
  if (review) { el('review-concept').textContent = c.title; el('review-concept').href = `#lesson-${c.legacyId}`; }
  el('question').textContent = q.question;
  el('choices').innerHTML = q.options.map((o,i) => `<label class="option"><input type="radio" name="answer" value="${i}" ${selected === i ? 'checked' : ''} ${checked || !ready ? 'disabled' : ''}><span>${escape(o)}</span></label>`).join('');
  el('check').disabled = !ready || selected === null || checked;
  el('another').disabled = !ready;
  el('retry').disabled = !ready;
  el('reset').disabled = !ready;
  el('retry').hidden = !checked || selected === q.correct;
  el('feedback').hidden = !checked;
  if (checked) el('feedback').innerHTML = `<strong>${selected === q.correct ? 'Correct.' : 'Not quite. The correct answer is: ' + escape(q.options[q.correct]) + '.'}</strong><p>${escape(q.feedback)}</p>`;
  el('next').disabled = false;
  el('next').textContent = state.current === items.length - 1 ? 'Back to start' : 'Next concept';
 }
 function render(focus = false) {
  const c = items[state.current], p = progress(c);
  if (!p.active) draw(c);
  const a = p.pending ? null : p.answers[p.active]; selected = a ? a.last : null; checked = !!a;
  document.title = course.title;
  el('chapter').textContent = `${String(c.id).padStart(3,'0')} · ${c.chapter}`;
  for (const id of ['title','definition','formula','example','metaphor']) el(id).textContent = c[id];
  el('previous').disabled = state.current === 0;
  el('concept-sources').hidden = !c.sources.length;
  el('concept-source-list').innerHTML = sourceList(c.sources);
  navigation(); quiz(); save();
  if (focus) { el('title').focus({preventScroll:true}); window.scrollTo({top:0, behavior:'instant'}); }
 }
 function go(index) {
  if (!validIndex(index)) return;
  requestedReview = false;
  if (review && index === state.current) { returnToLesson(); return; }
  review = null; lessonDraft = null; displayMode();
  state.current = index; history.replaceState(null,'',`#lesson-${items[index].legacyId}`); render(true);
 }
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
  if (ready && e.target.name === 'answer' && !checked && choice(value)) { selected = value; el('check').disabled = false; }
 });
 el('quiz-form').addEventListener('submit', e => {
  e.preventDefault(); if (!ready || selected === null || checked) return;
  const c = review ? review.active?.c : items[state.current], q = review ? review.active?.q : question(c);
  if (!q) return;
  const p = progress(c), old = p.answers[q.id];
  if (!persistence.record(q.id,selected)) return;
  p.answers[q.id] = {first:old ? old.first : selected, last:selected, attempts:old ? old.attempts + 1 : 1, solved:!!(old && old.solved) || selected === q.correct};
  checked = true;
  if (!review) { p.pending = false; save(); } else reviewSummary();
  navigation(); quiz(); el('feedback').focus({preventScroll:true});
 });
 el('retry').onclick = () => { if (!ready) return; selected = null; checked = false; if (!review) { progress(items[state.current]).pending = true; save(); } quiz(); el('choices').querySelector('input').focus(); };
 el('another').onclick = () => {
  if (!ready) return;
  if (review) { drawReview(); reviewSummary(); quiz(); el('question').focus({preventScroll:true}); return; }
  const c = items[state.current]; draw(c); selected = null; checked = false;
  // Repeating a question does not increase its distinct correct-answer count.
  quiz(); save(); el('question').focus({preventScroll:true});
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
  if (index !== null) go(index);
  else if (review) returnToLesson();
 });
 persistence.subscribe(update => {
  ready = update.ready;
  el('storage-note').textContent = update.message;
  el('save-description').textContent = update.account ? 'Answers sync to your account. Site updates may reset progress.' : 'Guest answers are saved in this browser. Sign in to save across devices.';
  if (owner !== update.owner || viewRevision !== update.viewRevision || initialRender) {
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
   for (const c of items) progress(c).answers = update.state?.concepts[c.legacyId]?.answers || {};
   if (review) {
    const a = review.active && progress(review.active.c).answers[review.active.q.id];
    if (review.active && checked) { selected = a ? a.last : null; checked = !!a; }
    reviewSummary(); navigation(); quiz(); return;
   }
   const p = progress(items[state.current]), a = p.pending ? null : p.answers[p.active];
   // Keep a draft choice intact while another tab updates completion indicators.
   if (checked || selected === null) { selected = a ? a.last : null; checked = !!a; }
   navigation(); quiz();
  }
 });
})();
