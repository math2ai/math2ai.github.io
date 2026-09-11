(() => {
 'use strict';
 const course = JSON.parse(document.getElementById('course-data').textContent);
 const items = course.concepts, key = 'model-conversations-progress-v1';
 const el = id => document.getElementById(id);
 const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fresh = () => ({version:course.version, current:0, concepts:{}});
 const validIndex = n => Number.isInteger(n) && n >= 0 && n < items.length;
 let state = fresh(), storageOK = true, storageMessage = '';
 let selected = null, checked = false;
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
 try { restore(localStorage.getItem(key)); } catch { storageOK = false; }
 function save() {
  state.currentConceptId = items[state.current].legacyId;
  try { localStorage.setItem(key, JSON.stringify(state)); storageOK = true; } catch { storageOK = false; }
  el('storage-note').textContent = storageOK ? storageMessage : 'Progress works for this session, but this browser cannot save it locally.';
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
  const c = items[state.current], q = question(c);
  el('question').textContent = q.question;
  el('choices').innerHTML = q.options.map((o,i) => `<label class="option"><input type="radio" name="answer" value="${i}" ${selected === i ? 'checked' : ''} ${checked ? 'disabled' : ''}><span>${escape(o)}</span></label>`).join('');
  el('check').disabled = selected === null || checked;
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
  state.current = index; history.replaceState(null,'',`#lesson-${items[index].legacyId}`); render(true);
 }
 el('choices').addEventListener('change', e => {
  const value = Number(e.target.value);
  if (e.target.name === 'answer' && !checked && choice(value)) { selected = value; el('check').disabled = false; }
 });
 el('quiz-form').addEventListener('submit', e => {
  e.preventDefault(); if (selected === null || checked) return;
  const c = items[state.current], p = progress(c), q = question(c), old = p.answers[q.id];
  p.answers[q.id] = {first:old ? old.first : selected, last:selected, attempts:old ? old.attempts + 1 : 1, solved:!!(old && old.solved) || selected === q.correct};
  checked = true; p.pending = false; save(); navigation(); quiz(); el('feedback').focus({preventScroll:true});
 });
 el('retry').onclick = () => { selected = null; checked = false; progress(items[state.current]).pending = true; save(); quiz(); el('choices').querySelector('input').focus(); };
 el('another').onclick = () => {
  const c = items[state.current]; draw(c); selected = null; checked = false;
  // Repeating a question does not increase its distinct correct-answer count.
  quiz(); save(); el('question').focus({preventScroll:true});
 };
 el('next').onclick = () => go((state.current + 1) % items.length);
 el('previous').onclick = () => go(state.current - 1);
 el('concept-select').onchange = e => go(Number(e.target.value));
 el('reset').onclick = () => {
  if (window.confirm('Clear all saved practice answers and return to concept 1 on this browser?')) { state = fresh(); storageMessage = ''; go(0); }
 };
 el('subtitle').textContent = course.subtitle;
 function hashIndex() {
  const match = location.hash.match(/^#(lesson|concept)-(\d+)$/);
  if (!match) return null;
  const identity = match[1] === 'lesson' ? +match[2] : course.previousOrder?.[+match[2] - 1];
  const index = items.findIndex(c => c.legacyId === identity);
  return validIndex(index) ? index : null;
 }
 const initial = hashIndex(); if (initial !== null) state.current = initial;
 window.addEventListener('hashchange', () => { const index = hashIndex(); if (index !== null) go(index); });
 history.replaceState(null,'',`#lesson-${items[state.current].legacyId}`);
 render();
})();
