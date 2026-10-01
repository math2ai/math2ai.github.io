// Public statistics page: read anonymous totals and show them as plain tables.
(() => {
 'use strict';
 const MIN_FIRST_TRIES = 5, HARDEST = 15;
 const count = v => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; };
 const four = v => Array.from({length:4},(_,i) => count(Array.isArray(v) ? v[i] : 0));

 // Pure summary of the course and the stored counts; no DOM access.
 function summarize(course,data) {
  const answers = data?.answers || {}, views = data?.lessons || {}, online = data?.online?.lessons || {};
  const questions = [];
  const lessons = course.concepts.map(c => {
   let firstTries = 0, firstCorrect = 0, attempts = 0;
   for (const q of c.questions) {
    const first = four(answers[q.id]?.first), total = four(answers[q.id]?.total);
    const tries = first.reduce((a,b) => a+b,0), all = total.reduce((a,b) => a+b,0);
    if (!all) continue;
    firstTries += tries; firstCorrect += first[q.correct]; attempts += all;
    // The wrong choice picked most often on a first try points at the misleading option.
    const wrong = first.map((n,i) => ({n,i})).filter(o => o.i !== q.correct && o.n).sort((a,b) => b.n-a.n || a.i-b.i)[0];
    questions.push({id:q.id, lesson:c.title, legacyId:c.legacyId, position:c.id, question:q.question, firstTries:tries,
     firstCorrect:first[q.correct], attempts:all, rate:tries ? first[q.correct]/tries : null,
     commonWrong:wrong ? q.options[wrong.i] : null, commonWrongCount:wrong ? wrong.n : 0});
   }
   return {position:c.id, legacyId:c.legacyId, title:c.title, chapter:c.chapter, views:count(views[c.legacyId]),
    online:count(online[c.legacyId]), firstTries, firstCorrect, attempts, rate:firstTries ? firstCorrect/firstTries : null};
  });
  const hardest = questions.filter(q => q.firstTries >= MIN_FIRST_TRIES)
   .sort((a,b) => a.rate-b.rate || b.firstTries-a.firstTries || a.position-b.position || a.id.localeCompare(b.id)).slice(0,HARDEST);
  const totals = {};
  for (const key of ['visitors','visits','lessonViews','answers']) totals[key] = count(data?.totals?.[key]);
  const days = (Array.isArray(data?.days) ? data.days : []).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d?.day))
   .map(d => ({day:d.day, visitors:count(d.visitors), visits:count(d.visits), lessonViews:count(d.lessonViews), answers:count(d.answers)}));
  return {totals, online:count(data?.online?.total), lessons, questions, hardest, days, minFirstTries:MIN_FIRST_TRIES};
 }
 globalThis.math2aiStatsSummarize = summarize;
 if (typeof document === 'undefined' || !document.getElementById('stats-app')) return;

 const el = id => document.getElementById(id);
 const number = n => Number(n).toLocaleString('en-US');
 const percent = rate => rate === null ? '—' : Math.round(rate*100) + '%';
 const node = (tag,text,attributes = {}) => {
  const e = document.createElement(tag);
  if (text !== undefined && text !== null) e.textContent = text;
  for (const [k,v] of Object.entries(attributes)) e.setAttribute(k,v);
  return e;
 };
 let course = null, data = null, sort = {key:'position', descending:false};

 function tiles(summary) {
  const items = [
   ['Online', number(summary.online)],
   ['Visitors', number(summary.totals.visitors)],
   ['Visits', number(summary.totals.visits)],
   ['Lesson views', number(summary.totals.lessonViews)],
   ['Answers checked', number(summary.totals.answers)],
  ];
  el('tiles').replaceChildren(...items.map(([label,value]) => {
   const tile = node('div',null,{class:'tile'});
   tile.append(node('div',label,{class:'tile-label'}),node('div',value,{class:'tile-value'}));
   return tile;
  }));
 }
 function lessonsTable(summary) {
  const columns = [['position','#'],['title','Lesson'],['online','Online'],['views','Views'],['firstTries','First tries'],['rate','Correct on first try']];
  const rows = summary.lessons.slice().sort((a,b) => {
   const x = a[sort.key], y = b[sort.key];
   // Lessons without answers stay at the bottom whichever way the rate is sorted.
   const order = x === y ? 0 : x === null ? 1 : y === null ? -1 : typeof x === 'string' ? x.localeCompare(y) * (sort.descending ? -1 : 1) : (x-y) * (sort.descending ? -1 : 1);
   return order || a.position-b.position;
  });
  const head = node('tr');
  for (const [key,label] of columns) {
   const th = node('th',null,{scope:'col','aria-sort':sort.key === key ? (sort.descending ? 'descending' : 'ascending') : 'none'});
   const button = node('button',label,{type:'button'});
   button.onclick = () => { sort = {key, descending:sort.key === key ? !sort.descending : !['position','title'].includes(key)}; render(); };
   th.append(button); head.append(th);
  }
  const body = rows.map(r => {
   const tr = node('tr');
   const link = node('a',r.title,{href:'./#lesson-' + r.legacyId});
   const title = node('th',null,{scope:'row'}); title.append(link);
   tr.append(node('td',String(r.position).padStart(3,'0')),title,node('td',r.online ? number(r.online) : ''),
    node('td',number(r.views)),node('td',number(r.firstTries)),node('td',percent(r.rate)));
   return tr;
  });
  el('lessons-head').replaceChildren(head); el('lessons-body').replaceChildren(...body);
 }
 function hardestTable(summary) {
  el('hardest-empty').hidden = !!summary.hardest.length;
  el('hardest-empty').textContent = `Nothing to show yet. A question appears here after ${summary.minFirstTries} first tries.`;
  el('hardest').hidden = !summary.hardest.length;
  el('hardest-body').replaceChildren(...summary.hardest.map(q => {
   const tr = node('tr');
   const prompt = node('th',null,{scope:'row'});
   prompt.append(node('span',q.question),node('br'),node('a',`${String(q.position).padStart(3,'0')} · ${q.lesson}`,{href:'./#lesson-' + q.legacyId,class:'small'}));
   tr.append(prompt,node('td',number(q.firstTries)),node('td',percent(q.rate)),
    node('td',q.commonWrong ? `${q.commonWrong} (${number(q.commonWrongCount)})` : ''));
   return tr;
  }));
 }
 function daysTable(summary) {
  el('days-empty').hidden = !!summary.days.length; el('days').hidden = !summary.days.length;
  el('days-body').replaceChildren(...summary.days.slice(0,30).map(d => {
   const tr = node('tr');
   tr.append(node('th',d.day,{scope:'row'}),node('td',number(d.visitors)),node('td',number(d.visits)),node('td',number(d.lessonViews)),node('td',number(d.answers)));
   return tr;
  }));
  const first = summary.days.at(-1)?.day;
  el('since').textContent = first && summary.days.length < 90 ? `Counting started on ${first}.` : '';
 }
 function render() {
  if (!course || !data) return;
  const summary = summarize(course,data);
  tiles(summary); lessonsTable(summary); hardestTable(summary); daysTable(summary);
  el('content').hidden = false;
 }

 async function start() {
  const status = el('status');
  let config;
  try {
   [config,course] = await Promise.all(['source/auth-config.json','source/dist/curriculum.json'].map(async path => {
    const response = await fetch(path); if (!response.ok) throw Error(path); return response.json();
   }));
  } catch { status.textContent = 'The course data could not be loaded. Open this page from the website.'; return; }
  if (!config.supabaseUrl || !config.publishableKey || !window.supabase) { status.textContent = 'Statistics are not set up for this copy of the course.'; return; }
  const client = window.supabase.createClient(config.supabaseUrl,config.publishableKey,{
   auth:{persistSession:false, autoRefreshToken:false, detectSessionInUrl:false, storageKey:'math2ai-stats'}});
  const published = location.protocol === 'https:' && location.hostname === 'math2ai.github.io';
  const optedOut = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  // Someone reading this page is on the site too, but on no lesson. The stored time is shared
  // with the course page, so a browser with both open still sends one heartbeat a minute.
  async function beat() {
   if (!published || optedOut) return;
   const now = Date.now();
   try {
    const last = Number(localStorage.getItem('math2ai-stats-beat')) || 0;
    if (now - last < 60000 && last <= now) return;
    localStorage.setItem('math2ai-stats-beat',String(now));
   } catch {}
   await Promise.resolve(client.rpc('math2ai_stats_count',{p_events:[], p_beat:true, p_lesson:null})).catch(() => {});
  }
  async function load() {
   await beat();
   const {data:result,error} = await client.rpc('math2ai_stats_read');
   if (error || !result) { if (!data) status.textContent = 'Statistics are not available yet.'; return; }
   data = result; status.textContent = ''; status.hidden = true; render();
  }
  await load();
  setInterval(() => { if (document.visibilityState === 'visible') void load(); },60000);
 }
 void start();
})();
