// Anonymous usage counts and who is online. No account, cookie, key or visitor ID is sent:
// events name only a lesson or question, and "online" is a once-a-minute heartbeat that says nothing but the lesson shown.
(() => {
 'use strict';
 const el = id => document.getElementById(id);
 const config = JSON.parse(el('auth-config').textContent);
 const api = window.math2aiStats = {lesson() {}, answer() {}, flush() {}};
 // Count only on the published site, so offline copies and local builds add nothing.
 if (!config.supabaseUrl || !config.publishableKey || !window.supabase ||
  location.protocol !== 'https:' || location.hostname !== 'math2ai.github.io') return;
 let client;
 try {
  // A separate client without a session: statistics never carry the signed-in account.
  client = window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
   auth: {persistSession:false, autoRefreshToken:false, detectSessionInUrl:false, storageKey:'math2ai-stats'}
  });
 } catch { return; }
 // Browsers that ask not to be tracked can read the totals but are not counted.
 const optedOut = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
 const MINUTE = 60000;
 const number = n => Number(n).toLocaleString('en-US');
 const counted = new Set();
 let queue = [], timer = null, sending = false, totals = null, lesson = null, shown = null, lastBeat = 0;

 function render() {
  const parts = [];
  if (totals && Number(totals.online) > 0) parts.push(`${number(totals.online)} online` +
   (shown === lesson && Number(totals.here) > 1 ? ` (${number(totals.here)} on this lesson)` : ''));
  if (totals) parts.push(`${number(totals.visitors)} ${Number(totals.visitors) === 1 ? 'visitor' : 'visitors'} so far`);
  el('stats-summary').textContent = parts.length ? parts.join(' · ') + '.' : '';
  el('stats-privacy').textContent = optedOut ? 'Your browser asks not to be tracked, so this visit is not counted.' :
   'Visits and answers are counted anonymously.';
  // Stay silent until the server answers: the note must not promise statistics that are not set up.
  el('stats-note').hidden = !totals;
 }
 // One heartbeat a minute for this browser, shared by its tabs through a stored time (not an identifier),
 // so reloads and extra tabs do not make one person look like several.
 function beatDue() {
  if (optedOut || document.visibilityState !== 'visible') return false;
  let stored = 0;
  try { stored = Number(localStorage.getItem('math2ai-stats-beat')) || 0; } catch {}
  const last = Math.max(lastBeat,stored), now = Date.now();
  return now - last >= MINUTE || last > now;
 }
 function flush() {
  clearTimeout(timer); timer = null;
  if (sending) return;
  const beat = beatDue(), batch = queue.splice(0,50);
  // With nothing to count, only a visible page asks again: for its first totals or after changing lesson.
  const refresh = document.visibilityState === 'visible' && (!totals || shown !== lesson);
  if (!batch.length && !beat && !refresh) return;
  if (beat) { lastBeat = Date.now(); try { localStorage.setItem('math2ai-stats-beat',String(lastBeat)); } catch {} }
  sending = true;
  const asked = lesson;
  // Counting is best effort: a failed request is dropped, never retried or stored.
  Promise.resolve(client.rpc('math2ai_stats_count',{p_events:batch, p_beat:beat, p_lesson:asked})).then(({data,error}) => {
   if (!error && data && Number.isFinite(Number(data.visitors))) {
    totals = data; shown = asked; render();
    if (shown !== lesson) schedule();
   }
   // A failure is not retried at once; the next event or the minute timer tries again.
  },() => {}).finally(() => { sending = false; if (queue.length) schedule(); });
 }
 function schedule() { if (!timer) timer = setTimeout(flush,1500); }
 function push(event) {
  if (optedOut || queue.length >= 200) return;
  queue.push(event); schedule();
 }

 let firstVisit = false;
 try {
  // A yes/no flag, not an identifier: it only stops one browser counting as a new visitor twice.
  firstVisit = localStorage.getItem('math2ai-stats-visitor') === null;
  localStorage.setItem('math2ai-stats-visitor','1');
 } catch { firstVisit = false; }
 push({type:'visit', new:firstVisit});
 schedule(); render();

 api.lesson = id => {
  lesson = id;
  if (!counted.has(id)) { counted.add(id); push({type:'lesson', id}); }
  render(); schedule();
 };
 api.answer = (question,choice,first) => push({type:'answer', question, choice, first:!!first});
 api.flush = flush;
 setInterval(flush,MINUTE);
 window.addEventListener('pagehide',flush);
 document.addEventListener('visibilitychange',flush);
})();
